import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { inventoryRoutes } from "./modules/inventory/inventory.routes";
import { productRoutes } from "./modules/products/product.routes";
import { orderRoutes } from "./modules/orders/order.routes";
import { customerRoutes } from "./modules/customers/customer.routes";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info"
    },
    trustProxy: true
  });

  app.register(helmet);

  app.register(cors, {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ]
  });

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
  app.register(customerRoutes);
  app.register(inventoryRoutes);

  app.setNotFoundHandler(async (_request, reply) => {
    return reply.status(404).send({
      success: false,
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Rota não encontrada."
      }
    });
  });

  app.setErrorHandler(async (error, request, reply) => {
    request.log.error(error);

    return reply.status(500).send({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro interno do servidor."
      }
    });
  });

  return app;
}