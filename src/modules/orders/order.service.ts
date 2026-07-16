import type { CreateOrderInput } from "./order.schemas";
import { orderRepository } from "./order.repository";

export class OrderService {
  async create(input: CreateOrderInput) {
    return await orderRepository.create(input);
  }

  async list() {
    return await orderRepository.list();
  }
}

export const orderService = new OrderService();