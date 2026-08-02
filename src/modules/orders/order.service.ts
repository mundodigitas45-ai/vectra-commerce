import type {
  CreateOrderInput,
  OrderStatus,
  UpdateOrderStatusInput
} from "./order.schemas";

import { orderRepository } from "./order.repository";

const allowedTransitions: Record<
  OrderStatus,
  OrderStatus[]
> = {
  draft: [
    "pending_confirmation",
    "cancelled"
  ],

  pending_confirmation: [
    "reserved",
    "confirmed",
    "cancelled"
  ],

  reserved: [
    "confirmed",
    "cancelled"
  ],

  confirmed: [
    "preparing",
    "cancelled"
  ],

  preparing: [
    "dispatched",
    "cancelled"
  ],

  dispatched: [
    "delivered",
    "cancelled"
  ],

  delivered: [],
  cancelled: []
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : String(error);
}

export class OrderService {
  async create(input: CreateOrderInput) {
    return orderRepository.create(input);
  }

  async list() {
    return orderRepository.list();
  }

  async updateStatus(
    orderId: string,
    input: UpdateOrderStatusInput
  ) {
    const order =
      await orderRepository.findById(orderId);

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const currentStatus =
      order.status as OrderStatus;

    if (currentStatus === input.status) {
      return order;
    }

    const availableTransitions =
      allowedTransitions[currentStatus] ?? [];

    if (
      !availableTransitions.includes(input.status)
    ) {
      throw new Error(
        `INVALID_STATUS_TRANSITION:${currentStatus}:${input.status}`
      );
    }

    if (input.status === "confirmed") {
      try {
        await orderRepository.confirmStock(
          orderId
        );
      } catch (error) {
        const message =
          getErrorMessage(error);

        if (
          message.includes(
            "NO_ACTIVE_RESERVATION"
          )
        ) {
          throw new Error(
            "ORDER_RESERVATION_EXPIRED"
          );
        }

        throw error;
      }
    }

    if (input.status === "cancelled") {
      const reason =
        input.reason?.trim() ||
        "Pedido cancelado pelo painel.";

      if (
        currentStatus === "confirmed" ||
        currentStatus === "preparing" ||
        currentStatus === "dispatched"
      ) {
        await orderRepository
          .returnConfirmedStock(
            orderId,
            reason
          );
      } else {
        try {
          await orderRepository
            .releaseReservedStock(
              orderId,
              reason
            );
        } catch (error) {
          const message =
            getErrorMessage(error);

          if (
            !message.includes(
              "NO_ACTIVE_RESERVATION"
            )
          ) {
            throw error;
          }
        }
      }
    }

    return orderRepository.updateStatus(
      orderId,
      input.status
    );
  }
}

export const orderService =
  new OrderService();
