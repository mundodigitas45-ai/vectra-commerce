import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import { customerService } from "./customer.service";

export class CustomerController {
  async list(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const customers = await customerService.list();

      return reply.status(200).send({
        success: true,
        data: customers
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        error: {
          code: "CUSTOMER_LIST_FAILED",
          message: "Não foi possível carregar os clientes."
        }
      });
    }
  }
}

export const customerController = new CustomerController();