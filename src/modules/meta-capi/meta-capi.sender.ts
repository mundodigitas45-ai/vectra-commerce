export type MetaCapiPayload = {
  event_name: string;
  event_time: number;
  event_id: string;
  action_source: string;
  event_source_url: string;
  user_data: Record<string, unknown>;
  custom_data: Record<string, unknown>;
};

export type MetaCapiSendInput = {
  pixelId: string;
  accessToken: string;
  payload: MetaCapiPayload;
  testEventCode?: string | null;
};

export type MetaCapiSendResult = {
  ok: boolean;
  status: number;
  events_received: number | null;
  fbtrace_id: string | null;
};

type MetaCapiSenderOptions = {
  baseUrl?: string;
  apiVersion?: string;
  timeoutMs?: number;
};

export class MetaCapiSender {
  private readonly baseUrl: string;
  private readonly apiVersion: string;
  private readonly timeoutMs: number;

  constructor(
    options: MetaCapiSenderOptions = {}
  ) {
    this.baseUrl =
      (
        options.baseUrl ??
        "https://graph.facebook.com"
      ).replace(/\/+$/, "");

    this.apiVersion =
      options.apiVersion ??
      "v25.0";

    this.timeoutMs =
      options.timeoutMs ??
      10000;
  }

  async sendPurchase(
    input: MetaCapiSendInput
  ): Promise<MetaCapiSendResult> {
    if (
      !/^\d{5,100}$/.test(
        input.pixelId
      )
    ) {
      throw new Error(
        "META_PIXEL_ID_INVALID"
      );
    }

    if (
      typeof input.accessToken !==
        "string" ||
      input.accessToken.trim().length <
        20
    ) {
      throw new Error(
        "META_ACCESS_TOKEN_INVALID"
      );
    }

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        this.timeoutMs
      );

    try {
      const url =
        `${this.baseUrl}/` +
        `${this.apiVersion}/` +
        `${input.pixelId}/events`;

      const response =
        await fetch(
          url,
          {
            method: "POST",

            headers: {
              "content-type":
                "application/json",

              authorization:
                `Bearer ${input.accessToken}`
            },

            body:
              JSON.stringify({
                data: [
                  input.payload
                ],
                ...(
                  typeof input.testEventCode === "string" &&
                  input.testEventCode.trim()
                    ? {
                        test_event_code:
                          input.testEventCode.trim()
                      }
                    : {}
                )
              }),

            signal:
              controller.signal
          }
        );

      let body: unknown = null;

      try {
        body =
          await response.json();
      } catch {
        body = null;
      }

      if (!response.ok) {
        const safeMessage =
          extractSafeMetaError(body);

        const error =
          new Error(
            `META_CAPI_HTTP_${response.status}: ${safeMessage}`
          ) as Error & {
            status?: number;
          };

        error.status =
          response.status;

        throw error;
      }

      const parsed =
        parseMetaSuccess(body);

      return {
        ok: true,
        status:
          response.status,
        events_received:
          parsed.eventsReceived,
        fbtrace_id:
          parsed.fbtraceId
      };

    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new Error(
          "META_CAPI_TIMEOUT"
        );
      }

      throw error;

    } finally {
      clearTimeout(timeout);
    }
  }
}

function parseMetaSuccess(
  body: unknown
): {
  eventsReceived: number | null;
  fbtraceId: string | null;
} {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return {
      eventsReceived: null,
      fbtraceId: null
    };
  }

  const value =
    body as Record<
      string,
      unknown
    >;

  return {
    eventsReceived:
      typeof value.events_received ===
      "number"
        ? value.events_received
        : null,

    fbtraceId:
      typeof value.fbtrace_id ===
      "string"
        ? value.fbtrace_id
        : null
  };
}

function extractSafeMetaError(
  body: unknown
): string {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return "Meta request failed";
  }

  const root =
    body as Record<
      string,
      unknown
    >;

  const error =
    root.error;

  if (
    !error ||
    typeof error !== "object" ||
    Array.isArray(error)
  ) {
    return "Meta request failed";
  }

  const metaError =
    error as Record<
      string,
      unknown
    >;

  const message =
    typeof metaError.message ===
      "string"
      ? metaError.message
      : "Meta request failed";

  const code =
    typeof metaError.code ===
      "number"
      ? metaError.code
      : null;

  /*
   * Não devolvemos request body,
   * headers nem access token.
   */
  return code !== null
    ? `[${code}] ${message}`
    : message;
}

export const metaCapiSender =
  new MetaCapiSender();
