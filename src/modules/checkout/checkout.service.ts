import { notificationService } from "../notifications/notification.service";
import { orderService } from "../orders/order.service";
import type { CreateOrderInput } from "../orders/order.schemas";
import type {
  CheckoutQuoteInput,
  PublicCheckoutOrderInput
} from "./checkout.schemas";
import { checkoutRepository } from "./checkout.repository";

const DEFAULT_WHATSAPP_NUMBER = "5591920078425";

function getPublicWhatsappNumber() {
  return (
    process.env.PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ||
    DEFAULT_WHATSAPP_NUMBER
  );
}

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function deduplicateDeliveryZones<
  T extends { neighborhood?: string | null }
>(zones: T[]) {
  const seen = new Set<string>();

  return zones.filter((zone) => {
    const key = normalizeLabel(String(zone.neighborhood ?? ""));

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}


const PRODUCT_GALLERIES: Record<string, string[]> = {
  "carregador-turbo-67w": [
    "/products/products/miranda-67w-cover.jpg",
    "/products/products/miranda-67w-real-01.jpg",
    "/products/products/miranda-67w-real-02.jpg",
    "/products/products/miranda-67w-real-03.jpg",
    "/products/products/miranda-67w-real-04.jpg",
    "/products/products/miranda-67w-real-05.jpg"
  ],
  "carregador-turbo-120w": [
    "/products/products/miranda-120w-cover.jpg",
    "/products/products/miranda-120w-real-01.jpg",
    "/products/products/miranda-120w-real-02.jpg",
    "/products/products/miranda-120w-real-03.jpg",
    "/products/products/miranda-120w-real-04.jpg"
  ],
  "carregador-turbo-20w-iphone-cabo-lightning": [
    "/products/products/miranda-20w-cover.jpg",
    "/products/products/miranda-20w-real-01.jpg",
    "/products/products/miranda-20w-real-02.jpg",
    "/products/products/miranda-20w-real-03.jpg",
    "/products/products/miranda-20w-real-04.jpg",
    "/products/products/miranda-20w-real-05.jpg",
    "/products/products/miranda-20w-real-06.jpg",
    "/products/products/miranda-20w-real-07.jpg",
    "/products/products/miranda-20w-real-08.jpg"
  ],
  "cabo-lightning-iphone-1-metro-lehmox": [
    "/products/products/miranda-cabo-cover.jpg",
    "/products/products/miranda-cabo-premium-02.jpg",
    "/products/products/miranda-cabo-real-01.jpg",
    "/products/products/miranda-cabo-real-02.jpg"
  ]
};

export class CheckoutService {
  async getStorefrontData() {
    const products = await checkoutRepository.listPublicProducts();

    return {
      products,
      storefront: {
        whatsapp_number: getPublicWhatsappNumber(),
        delivery_today: true,
        payment_on_delivery: true
      }
    };
  }

  async getPageData(slug: string) {
    const product = await checkoutRepository.findProductBySlug(slug);

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const [deliveryZonesResult, productImages] = await Promise.all([
      checkoutRepository.listDeliveryZones(),
      checkoutRepository.listActiveProductImages(product.id)
    ]);

    const deliveryZones = deduplicateDeliveryZones(deliveryZonesResult);

    const fallbackImages =
      PRODUCT_GALLERIES[product.slug] ??
      (product.image_url ? [product.image_url] : []);

    return {
      product: {
        ...product,
        images: productImages.length > 0
          ? productImages
          : fallbackImages
      },
      delivery_zones: deliveryZones,
      checkout: {
        payment_on_delivery: true,
        delivery_today: true,
        payment_methods: ["pix", "cash"] as const,
        whatsapp_number: getPublicWhatsappNumber(),
        logo_url: process.env.PUBLIC_LOGO_URL?.trim() || null
      }
    };
  }

  async listDevices() {
    const devices = await checkoutRepository.listDeviceModels();

    return {
      devices: devices.map((device) => ({
        id: device.id,
        brand: device.brand,
        model: device.model,
        connector_type: device.connector_type,
        official_max_watts: device.official_max_watts
      }))
    };
  }

  async recommendProductsForDevice(input: {
    brand: string;
    model: string;
  }) {
    const brand = input.brand.trim();
    const model = input.model.trim();

    const device =
      await checkoutRepository.findDeviceModel(brand, model);

    if (!device) {
      return {
        status: "unknown" as const,
        device: {
          brand,
          model
        },
        current_product: null,
        compatibility: null,
        message:
          "Ainda não temos dados confirmados para este aparelho.",
        recommendation: null,
        recommendations: []
      };
    }

    const catalog =
      await checkoutRepository.listCompatibilityByDeviceModel(
        device.id
      );

    const compatibleItems = catalog
      .filter((item) => item.charging_supported === true)
      .sort((a, b) => {
        const score = (item: any) =>
          (item.full_power_guaranteed === true ? 100 : 0) +
          (item.fast_charging_possible === true ? 20 : 0) +
          (item.charging_supported === true ? 5 : 0);

        return score(b) - score(a);
      });

    const candidates = await Promise.all(
      compatibleItems.map(async (item) => {
        const product =
          await checkoutRepository.getPublicProductSummary(
            item.product_id
          );

        if (
          !product ||
          Number(product.available_quantity ?? 0) <= 0
        ) {
          return null;
        }

        return {
          ...product,
          compatibility_level: item.compatibility_level,
          approved_answer: item.approved_answer,
          fast_charging_possible:
            item.fast_charging_possible,
          full_power_guaranteed:
            item.full_power_guaranteed
        };
      })
    );

    const recommendations = candidates.filter(
      (product): product is NonNullable<typeof product> =>
        product !== null
    );

    if (recommendations.length === 0) {
      return {
        status: "unknown" as const,
        device: {
          id: device.id,
          brand: device.brand,
          model: device.model
        },
        current_product: null,
        compatibility: null,
        message:
          "Não encontramos agora um carregador compatível e disponível para este aparelho.",
        recommendation: null,
        recommendations: []
      };
    }

    return {
      status: "compatible" as const,
      device: {
        id: device.id,
        brand: device.brand,
        model: device.model
      },
      current_product: null,
      compatibility: null,
      message:
        `Encontramos ${recommendations.length} produto(s) compatível(is) com seu ${device.brand} ${device.model}.`,
      recommendation: recommendations[0] ?? null,
      recommendations
    };
  }

  async checkCompatibility(input: {
    brand: string;
    model: string;
    slug: string;
  }) {
    const brand = input.brand.trim();
    const model = input.model.trim();
    const slug = input.slug.trim();

    const currentProduct = await checkoutRepository.findProductBySlug(slug);

    if (!currentProduct) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const device = await checkoutRepository.findDeviceModel(brand, model);

    if (!device) {
      return {
        status: "unknown" as const,
        device: {
          brand,
          model
        },
        current_product: {
          id: currentProduct.id,
          name: currentProduct.name,
          slug: currentProduct.slug
        },
        message:
          "Ainda não temos dados confirmados para este aparelho. Não vamos afirmar compatibilidade sem uma informação cadastrada na nossa base.",
        recommendation: null
      };
    }

    const catalog =
      await checkoutRepository.listCompatibilityByDeviceModel(device.id);

    const currentCompatibility =
      catalog.find((item) => item.product_id === currentProduct.id) ?? null;

    let recommendation = null;

    if (!currentCompatibility) {
      return {
        status: "unknown" as const,
        device: {
          id: device.id,
          brand: device.brand,
          model: device.model
        },
        current_product: {
          id: currentProduct.id,
          name: currentProduct.name,
          slug: currentProduct.slug
        },
        message:
          "Ainda não existe uma verificação aprovada deste produto para o aparelho selecionado.",
        recommendation: null
      };
    }

    if (currentCompatibility.charging_supported !== true) {
      const rankedCandidates = catalog
        .filter((item) =>
          item.product_id !== currentProduct.id &&
          item.charging_supported === true
        )
        .sort((a, b) => {
          const score = (item: any) =>
            (item.full_power_guaranteed === true ? 100 : 0) +
            (item.fast_charging_possible === true ? 20 : 0) +
            (item.charging_supported === true ? 5 : 0);

          return score(b) - score(a);
        });

      const bestCandidate = rankedCandidates[0] ?? null;

      if (bestCandidate) {
        const recommendedProduct =
          await checkoutRepository.getPublicProductSummary(
            bestCandidate.product_id
          );

        if (
          recommendedProduct &&
          Number(recommendedProduct.available_quantity ?? 0) > 0
        ) {
          recommendation = {
            ...recommendedProduct,
            compatibility_level: bestCandidate.compatibility_level,
            approved_answer: bestCandidate.approved_answer
          };
        }
      }
    }

    if (currentCompatibility.charging_supported !== true) {
      return {
        status: "not_recommended" as const,
        device: {
          id: device.id,
          brand: device.brand,
          model: device.model
        },
        current_product: {
          id: currentProduct.id,
          name: currentProduct.name,
          slug: currentProduct.slug
        },
        compatibility: currentCompatibility,
        message:
          currentCompatibility.approved_answer ||
          `Este não é o carregador mais indicado para seu ${device.brand} ${device.model}.`,
        recommendation
      };
    }

    return {
      status: "compatible" as const,
      device: {
        id: device.id,
        brand: device.brand,
        model: device.model
      },
      current_product: {
        id: currentProduct.id,
        name: currentProduct.name,
        slug: currentProduct.slug
      },
      compatibility: currentCompatibility,
      message:
        currentCompatibility.approved_answer ||
        `Compatível com seu ${device.brand} ${device.model}.`,
      recommendation: null
    };
  }


  async quote(input: CheckoutQuoteInput) {
    const product = await checkoutRepository.findProductById(input.product_id);

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const availableQuantity =
      await checkoutRepository.getAvailableQuantity(input.product_id);

    if (availableQuantity < input.quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    const deliveryZone = await checkoutRepository.findDeliveryZone(
      input.neighborhood
    );

    if (!deliveryZone) {
      throw new Error("DELIVERY_ZONE_NOT_FOUND");
    }

    const tier = await checkoutRepository.findPriceTier(
      input.product_id,
      input.quantity
    );

    const productsTotal = tier
      ? Number(tier.fixed_total_price)
      : Number(product.sale_price) * input.quantity;

    const deliveryFee = Number(deliveryZone.delivery_fee ?? 0);

    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug
      },
      quantity: input.quantity,
      unit_price: Number(product.sale_price),
      products_total: productsTotal,
      price_source: tier ? "product_price_tiers" : "sale_price",
      neighborhood: deliveryZone.neighborhood,
      delivery_fee: deliveryFee,
      total: productsTotal + deliveryFee,
      available_quantity: availableQuantity,
      payment_on_delivery: true
    };
  }

  async createOrder(
    input: PublicCheckoutOrderInput,
    hostname: string
  ) {
    const site =
      await checkoutRepository.findActiveSiteByDomain(
        hostname
      );

    if (!site) {
      throw new Error("SITE_NOT_FOUND");
    }

    const firstItem = input.items[0];

    if (!firstItem || input.items.length !== 1) {
      throw new Error("CHECKOUT_SINGLE_PRODUCT_ONLY");
    }

    const quote = await this.quote({
      product_id: firstItem.product_id,
      quantity: firstItem.quantity,
      neighborhood: input.customer.neighborhood
    });

    const orderInput: CreateOrderInput = {
      customer: {
        ...input.customer,
        neighborhood: quote.neighborhood
      },
      items: input.items,
      payment_method: input.payment_method,
      preferred_delivery_time:
        input.preferred_delivery_time ?? "Hoje",
      notes: input.notes ?? null
    };

    const order = await orderService.create(
      orderInput,
      site.id
    );

    /*
     * Pedido e reserva já foram concluídos.
     * Tracking é side effect e nunca pode invalidar a venda.
     */
    try {
      const orderRecord = Array.isArray(order)
        ? order[0]
        : order;

      const orderId =
        orderRecord &&
        typeof orderRecord === "object" &&
        "order_id" in orderRecord
          ? String(orderRecord.order_id || "")
          : "";

      if (orderId) {
        await orderService.recordTrackingConsent(
          orderId,
          input.tracking_consent ?? "unknown"
        );
      } else {
        console.error(
          "[checkout] tracking consent skipped: order_id unavailable"
        );
      }
    } catch (error) {
      console.error(
        "[checkout] tracking consent persistence failed",
        {
          error:
            error instanceof Error
              ? error.message
              : "unknown"
        }
      );
    }

    /*
     * Push também é side effect: qualquer falha aqui
     * jamais pode cancelar pedido ou reserva.
     */
    try {
      const orderRecord = Array.isArray(order)
        ? order[0]
        : order;

      const orderId =
        orderRecord &&
        typeof orderRecord === "object"
          ? String(
              ("order_id" in orderRecord
                ? orderRecord.order_id
                : "id" in orderRecord
                  ? orderRecord.id
                  : "") || ""
            )
          : "";

      const orderNumber =
        orderRecord &&
        typeof orderRecord === "object"
          ? String(
              ("order_number" in orderRecord
                ? orderRecord.order_number
                : "order_code" in orderRecord
                  ? orderRecord.order_code
                  : "") || ""
            )
          : "";

      if (orderId) {
        await notificationService.captureOrderCreated({
          siteId: site.id,
          orderId,
          orderNumber: orderNumber || null,
          total: quote.total,
          productId: quote.product.id,
          productName: quote.product.name,
          productSlug: quote.product.slug
        });
      }
    } catch (error) {
      console.error(
        "[checkout] order push failed",
        {
          error:
            error instanceof Error
              ? error.message
              : "unknown"
        }
      );
    }

    return {
      order,
      quote,
      whatsapp_number: getPublicWhatsappNumber()
    };
  }
}

export const checkoutService = new CheckoutService();
