import { FastifyInstance } from "fastify";
import { productController } from "./product.controller";

export async function productRoutes(app: FastifyInstance) {
  app.get(
    "/api/v1/products",
    productController.list.bind(productController)
  );
}
