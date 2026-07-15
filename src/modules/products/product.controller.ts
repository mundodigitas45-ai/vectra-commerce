import { FastifyReply, FastifyRequest } from "fastify";
import { productService } from "./product.service";

export class ProductController {
  async list(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    const products = await productService.list();

    return reply.send({
      success: true,
      data: products
    });
  }
}

export const productController = new ProductController();
