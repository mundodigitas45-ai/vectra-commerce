import type {
  FastifyReply,
  FastifyRequest
} from "fastify";
import {
  checkoutQuoteSchema,
  checkoutSlugSchema,
  publicCheckoutOrderSchema,
  type CheckoutQuoteInput,
  type PublicCheckoutOrderInput
} from "./checkout.schemas";
import { checkoutService } from "./checkout.service";
import { renderCheckoutPage } from "./checkout.page";

function identifyCheckoutError(message: string) {
  if (message.includes("DELIVERY_ZONE_NOT_FOUND")) {
    return {
      status: 422,
      code: "DELIVERY_ZONE_NOT_FOUND",
      publicMessage: "Ainda não entregamos nesse bairro."
    };
  }

  if (message.includes("INSUFFICIENT_STOCK")) {
    return {
      status: 409,
      code: "INSUFFICIENT_STOCK",
      publicMessage: "Não há estoque disponível para essa quantidade."
    };
  }

  if (message.includes("PRODUCT_NOT_FOUND")) {
    return {
      status: 404,
      code: "PRODUCT_NOT_FOUND",
      publicMessage: "Produto não encontrado ou indisponível."
    };
  }

  if (message.includes("CHECKOUT_SINGLE_PRODUCT_ONLY")) {
    return {
      status: 400,
      code: "CHECKOUT_SINGLE_PRODUCT_ONLY",
      publicMessage: "Este checkout aceita um produto por pedido."
    };
  }

  if (message.includes("INVALID_PAYMENT_METHOD")) {
    return {
      status: 422,
      code: "INVALID_PAYMENT_METHOD",
      publicMessage: "Forma de pagamento inválida."
    };
  }

  return {
    status: 500,
    code: "CHECKOUT_FAILED",
    publicMessage: "Não foi possível concluir agora. Tente novamente."
  };
}

export class CheckoutController {
  async page(
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply
  ) {
    const parsed = checkoutSlugSchema.safeParse(request.params);

    if (!parsed.success) {
      return reply.status(404).type("text/html; charset=utf-8").send(
        renderSimpleErrorPage("Produto inválido.")
      );
    }

    return reply
      .type("text/html; charset=utf-8")
      .header("Cache-Control", "no-store")
      .header(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self'; base-uri 'self'; form-action 'self'"
      )
      .send(renderCheckoutPage(parsed.data.slug));
  }

  async getPageData(
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply
  ) {
    const parsed = checkoutSlugSchema.safeParse(request.params);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Produto inválido." }
      });
    }

    try {
      const data = await checkoutService.getPageData(parsed.data.slug);
      return reply.send({ success: true, data });
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  async quote(
    request: FastifyRequest<{ Body: CheckoutQuoteInput }>,
    reply: FastifyReply
  ) {
    const parsed = checkoutQuoteSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Confira produto, quantidade e bairro.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data = await checkoutService.quote(parsed.data);
      return reply.send({ success: true, data });
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  async createOrder(
    request: FastifyRequest<{ Body: PublicCheckoutOrderInput }>,
    reply: FastifyReply
  ) {
    const parsed = publicCheckoutOrderSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Confira os dados da entrega.",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const data = await checkoutService.createOrder(parsed.data);
      return reply.status(201).send({
        success: true,
        data,
        message: "Pedido recebido e produto reservado para entrega."
      });
    } catch (error) {
      return this.handleError(error, request, reply);
    }
  }

  private handleError(
    error: unknown,
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    request.log.error(error);

    const message =
      error instanceof Error ? error.message : String(error);
    const identified = identifyCheckoutError(message);

    return reply.status(identified.status).send({
      success: false,
      error: {
        code: identified.code,
        message: identified.publicMessage
      }
    });
  }
}

function renderSimpleErrorPage(message: string) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Miranda Express</title></head><body style="font-family:system-ui;padding:30px;text-align:center"><h1>Miranda Express</h1><p>${message}</p></body></html>`;
}

export const checkoutController = new CheckoutController();
