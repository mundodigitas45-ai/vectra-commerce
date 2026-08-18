import {
  createHash
} from "node:crypto";

import {
  supabase
} from "../../config/supabase";

const META_CAPI_SECRET_TYPE =
  "meta_capi_access_token";

type JsonObject =
  Record<string, unknown>;

function errorWithCode(
  code: string,
  message: string
) {
  const error = new Error(
    message
  ) as Error & {
    code?: string;
  };

  error.code = code;

  return error;
}

function sha256(
  value: string
): string {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

function onlyDigits(
  value: string
): string {
  return value.replace(/\D/g, "");
}

export function normalizePhoneForMeta(
  rawPhone: string,
  phoneCountryCode: string,
  nationalLengths: number[]
): string {
  let phone =
    onlyDigits(rawPhone);

  const countryCode =
    onlyDigits(phoneCountryCode);

  const allowedNationalLengths =
    [...new Set(
      nationalLengths.filter(
        (length) =>
          Number.isInteger(length) &&
          length > 0
      )
    )];

  if (!countryCode) {
    throw errorWithCode(
      "PHONE_COUNTRY_CODE_MISSING",
      "Código telefônico do país não configurado."
    );
  }

  if (
    allowedNationalLengths.length === 0
  ) {
    throw errorWithCode(
      "PHONE_NATIONAL_LENGTHS_MISSING",
      "Comprimentos nacionais de telefone não configurados."
    );
  }

  if (!phone) {
    throw errorWithCode(
      "CUSTOMER_PHONE_MISSING",
      "Pedido sem telefone do cliente."
    );
  }

  /*
   * Formato internacional com prefixo 00:
   * 005591999999999
   * vira:
   * 5591999999999
   */
  if (phone.startsWith("00")) {
    phone =
      phone.slice(2);
  }

  /*
   * Regra mais importante:
   *
   * primeiro verificamos se o tamanho é de
   * um número NACIONAL.
   *
   * Isso evita interpretar incorretamente um
   * telefone nacional que coincidentemente
   * começa pelos mesmos dígitos do DDI.
   */
  if (
    allowedNationalLengths.includes(
      phone.length
    )
  ) {
    return countryCode + phone;
  }

  /*
   * Se não tem tamanho nacional, então pode
   * já estar em formato internacional.
   */
  if (
    phone.startsWith(countryCode)
  ) {
    const nationalPart =
      phone.slice(
        countryCode.length
      );

    if (
      allowedNationalLengths.includes(
        nationalPart.length
      )
    ) {
      return phone;
    }
  }

  throw errorWithCode(
    "CUSTOMER_PHONE_INVALID",
    "Telefone do cliente possui formato ou comprimento inválido."
  );
}

function resolveSourceUrl(
  baseUrl: string | null,
  domain: string
): string {
  const cleanBase =
    baseUrl?.trim();

  if (cleanBase) {
    return cleanBase.replace(
      /\/+$/,
      ""
    );
  }

  const cleanDomain =
    domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");

  if (!cleanDomain) {
    throw errorWithCode(
      "SITE_DOMAIN_MISSING",
      "Domínio do site não configurado."
    );
  }

  return `https://${cleanDomain}`;
}

function parseSettings(
  value: unknown
): JsonObject {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as JsonObject;
  }

  return {};
}

function getStringSetting(
  settings: JsonObject,
  key: string
): string | null {
  const value =
    settings[key];

  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized || null;
}

function getPositiveIntegerArraySetting(
  settings: JsonObject,
  key: string
): number[] {
  const value =
    settings[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => Number(item))
    .filter(
      (item) =>
        Number.isInteger(item) &&
        item > 0
    );
}

export class MetaCapiService {
  async buildPurchaseDryRun(
    outboxId: string
  ) {
    // ========================================================
    // 1. OUTBOX
    // ========================================================

    const {
      data: outbox,
      error: outboxError
    } = await supabase
      .from("meta_event_outbox")
      .select(`
        id,
        company_id,
        site_id,
        order_id,
        provider,
        event_name,
        event_id,
        status,
        attempt_count,
        created_at
      `)
      .eq("id", outboxId)
      .maybeSingle();

    if (outboxError) {
      throw new Error(
        outboxError.message
      );
    }

    if (!outbox) {
      throw errorWithCode(
        "META_OUTBOX_NOT_FOUND",
        "Evento Meta não encontrado."
      );
    }

    if (
      outbox.provider !== "meta" ||
      outbox.event_name !== "Purchase"
    ) {
      throw errorWithCode(
        "META_EVENT_UNSUPPORTED",
        "Evento não suportado pelo worker Meta."
      );
    }


    // ========================================================
    // 2. PEDIDO
    // ========================================================

    const {
      data: order,
      error: orderError
    } = await supabase
      .from("orders")
      .select(`
        id,
        company_id,
        site_id,
        order_number,
        status,
        subtotal,
        delivery_fee,
        total,
        customer_name_snapshot,
        customer_phone_snapshot,
        delivered_at,
        created_at
      `)
      .eq(
        "id",
        outbox.order_id
      )
      .maybeSingle();

    if (orderError) {
      throw new Error(
        orderError.message
      );
    }

    if (!order) {
      throw errorWithCode(
        "ORDER_NOT_FOUND",
        "Pedido do evento não encontrado."
      );
    }

    if (
      order.company_id !==
        outbox.company_id ||
      order.site_id !==
        outbox.site_id
    ) {
      throw errorWithCode(
        "META_OUTBOX_ORDER_SCOPE_MISMATCH",
        "Evento e pedido pertencem a contextos diferentes."
      );
    }

    if (
      order.status !== "delivered" ||
      !order.delivered_at
    ) {
      throw errorWithCode(
        "ORDER_NOT_DELIVERED",
        "Purchase somente pode ser montado para pedido entregue."
      );
    }


    // ========================================================
    // 3. EMPRESA
    // ========================================================

    const {
      data: company,
      error: companyError
    } = await supabase
      .from("companies")
      .select(`
        id,
        name,
        timezone,
        currency,
        settings,
        is_active
      `)
      .eq(
        "id",
        outbox.company_id
      )
      .maybeSingle();

    if (companyError) {
      throw new Error(
        companyError.message
      );
    }

    if (!company) {
      throw errorWithCode(
        "COMPANY_NOT_FOUND",
        "Empresa do pedido não encontrada."
      );
    }

    if (!company.is_active) {
      throw errorWithCode(
        "COMPANY_INACTIVE",
        "Empresa está inativa."
      );
    }

    const settings =
      parseSettings(
        company.settings
      );

    const countryCode =
      getStringSetting(
        settings,
        "country_code"
      );

    const phoneCountryCode =
      getStringSetting(
        settings,
        "phone_country_code"
      );

    const phoneNationalLengths =
      getPositiveIntegerArraySetting(
        settings,
        "phone_national_lengths"
      );

    if (!countryCode) {
      throw errorWithCode(
        "COUNTRY_CODE_MISSING",
        "País da empresa não configurado."
      );
    }

    if (!phoneCountryCode) {
      throw errorWithCode(
        "PHONE_COUNTRY_CODE_MISSING",
        "Código telefônico do país não configurado."
      );
    }

    if (
      phoneNationalLengths.length === 0
    ) {
      throw errorWithCode(
        "PHONE_NATIONAL_LENGTHS_MISSING",
        "Comprimentos nacionais de telefone não configurados."
      );
    }


    // ========================================================
    // 4. SITE
    // ========================================================

    const {
      data: site,
      error: siteError
    } = await supabase
      .from("sites")
      .select(`
        id,
        company_id,
        name,
        domain,
        base_url,
        environment,
        is_active
      `)
      .eq(
        "id",
        outbox.site_id
      )
      .eq(
        "company_id",
        outbox.company_id
      )
      .maybeSingle();

    if (siteError) {
      throw new Error(
        siteError.message
      );
    }

    if (!site) {
      throw errorWithCode(
        "SITE_NOT_FOUND",
        "Site do evento não encontrado."
      );
    }

    if (!site.is_active) {
      throw errorWithCode(
        "SITE_INACTIVE",
        "Site do evento está inativo."
      );
    }

    const eventSourceUrl =
      resolveSourceUrl(
        site.base_url,
        site.domain
      );


    // ========================================================
    // 5. INTEGRAÇÃO META PIXEL
    // ========================================================

    const {
      data: integrations,
      error: integrationError
    } = await supabase
      .from("site_integrations")
      .select(`
        id,
        company_id,
        site_id,
        provider,
        integration_type,
        public_config,
        is_enabled,
        status
      `)
      .eq(
        "company_id",
        outbox.company_id
      )
      .eq(
        "site_id",
        outbox.site_id
      )
      .eq(
        "provider",
        "meta"
      )
      .eq(
        "integration_type",
        "pixel"
      )
      .eq(
        "is_enabled",
        true
      );

    if (integrationError) {
      throw new Error(
        integrationError.message
      );
    }

    if (
      !integrations ||
      integrations.length === 0
    ) {
      throw errorWithCode(
        "META_INTEGRATION_NOT_CONFIGURED",
        "Meta Pixel não configurado para o site."
      );
    }

    if (
      integrations.length > 1
    ) {
      throw errorWithCode(
        "MULTIPLE_META_INTEGRATIONS",
        "Mais de uma integração Meta ativa encontrada para o mesmo site."
      );
    }

    const integration =
      integrations[0];

    const publicConfig =
      parseSettings(
        integration.public_config
      );

    const pixelId =
      getStringSetting(
        publicConfig,
        "pixel_id"
      );

    if (
      !pixelId ||
      !/^\d{5,100}$/.test(pixelId)
    ) {
      throw errorWithCode(
        "META_PIXEL_ID_INVALID",
        "Pixel ID Meta inválido."
      );
    }


    // ========================================================
    // 6. TOKEN CAPI VIA VAULT
    //
    // O TOKEN EXISTE SOMENTE NESTA VARIÁVEL.
    // ELE NÃO É COLOCADO NO RETORNO.
    // ========================================================

    const {
      data: accessToken,
      error: secretError
    } = await supabase.rpc(
      "get_site_integration_secret",
      {
        p_company_id:
          outbox.company_id,

        p_site_integration_id:
          integration.id,

        p_secret_type:
          META_CAPI_SECRET_TYPE
      }
    );

    if (secretError) {
      throw errorWithCode(
        "META_CAPI_SECRET_UNAVAILABLE",
        "Token CAPI não configurado ou indisponível."
      );
    }

    if (
      typeof accessToken !== "string" ||
      accessToken.trim().length < 20
    ) {
      throw errorWithCode(
        "META_CAPI_SECRET_INVALID",
        "Token CAPI inválido."
      );
    }


    // ========================================================
    // 7. ITENS DO PEDIDO
    // ========================================================

    const {
      data: items,
      error: itemsError
    } = await supabase
      .from("order_items")
      .select(`
        product_id,
        product_name_snapshot,
        quantity,
        unit_price,
        total_price
      `)
      .eq(
        "order_id",
        order.id
      )
      .eq(
        "company_id",
        order.company_id
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );

    if (itemsError) {
      throw new Error(
        itemsError.message
      );
    }

    if (
      !items ||
      items.length === 0
    ) {
      throw errorWithCode(
        "ORDER_ITEMS_NOT_FOUND",
        "Pedido entregue sem itens."
      );
    }


    // ========================================================
    // 8. USER DATA
    // ========================================================

    if (
      !order.customer_phone_snapshot
    ) {
      throw errorWithCode(
        "CUSTOMER_PHONE_MISSING",
        "Pedido sem telefone para matching CAPI."
      );
    }

    const normalizedPhone =
      normalizePhoneForMeta(
        order.customer_phone_snapshot,
        phoneCountryCode,
        phoneNationalLengths
      );

    const phoneHash =
      sha256(
        normalizedPhone
      );


    // ========================================================
    // 9. EVENT TIME
    // ========================================================

    const deliveredDate =
      new Date(
        order.delivered_at
      );

    const eventTime =
      Math.floor(
        deliveredDate.getTime() /
          1000
      );

    if (
      !Number.isFinite(eventTime) ||
      eventTime <= 0
    ) {
      throw errorWithCode(
        "DELIVERED_AT_INVALID",
        "Data de entrega inválida."
      );
    }


    // ========================================================
    // 10. PAYLOAD SEGURO
    // ========================================================

    const contents =
      items.map((item) => ({
        id:
          item.product_id,

        quantity:
          Number(
            item.quantity
          ),

        item_price:
          Number(
            item.unit_price
          )
      }));

    const payload = {
      event_name:
        "Purchase",

      event_time:
        eventTime,

      event_id:
        outbox.event_id,

      action_source:
        "website",

      event_source_url:
        eventSourceUrl,

      user_data: {
        ph: [
          phoneHash
        ]
      },

      custom_data: {
        currency:
          company.currency,

        value:
          Number(order.total),

        order_id:
          order.order_number,

        content_type:
          "product",

        content_ids:
          items.map(
            (item) =>
              item.product_id
          ),

        contents
      }
    };


    // ========================================================
    // 11. RETORNO DRY-RUN
    //
    // NÃO RETORNA:
    // - accessToken
    // - telefone puro
    // - telefone normalizado
    // ========================================================

    return {
      dry_run: true,

      ready_to_send: true,

      context: {
        outbox_id:
          outbox.id,

        order_id:
          order.id,

        order_number:
          order.order_number,

        company_id:
          company.id,

        company_name:
          company.name,

        site_id:
          site.id,

        site_name:
          site.name,

        environment:
          site.environment,

        integration_id:
          integration.id,

        pixel_id:
          pixelId,

        currency:
          company.currency,

        timezone:
          company.timezone,

        country_code:
          countryCode,

        capi_token_available:
          true
      },

      payload
    };
  }
}

export const metaCapiService =
  new MetaCapiService();
