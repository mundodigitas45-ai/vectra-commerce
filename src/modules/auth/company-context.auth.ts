import type {
  FastifyReply,
  FastifyRequest
} from "fastify";

import { supabase } from "../../config/supabase";

export interface CompanyAuthContext {
  userId: string;
  email: string | null;
  companyId: string;
  role: string;
}

declare module "fastify" {
  interface FastifyRequest {
    authContext?: CompanyAuthContext;
  }
}

function headerValue(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export async function requireCompanyAccess(
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

  const companyId = headerValue(
    request.headers["x-company-id"]
  );

  if (!companyId) {
    return reply.status(400).send({
      success: false,
      error: {
        code: "COMPANY_REQUIRED",
        message: "Nenhuma empresa ativa foi informada."
      }
    });
  }

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);

  const user = userData.user;

  if (userError || !user?.id) {
    request.log.warn(
      {
        error: userError?.message
      },
      "Token Supabase inválido no contexto multiempresa"
    );

    return reply.status(401).send({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Sua sessão expirou. Entre novamente no painel."
      }
    });
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from("company_users")
      .select("company_id, role, is_active")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

  if (membershipError) {
    request.log.error(
      {
        code: membershipError.code,
        message: membershipError.message
      },
      "Falha ao validar vínculo com empresa"
    );

    return reply.status(500).send({
      success: false,
      error: {
        code: "COMPANY_ACCESS_CHECK_FAILED",
        message: "Não foi possível validar o acesso à empresa."
      }
    });
  }

  let role =
    membership?.role?.toString().trim() ?? "";

  let hasAccess = Boolean(membership);

  if (!hasAccess) {
    const { data: ownedCompany, error: ownerError } =
      await supabase
        .from("companies")
        .select("id")
        .eq("id", companyId)
        .eq("owner_user_id", user.id)
        .maybeSingle();

    if (ownerError) {
      request.log.error(
        {
          code: ownerError.code,
          message: ownerError.message
        },
        "Falha ao validar proprietário da empresa"
      );

      return reply.status(500).send({
        success: false,
        error: {
          code: "COMPANY_ACCESS_CHECK_FAILED",
          message: "Não foi possível validar o acesso à empresa."
        }
      });
    }

    if (ownedCompany) {
      hasAccess = true;
      role = "owner";
    }
  }

  if (!hasAccess) {
    request.log.warn(
      {
        userId: user.id,
        companyId
      },
      "Tentativa de acesso a empresa não autorizada"
    );

    return reply.status(403).send({
      success: false,
      error: {
        code: "COMPANY_ACCESS_DENIED",
        message: "Seu usuário não possui acesso ativo a esta empresa."
      }
    });
  }

  request.authContext = {
    userId: user.id,
    email: user.email?.trim().toLowerCase() ?? null,
    companyId,
    role: role || "viewer"
  };
}
