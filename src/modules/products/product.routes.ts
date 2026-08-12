import { FastifyInstance } from "fastify";
import { productController } from "./product.controller";
import { productMediaController } from "./product-media.controller";

export async function productRoutes(app: FastifyInstance) {
  app.get(
    "/api/v1/products",
    productController.list.bind(productController)
  );

  // Compatibilidade com a primeira versão da Biblioteca de Mídias.
  app.post(
    "/api/v1/product-media/google-drive/import",
    productController.importGoogleDriveMedia.bind(productController)
  );

  // Biblioteca universal por produto.
  app.get(
    "/api/v1/products/:productId/media",
    productMediaController.list.bind(productMediaController)
  );

  app.post(
    "/api/v1/products/:productId/media/google-drive",
    productMediaController.importGoogleDrive.bind(productMediaController)
  );

  app.patch(
    "/api/v1/products/:productId/media/:mediaId",
    productMediaController.update.bind(productMediaController)
  );

  app.delete(
    "/api/v1/products/:productId/media/:mediaId",
    productMediaController.remove.bind(productMediaController)
  );

  app.post(
    "/api/v1/products",
    productController.create.bind(productController)
  );
}
