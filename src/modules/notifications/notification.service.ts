import { randomUUID } from "node:crypto";
import webPush from "web-push";
import { supabase } from "../../config/supabase";
import type { PublicInterestEventInput } from "./notification.schemas";

const COMPANY_ID =
  process.env.COMPANY_ID ??
  "e2e1f5bc-3f6c-4868-9d9c-5c8226df9b3d";

const DEFAULT_SITE_ID =
  process.env.STOREFRONT_SITE_ID ??
  "d8c6e7c6-a6c1-4067-960a-09e5258d790d";

const PANEL_URL =
  process.env.PANEL_PUBLIC_URL ??
  "https://painel.vectradev.shop";

type ProductSummary = {
  id: string;
  name: string;
  slug: string;
};

type OrderEventInput = {
  siteId?: string | null;
  orderId: string;
  orderNumber?: string | null;
  total?: number | null;
  productId: string;
  productName: string;
  productSlug: string;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

type NotificationContent = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

class NotificationService {
  private vapidConfigured = false;

  private configureVapid(): boolean {
    if (this.vapidConfigured) return true;

    const subject = process.env.VAPID_SUBJECT;
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!subject || !publicKey || !privateKey) {
      return false;
    }

    webPush.setVapidDetails(subject, publicKey, privateKey);
    this.vapidConfigured = true;
    return true;
  }

  getPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY ?? null;
  }

  private async findProduct(
    productId: string | null | undefined
  ): Promise<ProductSummary | null> {
    if (!productId) return null;

    const { data, error } = await supabase
      .from("products")
      .select("id,name,slug")
      .eq("company_id", COMPANY_ID)
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  private async wasRecentlyCaptured(
    input: PublicInterestEventInput,
    productId: string | null
  ): Promise<boolean> {
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    let query = supabase
      .from("storefront_interest_events")
      .select("id")
      .eq("company_id", COMPANY_ID)
      .eq("session_id", input.session_id)
      .eq("event_type", input.event_type)
      .gte("created_at", since)
      .limit(1);

    query = productId
      ? query.eq("product_id", productId)
      : query.is("product_id", null);

    const { data, error } = await query;

    if (error) throw error;

    return Boolean(data?.length);
  }

  private contentFor(
    eventType: PublicInterestEventInput["event_type"] | "order_created",
    details: {
      productName?: string | null;
      brand?: string | null;
      model?: string | null;
      status?: string | null;
      orderNumber?: string | null;
      total?: number | null;
    }
  ): NotificationContent {
    if (eventType === "product_viewed") {
      return {
        title: "Interesse em produto",
        body: `Uma pessoa abriu ${details.productName ?? "um produto"}.`,
        url: `${PANEL_URL}/produtos`,
        tag: `product-view:${details.productName ?? "produto"}`
      };
    }

    if (eventType === "compatibility_checked") {
      const device = [details.brand, details.model]
        .filter(Boolean)
        .join(" ");

      return {
        title: "Compatibilidade consultada",
        body: `Uma pessoa consultou ${device || "um aparelho"}.`,
        url: `${PANEL_URL}/compatibilidade`,
        tag: `compatibility:${device || "device"}`
      };
    }

    if (eventType === "checkout_started") {
      return {
        title: "Cliente iniciou um pedido",
        body: `O formulário de ${details.productName ?? "um produto"} foi aberto.`,
        url: `${PANEL_URL}/pedidos`,
        tag: `checkout:${details.productName ?? "produto"}`
      };
    }

    const total =
      typeof details.total === "number" &&
      Number.isFinite(details.total)
        ? ` • R$ ${details.total.toFixed(2).replace(".", ",")}`
        : "";

    return {
      title: "Novo pedido recebido",
      body:
        `${details.orderNumber ?? "Novo pedido"} • ` +
        `${details.productName ?? "Produto"}${total}`,
      url: `${PANEL_URL}/pedidos`,
      tag: `order:${details.orderNumber ?? randomUUID()}`
    };
  }

  private async sendToCompany(
    eventRecordId: string,
    content: NotificationContent
  ): Promise<void> {
    if (!this.configureVapid()) {
      await supabase
        .from("storefront_interest_events")
        .update({
          notification_status: "skipped",
          processed_at: new Date().toISOString()
        })
        .eq("id", eventRecordId);

      return;
    }

    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth_key")
      .eq("company_id", COMPANY_ID)
      .eq("enabled", true);

    if (error) throw error;

    const subscriptions =
      (data ?? []) as PushSubscriptionRow[];

    if (!subscriptions.length) {
      await supabase
        .from("storefront_interest_events")
        .update({
          notification_status: "skipped",
          processed_at: new Date().toISOString()
        })
        .eq("id", eventRecordId);

      return;
    }

    let sent = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth_key
              }
            },
            JSON.stringify({
              ...content,
              icon: "/icons/vectra-192.png",
              badge: "/icons/vectra-192.png",
              timestamp: Date.now()
            }),
            {
              TTL: 120,
              urgency: "high"
            }
          );

          sent += 1;
        } catch (error) {
          failed += 1;

          const statusCode =
            typeof error === "object" &&
            error !== null &&
            "statusCode" in error
              ? Number(error.statusCode)
              : 0;

          if (statusCode === 404 || statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .update({
                enabled: false,
                updated_at: new Date().toISOString()
              })
              .eq("id", subscription.id);
          }
        }
      })
    );

    const status =
      sent > 0 && failed === 0
        ? "sent"
        : sent > 0
          ? "partial"
          : "failed";

    await supabase
      .from("storefront_interest_events")
      .update({
        notification_status: status,
        notification_sent_count: sent,
        notification_failed_count: failed,
        processed_at: new Date().toISOString()
      })
      .eq("id", eventRecordId);
  }

  async capturePublicInterest(
    input: PublicInterestEventInput
  ) {
    const product = await this.findProduct(input.product_id);

    if (input.product_id && !product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const duplicate = await this.wasRecentlyCaptured(
      input,
      product?.id ?? null
    );

    if (duplicate) {
      return {
        accepted: true,
        duplicate: true
      };
    }

    const { data, error } = await supabase
      .from("storefront_interest_events")
      .insert({
        event_id: input.event_id,
        company_id: COMPANY_ID,
        site_id: DEFAULT_SITE_ID,
        event_type: input.event_type,
        session_id: input.session_id,
        product_id: product?.id ?? null,
        product_name: product?.name ?? null,
        product_slug:
          product?.slug ??
          input.product_slug ??
          null,
        device_brand: input.device_brand ?? null,
        device_model: input.device_model ?? null,
        compatibility_status:
          input.compatibility_status ?? null,
        source_path: input.source_path ?? null
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          accepted: true,
          duplicate: true
        };
      }

      throw error;
    }

    const content = this.contentFor(input.event_type, {
      productName: product?.name,
      brand: input.device_brand,
      model: input.device_model,
      status: input.compatibility_status
    });

    try {
      await this.sendToCompany(data.id, content);
    } catch (error) {
      console.error("[push] interest dispatch failed", {
        eventId: data.id,
        error:
          error instanceof Error
            ? error.message
            : "unknown"
      });
    }

    return {
      accepted: true,
      duplicate: false
    };
  }

  async captureOrderCreated(
    input: OrderEventInput
  ): Promise<void> {
    const { data, error } = await supabase
      .from("storefront_interest_events")
      .insert({
        event_id: randomUUID(),
        company_id: COMPANY_ID,
        site_id: input.siteId ?? DEFAULT_SITE_ID,
        event_type: "order_created",
        session_id: `order:${input.orderId}`,
        product_id: input.productId,
        product_name: input.productName,
        product_slug: input.productSlug,
        order_id: input.orderId,
        order_number: input.orderNumber ?? null,
        order_total: input.total ?? null,
        source_path: "/checkout/success"
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") return;
      throw error;
    }

    await this.sendToCompany(
      data.id,
      this.contentFor("order_created", {
        productName: input.productName,
        orderNumber: input.orderNumber,
        total: input.total
      })
    );
  }
}

export const notificationService =
  new NotificationService();
