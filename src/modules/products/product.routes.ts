import type { FastifyInstance } from "fastify";

import { requireStockAdmin } from "../stock/stock.auth";
import { productController } from "./product.controller";
import type {
  CreateProductInput,
  UpdateProductInput,
  UpdateProductStatusInput
} from "./product.schemas";

interface ProductParams {
  productId: string;
}

export async function productRoutes(
  app: FastifyInstance
) {
  app.get(
    "/api/v1/products",
    productController.list.bind(productController)
  );

  app.get<{
    Params: ProductParams;
  }>(
    "/api/v1/products/:productId",
    {
      preHandler: requireStockAdmin
    },
    productController.getById.bind(
      productController
    )
  );

  app.post<{
    Body: CreateProductInput;
  }>(
    "/api/v1/products",
    {
      preHandler: requireStockAdmin
    },
    productController.create.bind(
      productController
    )
  );

  app.patch<{
    Params: ProductParams;
    Body: UpdateProductInput;
  }>(
    "/api/v1/products/:productId",
    {
      preHandler: requireStockAdmin
    },
    productController.update.bind(
      productController
    )
  );

  app.patch<{
    Params: ProductParams;
    Body: UpdateProductStatusInput;
  }>(
    "/api/v1/products/:productId/status",
    {
      preHandler: requireStockAdmin
    },
    productController.updateStatus.bind(
      productController
    )
  );
}
