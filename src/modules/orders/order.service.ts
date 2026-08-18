import type { CreateOrderInput } from "./order.schemas";
import { orderRepository } from "./order.repository";

export class OrderService {
  async create(
    input: CreateOrderInput,
    siteId?: string | null
  ) {
    return orderRepository.create(
      input,
      siteId
    );
  }

  async recordTrackingConsent(
    orderId: string,
    status: "granted" | "denied" | "unknown"
  ) {
    return orderRepository.recordTrackingConsent(
      orderId,
      status
    );
  }

  async list() {
    return orderRepository.list();
  }
}

export const orderService = new OrderService();