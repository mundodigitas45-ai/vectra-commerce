import type { FastifyInstance } from "fastify";

import { requireStockAdmin } from "../stock/stock.auth";
import { productController } from "./product.controller";
import { productMediaController } from "./product-media.controller";
import type {
  CreateProductInput,
  ImportGoogleDriveMediaInput,
  UpdateProductInput,
  UpdateProductMediaInput,
  UpdateProductStatusInput
} from "./product.schemas";

interface ProductParams {
  productId: string;
}

interface ProductMediaParams {
  productId: string;
  mediaId: string;
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

  app.delete<{
    Params: ProductParams;
  }>(
    "/api/v1/products/:productId",
    {
      preHandler: requireStockAdmin
    },
    productController.archive.bind(
      productController
    )
  );

  /* =====================================================
   * BIBLIOTECA UNIVERSAL DE MIDIAS
   * ===================================================== */

  app.get<{
    Params: ProductParams;
  }>(
    "/api/v1/products/:productId/media",
    {
      preHandler: requireStockAdmin
    },
    productMediaController.list.bind(
      productMediaController
    )
  );

  app.post<{
    Params: ProductParams;
    Body: ImportGoogleDriveMediaInput;
  }>(
    "/api/v1/products/:productId/media/google-drive",
    {
      preHandler: requireStockAdmin
    },
    productMediaController.importGoogleDrive.bind(
      productMediaController
    )
  );

  app.patch<{
    Params: ProductMediaParams;
    Body: UpdateProductMediaInput;
  }>(
    "/api/v1/products/:productId/media/:mediaId",
    {
      preHandler: requireStockAdmin
    },
    productMediaController.update.bind(
      productMediaController
    )
  );

  app.delete<{
    Params: ProductMediaParams;
  }>(
    "/api/v1/products/:productId/media/:mediaId",
    {
      preHandler: requireStockAdmin
    },
    productMediaController.remove.bind(
      productMediaController
    )
  );

}
