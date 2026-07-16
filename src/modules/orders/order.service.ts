import type { CreateOrderInput } from "./order.schemas";
import { orderRepository } from "./order.repository";

export class OrderService {
  async create(input: CreateOrderInput) {
    return await orderRepository.create(input);
  }
}

export const orderService = new OrderService();