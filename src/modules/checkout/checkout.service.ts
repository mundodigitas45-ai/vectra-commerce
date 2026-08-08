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

    const deliveryZones = deduplicateDeliveryZones(
      await checkoutRepository.listDeliveryZones()
    );

    return {
      product,
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

  async createOrder(input: PublicCheckoutOrderInput) {
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

    const order = await orderService.create(orderInput);

    return {
      order,
      quote,
      whatsapp_number: getPublicWhatsappNumber()
    };
  }
}

export const checkoutService = new CheckoutService();
