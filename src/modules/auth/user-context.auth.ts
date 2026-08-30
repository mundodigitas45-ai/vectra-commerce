import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import { supabase } from "../../config/supabase";

export interface UserAuthContext {
  userId: string;
  email: string | null;
}

declare module "fastify" {
  interface FastifyRequest {
    userAuthContext?: UserAuthContext;
  }
}

export async function requireUserAuth(
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
        message:
          "É necessário entrar ou criar uma conta para continuar."
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

  const user = data.user;

  if (error || !user?.id) {
    request.log.warn(
      {
        error: error?.message
      },
      "Token inválido durante o onboarding"
    );

    return reply.status(401).send({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message:
          "Sua sessão expirou. Entre novamente para continuar."
      }
    });
  }

  request.userAuthContext = {
    userId: user.id,
    email:
      user.email?.trim().toLowerCase() ??
      null
  };
}
