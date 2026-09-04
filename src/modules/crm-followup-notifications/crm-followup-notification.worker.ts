import * as webpush from "web-push";

import { supabase } from "../../config/supabase";

type FollowupOpportunity = {
  id: string;
  company_id: string;
  contact_id: string;
  title: string;
  next_action_at: string;
};

type FollowupNotification = {
  id: string;
  status: "pending" | "processing" | "sent" | "failed";
  locked_at: string | null;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

type WorkerStatus = {
  enabled: boolean;
  started: boolean;
  interval_ms: number;
  batch_size: number;
  running: boolean;
  last_run_at: string | null;
  last_error: string | null;
};

function enabledFromEnv(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(
    String(value ?? "")
      .trim()
      .toLowerCase(),
  );
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function safeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 1000);
  }

  return String(error).slice(0, 1000);
}

function notificationExternalId(opportunity: FollowupOpportunity): string {
  return [
    "crm-followup-notification",
    opportunity.id,
    opportunity.next_action_at,
  ].join(":");
}

export class CrmFollowupNotificationWorker {
  private readonly enabled = enabledFromEnv(
    process.env.CRM_FOLLOWUP_WORKER_ENABLED,
  );

  private readonly intervalMs = positiveInteger(
    process.env.CRM_FOLLOWUP_WORKER_INTERVAL_MS,
    60_000,
  );

  private readonly batchSize = positiveInteger(
    process.env.CRM_FOLLOWUP_WORKER_BATCH_SIZE,
    25,
  );

  private timer: NodeJS.Timeout | null = null;

  private started = false;
  private running = false;
  private lastRunAt: string | null = null;
  private lastError: string | null = null;

  start(): boolean {
    if (!this.enabled || this.started) {
      return false;
    }

    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();

    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();

    const subject = process.env.VAPID_SUBJECT?.trim();

    if (!publicKey || !privateKey || !subject) {
      this.lastError = "VAPID_CONFIGURATION_MISSING";

      return false;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    this.started = true;

    void this.runOnce().finally(() => {
      if (this.started) {
        this.scheduleNext();
      }
    });

    return true;
  }

  stop(): void {
    this.started = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getStatus(): WorkerStatus {
    return {
      enabled: this.enabled,
      started: this.started,
      interval_ms: this.intervalMs,
      batch_size: this.batchSize,
      running: this.running,
      last_run_at: this.lastRunAt,
      last_error: this.lastError,
    };
  }

  async runOnce(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastError = null;
    this.lastRunAt = new Date().toISOString();

    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("crm_opportunities")
        .select("id,company_id,contact_id,title,next_action_at")
        .eq("status", "open")
        .not("next_action_at", "is", null)
        .lte("next_action_at", now)
        .order("next_action_at", {
          ascending: true,
        })
        .limit(this.batchSize);

      if (error) {
        throw error;
      }

      for (const row of data ?? []) {
        const opportunity = row as FollowupOpportunity;

        if (!opportunity.next_action_at) {
          continue;
        }

        try {
          await this.processOpportunity(opportunity);
        } catch (error) {
          console.error({
            message: "CRM follow-up notification failed",
            opportunity_id: opportunity.id,
            error: safeError(error),
          });
        }
      }
    } catch (error) {
      this.lastError = safeError(error);

      console.error({
        message: "CRM follow-up worker failed",
        error: this.lastError,
      });

      throw error;
    } finally {
      this.running = false;
    }
  }

  private async processOpportunity(
    opportunity: FollowupOpportunity,
  ): Promise<void> {
    const externalId = notificationExternalId(opportunity);

    const { error: createError } = await supabase
      .from("crm_followup_notifications")
      .upsert(
        {
          company_id: opportunity.company_id,
          opportunity_id: opportunity.id,
          scheduled_for: opportunity.next_action_at,
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "opportunity_id,scheduled_for",
          ignoreDuplicates: true,
        },
      );

    if (createError) {
      throw createError;
    }

    const { data: notification, error: notificationError } = await supabase
      .from("crm_followup_notifications")
      .select("id,status,locked_at")
      .eq("opportunity_id", opportunity.id)
      .eq("scheduled_for", opportunity.next_action_at)
      .single();

    if (notificationError) {
      throw notificationError;
    }

    const current = notification as FollowupNotification;

    if (current.status === "sent") {
      return;
    }

    if (current.status === "processing" && current.locked_at) {
      const lockAge = Date.now() - new Date(current.locked_at).getTime();

      if (lockAge < 5 * 60_000) {
        return;
      }
    }

    const lockedAt = new Date().toISOString();

    const { data: claimed, error: claimError } = await supabase
      .from("crm_followup_notifications")
      .update({
        status: "processing",
        locked_at: lockedAt,
        last_error: null,
        updated_at: lockedAt,
      })
      .eq("id", current.id)
      .neq("status", "sent")
      .select("id")
      .maybeSingle();

    if (claimError) {
      throw claimError;
    }

    if (!claimed) {
      return;
    }

    const { data: contact, error: contactError } = await supabase
      .from("crm_contacts")
      .select("name,phone,channel_identifier")
      .eq("company_id", opportunity.company_id)
      .eq("id", opportunity.contact_id)
      .single();

    if (contactError) {
      await this.markFailed(current.id, safeError(contactError));

      throw contactError;
    }

    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth_key")
      .eq("company_id", opportunity.company_id)
      .eq("enabled", true);

    if (subscriptionError) {
      await this.markFailed(current.id, safeError(subscriptionError));

      throw subscriptionError;
    }

    const activeSubscriptions = (subscriptions ?? []) as PushSubscriptionRow[];

    if (activeSubscriptions.length === 0) {
      await this.markFailed(current.id, "NO_ACTIVE_PUSH_SUBSCRIPTION");

      return;
    }

    const contactName = String(
      contact.name ?? contact.phone ?? contact.channel_identifier ?? "cliente",
    );

    const payload = JSON.stringify({
      title: "Retorno comercial pendente",
      body: `Hora de retornar o contato de ${contactName}.`,
      icon: "/icons/vectra-192.png",
      badge: "/icons/vectra-192.png",
      tag: externalId,
      timestamp: Date.now(),
      url: "/crm",
    });

    let successCount = 0;
    const failures: string[] = [];

    for (const subscription of activeSubscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth_key,
            },
          },
          payload,
        );

        successCount += 1;
      } catch (error) {
        const pushError = error as {
          statusCode?: number;
          message?: string;
        };

        const statusCode = pushError.statusCode;

        failures.push(`${subscription.id}:` + `${statusCode ?? "unknown"}`);

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .update({
              enabled: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);
        }
      }
    }

    if (successCount === 0) {
      await this.markFailed(
        current.id,
        failures.join(",") || "PUSH_DELIVERY_FAILED",
      );

      return;
    }

    const sentAt = new Date().toISOString();

    const { error: sentError } = await supabase
      .from("crm_followup_notifications")
      .update({
        status: "sent",
        sent_at: sentAt,
        locked_at: null,
        attempt_count: activeSubscriptions.length,
        last_error: failures.length > 0 ? failures.join(",") : null,
        updated_at: sentAt,
      })
      .eq("id", current.id);

    if (sentError) {
      throw sentError;
    }

    const { error: activityError } = await supabase
      .from("crm_activities")
      .insert({
        company_id: opportunity.company_id,
        opportunity_id: opportunity.id,
        contact_id: opportunity.contact_id,
        activity_type: "follow_up_notification_sent",
        direction: "internal",
        title: "Aviso de retorno enviado",
        description: `O aviso de retorno de ${contactName} foi enviado.`,
        external_id: externalId,
        occurred_at: sentAt,
        metadata: {
          scheduled_for: opportunity.next_action_at,
          delivered_devices: successCount,
          source: "crm_followup_worker",
        },
      });

    if (activityError && activityError.code !== "23505") {
      throw activityError;
    }
  }

  private async markFailed(
    notificationId: string,
    message: string,
  ): Promise<void> {
    const { data: current } = await supabase
      .from("crm_followup_notifications")
      .select("attempt_count")
      .eq("id", notificationId)
      .maybeSingle();

    await supabase
      .from("crm_followup_notifications")
      .update({
        status: "failed",
        locked_at: null,
        attempt_count: Number(current?.attempt_count ?? 0) + 1,
        last_error: message.slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", notificationId);
  }

  private scheduleNext(): void {
    this.timer = setTimeout(() => {
      void this.runOnce()
        .catch(() => undefined)
        .finally(() => {
          if (this.started) {
            this.scheduleNext();
          }
        });
    }, this.intervalMs);

    this.timer.unref();
  }
}

export const crmFollowupNotificationWorker =
  new CrmFollowupNotificationWorker();
