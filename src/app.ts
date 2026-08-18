import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { productRoutes } from "./modules/products/product.routes";
import { orderRoutes } from "./modules/orders/order.routes";
import { settingsRoutes } from "./modules/settings/settings.routes";
import { stockRoutes } from "./modules/stock/stock.routes";
import { whatsappRoutes } from "./modules/whatsapp/whatsapp.routes";
import { deliveryZoneRoutes } from "./modules/delivery-zones/delivery-zone.routes";
import { companyContextRoutes } from "./modules/auth/company-context.routes";
import { siteRoutes } from "./modules/sites/site.routes";
import { publicSiteRoutes } from "./modules/sites/public-site.routes";
import { siteIntegrationRoutes } from "./modules/site-integrations/site-integration.routes";
export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info"
    },
    trustProxy: true
  });

 await app.register(cors, {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "https://commerce.vectradev.shop",    
      "https://painel.vectradev.shop",
    "https://loja.vectradev.shop",
      "https://preview--huggable-cloud-play.lovable.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ];

    const isLovablePreview =
      typeof origin === "string" &&
      /^https:\/\/(?:preview--)?[a-z0-9-]+\.lovable\.app$/i.test(origin);

    const isAllowed =
      !origin ||
      allowedOrigins.includes(origin) ||
      isLovablePreview;

    if (isAllowed) {
      callback(null, true);
      return;
    }

    callback(
      new Error(`CORS_ORIGIN_NOT_ALLOWED: ${origin}`),
      false
    );
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS"
  ],

  allowedHeaders: [
    "Authorization",
    "Content-Type",
    "Accept",
    "apikey",
    "x-client-info",
    "X-Company-Id"
  ],

  credentials: true,
  maxAge: 86400
});

  await app.register

  app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });

  app.get("/health", async () => {
    return {
      success: true,
      service: "vectra-commerce-api",
      status: "online",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    };
  });

  app.get("/", async () => {
    return {
      success: true,
      message: "Vectra Commerce API"
    };
  });

  app.register(productRoutes);
  app.register(orderRoutes);
  app.register(settingsRoutes);
  app.register(stockRoutes);
  app.register(whatsappRoutes);
  await app.register(deliveryZoneRoutes);
  app.register(companyContextRoutes);
  app.register(siteRoutes);
  app.register(publicSiteRoutes);
  app.register(siteIntegrationRoutes);
  app.setNotFoundHandler(async (_request, reply) => {
    return reply.status(404).send({
      success: false,
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Rota não encontrada."
      }
    });
  });

  app.setErrorHandler(async (error: any, request, reply) => {
    request.log.error(error);

    const statusCode =
      error.statusCode &&
      error.statusCode >= 400 &&
      error.statusCode < 600
        ? error.statusCode
        : 500;

    return reply.status(statusCode).send({
      success: false,
      error: {
        code:
          statusCode === 500
            ? "INTERNAL_SERVER_ERROR"
            : "REQUEST_ERROR",
        message:
          statusCode === 500
            ? "Erro interno do servidor."
            : error.message
      }
    });
  });

  return app;
}
