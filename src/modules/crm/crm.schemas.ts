import { z } from "zod";

export const crmUuidSchema = z
  .string()
  .uuid();

export const crmContactParamsSchema =
  z.object({
    contactId: crmUuidSchema
  });

export const crmOpportunityParamsSchema =
  z.object({
    opportunityId: crmUuidSchema
  });

export const crmBoardQuerySchema =
  z.object({
    pipeline_id:
      crmUuidSchema.optional(),

    status: z
      .enum([
        "open",
        "won",
        "lost",
        "archived"
      ])
      .optional()
      .default("open")
  });

export const crmContactsQuerySchema =
  z.object({
    search: z
      .string()
      .trim()
      .max(120)
      .optional(),

    status: z
      .enum([
        "active",
        "blocked",
        "archived"
      ])
      .optional(),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .default(100)
  });

export const createCrmContactSchema =
  z.object({
    customer_id:
      crmUuidSchema.nullable().optional(),

    store_id:
      crmUuidSchema.nullable().optional(),

    channel: z
      .enum([
        "whatsapp",
        "phone",
        "email",
        "site",
        "manual"
      ])
      .default("whatsapp"),

    channel_identifier: z
      .string()
      .trim()
      .min(1)
      .max(255),

    whatsapp_instance_name: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .nullable()
      .optional(),

    name: z
      .string()
      .trim()
      .min(1)
      .max(180)
      .nullable()
      .optional(),

    phone: z
      .string()
      .trim()
      .min(5)
      .max(40)
      .nullable()
      .optional(),

    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .nullable()
      .optional(),

    source: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .optional()
      .default("manual"),

    metadata: z
      .record(z.unknown())
      .optional()
      .default({})
  });

export const createCrmOpportunitySchema =
  z.object({
    contact_id:
      crmUuidSchema,

    pipeline_id:
      crmUuidSchema.optional(),

    stage_id:
      crmUuidSchema.optional(),

    customer_id:
      crmUuidSchema.nullable().optional(),

    store_id:
      crmUuidSchema.nullable().optional(),

    order_id:
      crmUuidSchema.nullable().optional(),

    assigned_user_id:
      crmUuidSchema.nullable().optional(),

    title: z
      .string()
      .trim()
      .min(2)
      .max(240),

    priority: z
      .enum([
        "low",
        "normal",
        "high",
        "urgent"
      ])
      .optional()
      .default("normal"),

    estimated_value: z
      .number()
      .finite()
      .min(0)
      .nullable()
      .optional(),

    currency: z
      .string()
      .trim()
      .length(3)
      .optional()
      .default("BRL"),

    product_context: z
      .record(z.unknown())
      .optional()
      .default({}),

    device_context: z
      .record(z.unknown())
      .optional()
      .default({}),

    next_action_at: z
      .string()
      .datetime({
        offset: true
      })
      .nullable()
      .optional(),

    metadata: z
      .record(z.unknown())
      .optional()
      .default({})
  });

export const updateCrmOpportunitySchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(2)
      .max(240)
      .optional(),

    assigned_user_id:
      crmUuidSchema.nullable().optional(),

    priority: z
      .enum([
        "low",
        "normal",
        "high",
        "urgent"
      ])
      .optional(),

    estimated_value: z
      .number()
      .finite()
      .min(0)
      .nullable()
      .optional(),

    customer_id:
      crmUuidSchema.nullable().optional(),

    store_id:
      crmUuidSchema.nullable().optional(),

    order_id:
      crmUuidSchema.nullable().optional(),

    product_context: z
      .record(z.unknown())
      .optional(),

    device_context: z
      .record(z.unknown())
      .optional(),

    next_action_at: z
      .string()
      .datetime({
        offset: true
      })
      .nullable()
      .optional(),

    metadata: z
      .record(z.unknown())
      .optional()
  }).refine(
    (value) =>
      Object.keys(value).length > 0,
    {
      message:
        "Informe ao menos um campo para atualizar."
    }
  );

export const moveCrmOpportunitySchema =
  z.object({
    stage_id:
      crmUuidSchema,

    lost_reason: z
      .string()
      .trim()
      .min(2)
      .max(500)
      .nullable()
      .optional()
  });

export const createCrmActivitySchema =
  z.object({
    activity_type: z
      .string()
      .trim()
      .min(2)
      .max(80),

    direction: z
      .enum([
        "inbound",
        "outbound",
        "internal"
      ])
      .nullable()
      .optional(),

    title: z
      .string()
      .trim()
      .min(1)
      .max(180)
      .nullable()
      .optional(),

    description: z
      .string()
      .trim()
      .max(5000)
      .nullable()
      .optional(),

    external_id: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .nullable()
      .optional(),

    customer_id:
      crmUuidSchema.nullable().optional(),

    order_id:
      crmUuidSchema.nullable().optional(),

    occurred_at: z
      .string()
      .datetime({
        offset: true
      })
      .optional(),

    metadata: z
      .record(z.unknown())
      .optional()
      .default({})
  });

export type CrmBoardQuery =
  z.infer<
    typeof crmBoardQuerySchema
  >;

export type CrmContactsQuery =
  z.infer<
    typeof crmContactsQuerySchema
  >;

export type CreateCrmContactInput =
  z.infer<
    typeof createCrmContactSchema
  >;

export type CreateCrmOpportunityInput =
  z.infer<
    typeof createCrmOpportunitySchema
  >;

export type UpdateCrmOpportunityInput =
  z.infer<
    typeof updateCrmOpportunitySchema
  >;

export type MoveCrmOpportunityInput =
  z.infer<
    typeof moveCrmOpportunitySchema
  >;

export type CreateCrmActivityInput =
  z.infer<
    typeof createCrmActivitySchema
  >;
