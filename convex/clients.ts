/**
 * Agency Clients
 *
 * CRUD operations for organization-scoped billing clients.
 */

import { v } from "convex/values";
import { organizationAdminMutation, organizationQuery } from "./customFunctions";
import { conflict, notFound, validation } from "./lib/errors";

export const create = organizationAdminMutation({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    address: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
  },
  returns: v.object({ success: v.literal(true), clientId: v.id("clients") }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("clients")
      .withIndex("by_organization_email", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("email", args.email),
      )
      .first();

    if (existing) {
      throw conflict("A client with this email already exists in this organization");
    }

    if (args.hourlyRate !== undefined && args.hourlyRate < 0) {
      throw validation("hourlyRate", "Hourly rate must be zero or greater");
    }

    const now = Date.now();
    const clientId = await ctx.db.insert("clients", {
      organizationId: ctx.organizationId,
      name: args.name,
      email: args.email,
      company: args.company,
      address: args.address,
      hourlyRate: args.hourlyRate,
      createdBy: ctx.userId,
      updatedAt: now,
    });

    return { success: true, clientId } as const;
  },
});

export const list = organizationQuery({
  args: {},
  handler: async (ctx) => {
    const MAX_CLIENTS = 1000;
    return await ctx.db
      .query("clients")
      .withIndex("by_organization", (q) => q.eq("organizationId", ctx.organizationId))
      .order("desc")
      .take(MAX_CLIENTS);
  },
});

export const get = organizationQuery({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client || client.organizationId !== ctx.organizationId) {
      throw notFound("client", args.clientId);
    }
    return client;
  },
});

export const update = organizationAdminMutation({
  args: {
    clientId: v.id("clients"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    address: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client || client.organizationId !== ctx.organizationId) {
      throw notFound("client", args.clientId);
    }

    const newEmail = args.email;
    if (newEmail && newEmail !== client.email) {
      const existing = await ctx.db
        .query("clients")
        .withIndex("by_organization_email", (q) =>
          q.eq("organizationId", ctx.organizationId).eq("email", newEmail),
        )
        .first();
      if (existing && existing._id !== args.clientId) {
        throw conflict("A client with this email already exists in this organization");
      }
    }

    if (args.hourlyRate !== undefined && args.hourlyRate < 0) {
      throw validation("hourlyRate", "Hourly rate must be zero or greater");
    }

    await ctx.db.patch(args.clientId, {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.email !== undefined ? { email: args.email } : {}),
      ...(args.company !== undefined ? { company: args.company } : {}),
      ...(args.address !== undefined ? { address: args.address } : {}),
      ...(args.hourlyRate !== undefined ? { hourlyRate: args.hourlyRate } : {}),
      updatedAt: Date.now(),
    });

    return { success: true } as const;
  },
});

export const remove = organizationAdminMutation({
  args: {
    clientId: v.id("clients"),
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client || client.organizationId !== ctx.organizationId) {
      throw notFound("client", args.clientId);
    }

    const linkedInvoice = await ctx.db
      .query("invoices")
      .withIndex("by_organization_client", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("clientId", args.clientId),
      )
      .first();

    if (linkedInvoice) {
      throw conflict("Cannot remove client with existing invoices");
    }

    await ctx.db.delete(args.clientId);
    return { success: true } as const;
  },
});
