import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { productRoutes } from "./modules/products/product.routes";
import { orderRoutes } from "./modules/orders/order.routes";
import { checkoutRoutes } from "./modules/checkout/checkout.routes";
import { notificationRoutes } from "./modules/notifications/notification.routes";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info"
    },
    trustProxy: true
  });

  app.register(cors, {
    origin: [
      "https://commerce.vectradev.shop",
      "https://painel.vectradev.shop",
      "https://loja.vectradev.shop",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:8080",
      "https://55dc89c9-de0b-42c6-85ff-a56192b2982b.lovableproject.com"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "apikey",
      "x-client-info",
      "x-company-id"
    ]
  });

  app.register(fastifyStatic, {
  root: path.join(process.cwd(), "public"),
  prefix: "/products/"
});

app.register(helmet, {
  crossOriginResourcePolicy: {
    policy: "cross-origin"
  },

  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],

      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://connect.facebook.net"
      ],

      styleSrc: [
        "'self'",
        "'unsafe-inline'"
      ],

      imgSrc: [
        "'self'",
        "https:",
        "data:"
      ],

      connectSrc: [
        "'self'",
        "https://api.vectradev.shop",
        "https://www.facebook.com"
      ],

      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  }
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
  app.register(checkoutRoutes);
  app.register(notificationRoutes);

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
