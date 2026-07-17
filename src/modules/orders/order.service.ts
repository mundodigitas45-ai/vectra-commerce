import type { CreateOrderInput } from "./order.schemas";
import { orderRepository } from "./order.repository";

export class OrderService {
  async create(input: CreateOrderInput) {
    return orderRepository.create(input);
  }

  async list() {
    return orderRepository.list();
  }
}

export const orderService = new OrderService();