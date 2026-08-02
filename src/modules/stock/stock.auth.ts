import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import { supabase } from "../../config/supabase";

const ADMIN_EMAILS = new Set(
  (
    process.env.ADMIN_EMAILS ??
    "mundodigitas45@gmail.com"
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

declare module "fastify" {
  interface FastifyRequest {
    adminEmail?: string;
  }
}

export async function requireStockAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authorization =
    request.headers.authorization ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return reply.status(401).send({
      success: false,
      error: {
        code: "AUTH_REQUIRED",
        message: "É necessário entrar novamente no painel."
      }
    });
  }

  const token = authorization
    .slice(7)
    .trim();

  if (!token) {
    return reply.status(401).send({
      success: false,
      error: {
        code: "AUTH_REQUIRED",
        message: "Token de acesso não informado."
      }
    });
  }

  const { data, error } =
    await supabase.auth.getUser(token);

  const email = data.user?.email
    ?.trim()
    .toLowerCase();

  if (error || !email) {
    request.log.warn(
      {
        error: error?.message
      },
      "Token Supabase inválido"
    );

    return reply.status(401).send({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Sua sessão expirou. Entre novamente no painel."
      }
    });
  }

  if (!ADMIN_EMAILS.has(email)) {
    request.log.warn(
      {
        email
      },
      "Usuário sem permissão para movimentar estoque"
    );

    return reply.status(403).send({
      success: false,
      error: {
        code: "STOCK_ADMIN_REQUIRED",
        message: "Este usuário não possui permissão para movimentar o estoque."
      }
    });
  }

  request.adminEmail = email;
}
