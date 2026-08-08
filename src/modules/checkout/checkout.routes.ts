import type { FastifyInstance } from "fastify";
import { checkoutController } from "./checkout.controller";

export async function checkoutRoutes(app: FastifyInstance) {
  app.get(
    "/loja",
    checkoutController.storefront.bind(checkoutController)
  );

  app.get(
    "/api/v1/public/storefront",
    checkoutController.getStorefrontData.bind(checkoutController)
  );

  app.get(
    "/pedir/:slug",
    checkoutController.page.bind(checkoutController)
  );

  app.get(
    "/api/v1/public/checkout/:slug",
    checkoutController.getPageData.bind(checkoutController)
  );

  app.post(
    "/api/v1/public/checkout/quote",
    checkoutController.quote.bind(checkoutController)
  );

  app.post(
    "/api/v1/public/checkout/orders",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute"
        }
      }
    },
    checkoutController.createOrder.bind(checkoutController)
  );
}
