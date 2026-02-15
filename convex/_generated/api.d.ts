/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as OTPPasswordReset from "../OTPPasswordReset.js";
import type * as OTPVerification from "../OTPVerification.js";
import type * as ai_actions from "../ai/actions.js";
import type * as ai_chat from "../ai/chat.js";
import type * as ai_config from "../ai/config.js";
import type * as ai_mutations from "../ai/mutations.js";
import type * as ai_providers from "../ai/providers.js";
import type * as ai_queries from "../ai/queries.js";
import type * as ai_semanticSearch from "../ai/semanticSearch.js";
import type * as ai_suggestions from "../ai/suggestions.js";
import type * as analytics from "../analytics.js";
import type * as api_issues from "../api/issues.js";
import type * as apiKeys from "../apiKeys.js";
import type * as attachments from "../attachments.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as authWrapper from "../authWrapper.js";
import type * as automationRules from "../automationRules.js";
import type * as availability from "../availability.js";
import type * as bookingPages from "../bookingPages.js";
import type * as bookings from "../bookings.js";
import type * as calendarEvents from "../calendarEvents.js";
import type * as calendarEventsAttendance from "../calendarEventsAttendance.js";
import type * as crons from "../crons.js";
import type * as customFields from "../customFields.js";
import type * as customFunctions from "../customFunctions.js";
import type * as dashboard from "../dashboard.js";
import type * as documentTemplates from "../documentTemplates.js";
import type * as documentVersions from "../documentVersions.js";
import type * as documents from "../documents.js";
import type * as e2e from "../e2e.js";
import type * as email_digests from "../email/digests.js";
import type * as email_helpers from "../email/helpers.js";
import type * as email_index from "../email/index.js";
import type * as email_mailtrap from "../email/mailtrap.js";
import type * as email_notifications from "../email/notifications.js";
import type * as email_provider from "../email/provider.js";
import type * as email_resend from "../email/resend.js";
import type * as email_sendpulse from "../email/sendpulse.js";
import type * as examples_rateLimitExample from "../examples/rateLimitExample.js";
import type * as export_ from "../export.js";
import type * as files from "../files.js";
import type * as github from "../github.js";
import type * as googleCalendar from "../googleCalendar.js";
import type * as hourCompliance from "../hourCompliance.js";
import type * as http from "../http.js";
import type * as http_githubOAuth from "../http/githubOAuth.js";
import type * as http_googleOAuth from "../http/googleOAuth.js";
import type * as internal_ai from "../internal/ai.js";
import type * as invites from "../invites.js";
import type * as issueLinks from "../issueLinks.js";
import type * as issues from "../issues.js";
import type * as issues_helpers from "../issues/helpers.js";
import type * as issues_mutations from "../issues/mutations.js";
import type * as issues_queries from "../issues/queries.js";
import type * as issues_searchHelpers from "../issues/searchHelpers.js";
import type * as labelGroups from "../labelGroups.js";
import type * as labels from "../labels.js";
import type * as lib_aiHelpers from "../lib/aiHelpers.js";
import type * as lib_apiAuth from "../lib/apiAuth.js";
import type * as lib_authTypes from "../lib/authTypes.js";
import type * as lib_batchHelpers from "../lib/batchHelpers.js";
import type * as lib_botAuth from "../lib/botAuth.js";
import type * as lib_boundedQueries from "../lib/boundedQueries.js";
import type * as lib_constrainedValidators from "../lib/constrainedValidators.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_e2eCrypto from "../lib/e2eCrypto.js";
import type * as lib_encryption from "../lib/encryption.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_issueCalculation from "../lib/issueCalculation.js";
import type * as lib_issueHelpers from "../lib/issueHelpers.js";
import type * as lib_logger from "../lib/logger.js";
import type * as lib_organizationAccess from "../lib/organizationAccess.js";
import type * as lib_pagination from "../lib/pagination.js";
import type * as lib_queryHelpers from "../lib/queryHelpers.js";
import type * as lib_queryLimits from "../lib/queryLimits.js";
import type * as lib_rateLimiter from "../lib/rateLimiter.js";
import type * as lib_relationships from "../lib/relationships.js";
import type * as lib_softDeleteHelpers from "../lib/softDeleteHelpers.js";
import type * as lib_ssrf from "../lib/ssrf.js";
import type * as lib_teamAccess from "../lib/teamAccess.js";
import type * as lib_timeUtils from "../lib/timeUtils.js";
import type * as lib_userUtils from "../lib/userUtils.js";
import type * as lib_vectorSearchHelpers from "../lib/vectorSearchHelpers.js";
import type * as lib_webhookHelpers from "../lib/webhookHelpers.js";
import type * as lib_workspaceAccess from "../lib/workspaceAccess.js";
import type * as meetingBot from "../meetingBot.js";
import type * as mocks_testConfig from "../mocks/testConfig.js";
import type * as notificationPreferences from "../notificationPreferences.js";
import type * as notifications from "../notifications.js";
import type * as oauthHealthCheck from "../oauthHealthCheck.js";
import type * as offlineSync from "../offlineSync.js";
import type * as onboarding from "../onboarding.js";
import type * as organizations from "../organizations.js";
import type * as presence from "../presence.js";
import type * as projectAccess from "../projectAccess.js";
import type * as projectMembers from "../projectMembers.js";
import type * as projectTemplates from "../projectTemplates.js";
import type * as projects from "../projects.js";
import type * as prosemirror from "../prosemirror.js";
import type * as pumble from "../pumble.js";
import type * as purge from "../purge.js";
import type * as rateLimiting from "../rateLimiting.js";
import type * as rateLimits from "../rateLimits.js";
import type * as rbac from "../rbac.js";
import type * as reactions from "../reactions.js";
import type * as router from "../router.js";
import type * as savedFilters from "../savedFilters.js";
import type * as schemaFields from "../schemaFields.js";
import type * as serviceRotation from "../serviceRotation.js";
import type * as shared_constants from "../shared/constants.js";
import type * as shared_routes from "../shared/routes.js";
import type * as shared_types from "../shared/types.js";
import type * as softDeleteCleanup from "../softDeleteCleanup.js";
import type * as sprints from "../sprints.js";
import type * as sso from "../sso.js";
import type * as teams from "../teams.js";
import type * as templates from "../templates.js";
import type * as testConfig from "../testConfig.js";
import type * as testUtils from "../testUtils.js";
import type * as timeTracking from "../timeTracking.js";
import type * as twoFactor from "../twoFactor.js";
import type * as unsubscribe from "../unsubscribe.js";
import type * as userProfiles from "../userProfiles.js";
import type * as userSettings from "../userSettings.js";
import type * as users from "../users.js";
import type * as validators_index from "../validators/index.js";
import type * as watchers from "../watchers.js";
import type * as webhooks from "../webhooks.js";
import type * as workspaces from "../workspaces.js";
import type * as yjs from "../yjs.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  OTPPasswordReset: typeof OTPPasswordReset;
  OTPVerification: typeof OTPVerification;
  "ai/actions": typeof ai_actions;
  "ai/chat": typeof ai_chat;
  "ai/config": typeof ai_config;
  "ai/mutations": typeof ai_mutations;
  "ai/providers": typeof ai_providers;
  "ai/queries": typeof ai_queries;
  "ai/semanticSearch": typeof ai_semanticSearch;
  "ai/suggestions": typeof ai_suggestions;
  analytics: typeof analytics;
  "api/issues": typeof api_issues;
  apiKeys: typeof apiKeys;
  attachments: typeof attachments;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  authWrapper: typeof authWrapper;
  automationRules: typeof automationRules;
  availability: typeof availability;
  bookingPages: typeof bookingPages;
  bookings: typeof bookings;
  calendarEvents: typeof calendarEvents;
  calendarEventsAttendance: typeof calendarEventsAttendance;
  crons: typeof crons;
  customFields: typeof customFields;
  customFunctions: typeof customFunctions;
  dashboard: typeof dashboard;
  documentTemplates: typeof documentTemplates;
  documentVersions: typeof documentVersions;
  documents: typeof documents;
  e2e: typeof e2e;
  "email/digests": typeof email_digests;
  "email/helpers": typeof email_helpers;
  "email/index": typeof email_index;
  "email/mailtrap": typeof email_mailtrap;
  "email/notifications": typeof email_notifications;
  "email/provider": typeof email_provider;
  "email/resend": typeof email_resend;
  "email/sendpulse": typeof email_sendpulse;
  "examples/rateLimitExample": typeof examples_rateLimitExample;
  export: typeof export_;
  files: typeof files;
  github: typeof github;
  googleCalendar: typeof googleCalendar;
  hourCompliance: typeof hourCompliance;
  http: typeof http;
  "http/githubOAuth": typeof http_githubOAuth;
  "http/googleOAuth": typeof http_googleOAuth;
  "internal/ai": typeof internal_ai;
  invites: typeof invites;
  issueLinks: typeof issueLinks;
  issues: typeof issues;
  "issues/helpers": typeof issues_helpers;
  "issues/mutations": typeof issues_mutations;
  "issues/queries": typeof issues_queries;
  "issues/searchHelpers": typeof issues_searchHelpers;
  labelGroups: typeof labelGroups;
  labels: typeof labels;
  "lib/aiHelpers": typeof lib_aiHelpers;
  "lib/apiAuth": typeof lib_apiAuth;
  "lib/authTypes": typeof lib_authTypes;
  "lib/batchHelpers": typeof lib_batchHelpers;
  "lib/botAuth": typeof lib_botAuth;
  "lib/boundedQueries": typeof lib_boundedQueries;
  "lib/constrainedValidators": typeof lib_constrainedValidators;
  "lib/crypto": typeof lib_crypto;
  "lib/e2eCrypto": typeof lib_e2eCrypto;
  "lib/encryption": typeof lib_encryption;
  "lib/env": typeof lib_env;
  "lib/errors": typeof lib_errors;
  "lib/issueCalculation": typeof lib_issueCalculation;
  "lib/issueHelpers": typeof lib_issueHelpers;
  "lib/logger": typeof lib_logger;
  "lib/organizationAccess": typeof lib_organizationAccess;
  "lib/pagination": typeof lib_pagination;
  "lib/queryHelpers": typeof lib_queryHelpers;
  "lib/queryLimits": typeof lib_queryLimits;
  "lib/rateLimiter": typeof lib_rateLimiter;
  "lib/relationships": typeof lib_relationships;
  "lib/softDeleteHelpers": typeof lib_softDeleteHelpers;
  "lib/ssrf": typeof lib_ssrf;
  "lib/teamAccess": typeof lib_teamAccess;
  "lib/timeUtils": typeof lib_timeUtils;
  "lib/userUtils": typeof lib_userUtils;
  "lib/vectorSearchHelpers": typeof lib_vectorSearchHelpers;
  "lib/webhookHelpers": typeof lib_webhookHelpers;
  "lib/workspaceAccess": typeof lib_workspaceAccess;
  meetingBot: typeof meetingBot;
  "mocks/testConfig": typeof mocks_testConfig;
  notificationPreferences: typeof notificationPreferences;
  notifications: typeof notifications;
  oauthHealthCheck: typeof oauthHealthCheck;
  offlineSync: typeof offlineSync;
  onboarding: typeof onboarding;
  organizations: typeof organizations;
  presence: typeof presence;
  projectAccess: typeof projectAccess;
  projectMembers: typeof projectMembers;
  projectTemplates: typeof projectTemplates;
  projects: typeof projects;
  prosemirror: typeof prosemirror;
  pumble: typeof pumble;
  purge: typeof purge;
  rateLimiting: typeof rateLimiting;
  rateLimits: typeof rateLimits;
  rbac: typeof rbac;
  reactions: typeof reactions;
  router: typeof router;
  savedFilters: typeof savedFilters;
  schemaFields: typeof schemaFields;
  serviceRotation: typeof serviceRotation;
  "shared/constants": typeof shared_constants;
  "shared/routes": typeof shared_routes;
  "shared/types": typeof shared_types;
  softDeleteCleanup: typeof softDeleteCleanup;
  sprints: typeof sprints;
  sso: typeof sso;
  teams: typeof teams;
  templates: typeof templates;
  testConfig: typeof testConfig;
  testUtils: typeof testUtils;
  timeTracking: typeof timeTracking;
  twoFactor: typeof twoFactor;
  unsubscribe: typeof unsubscribe;
  userProfiles: typeof userProfiles;
  userSettings: typeof userSettings;
  users: typeof users;
  "validators/index": typeof validators_index;
  watchers: typeof watchers;
  webhooks: typeof webhooks;
  workspaces: typeof workspaces;
  yjs: typeof yjs;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  prosemirrorSync: {
    lib: {
      deleteDocument: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        null
      >;
      deleteSnapshots: FunctionReference<
        "mutation",
        "internal",
        { afterVersion?: number; beforeVersion?: number; id: string },
        null
      >;
      deleteSteps: FunctionReference<
        "mutation",
        "internal",
        {
          afterVersion?: number;
          beforeTs: number;
          deleteNewerThanLatestSnapshot?: boolean;
          id: string;
        },
        null
      >;
      getSnapshot: FunctionReference<
        "query",
        "internal",
        { id: string; version?: number },
        { content: null } | { content: string; version: number }
      >;
      getSteps: FunctionReference<
        "query",
        "internal",
        { id: string; version: number },
        {
          clientIds: Array<string | number>;
          steps: Array<string>;
          version: number;
        }
      >;
      latestVersion: FunctionReference<
        "query",
        "internal",
        { id: string },
        null | number
      >;
      submitSnapshot: FunctionReference<
        "mutation",
        "internal",
        {
          content: string;
          id: string;
          pruneSnapshots?: boolean;
          version: number;
        },
        null
      >;
      submitSteps: FunctionReference<
        "mutation",
        "internal",
        {
          clientId: string | number;
          id: string;
          steps: Array<string>;
          version: number;
        },
        | {
            clientIds: Array<string | number>;
            status: "needs-rebase";
            steps: Array<string>;
          }
        | { status: "synced" }
      >;
    };
  };
  presence: {
    public: {
      disconnect: FunctionReference<
        "mutation",
        "internal",
        { sessionToken: string },
        null
      >;
      heartbeat: FunctionReference<
        "mutation",
        "internal",
        {
          interval?: number;
          roomId: string;
          sessionId: string;
          userId: string;
        },
        { roomToken: string; sessionToken: string }
      >;
      list: FunctionReference<
        "query",
        "internal",
        { limit?: number; roomToken: string },
        Array<{
          data?: any;
          lastDisconnected: number;
          online: boolean;
          userId: string;
        }>
      >;
      listRoom: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; roomId: string },
        Array<{ lastDisconnected: number; online: boolean; userId: string }>
      >;
      listUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; userId: string },
        Array<{ lastDisconnected: number; online: boolean; roomId: string }>
      >;
      removeRoom: FunctionReference<
        "mutation",
        "internal",
        { roomId: string },
        null
      >;
      removeRoomUser: FunctionReference<
        "mutation",
        "internal",
        { roomId: string; userId: string },
        null
      >;
      updateRoomUser: FunctionReference<
        "mutation",
        "internal",
        { data?: any; roomId: string; userId: string },
        null
      >;
    };
  };
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
  aggregate: {
    btree: {
      aggregateBetween: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any },
        { count: number; sum: number }
      >;
      aggregateBetweenBatch: FunctionReference<
        "query",
        "internal",
        { queries: Array<{ k1?: any; k2?: any; namespace?: any }> },
        Array<{ count: number; sum: number }>
      >;
      atNegativeOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffsetBatch: FunctionReference<
        "query",
        "internal",
        {
          queries: Array<{
            k1?: any;
            k2?: any;
            namespace?: any;
            offset: number;
          }>;
        },
        Array<{ k: any; s: number; v: any }>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { key: any; namespace?: any },
        null | { k: any; s: number; v: any }
      >;
      offset: FunctionReference<
        "query",
        "internal",
        { k1?: any; key: any; namespace?: any },
        number
      >;
      offsetUntil: FunctionReference<
        "query",
        "internal",
        { k2?: any; key: any; namespace?: any },
        number
      >;
      paginate: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          k1?: any;
          k2?: any;
          limit: number;
          namespace?: any;
          order: "asc" | "desc";
        },
        {
          cursor: string;
          isDone: boolean;
          page: Array<{ k: any; s: number; v: any }>;
        }
      >;
      paginateNamespaces: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit: number },
        { cursor: string; isDone: boolean; page: Array<any> }
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { namespace?: any },
        any
      >;
    };
    inspect: {
      display: FunctionReference<"query", "internal", { namespace?: any }, any>;
      dump: FunctionReference<"query", "internal", { namespace?: any }, string>;
      inspectNode: FunctionReference<
        "query",
        "internal",
        { namespace?: any; node?: string },
        null
      >;
      listTreeNodes: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          aggregate?: { count: number; sum: number };
          items: Array<{ k: any; s: number; v: any }>;
          subtrees: Array<string>;
        }>
      >;
      listTrees: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          maxNodeSize: number;
          namespace?: any;
          root: string;
        }>
      >;
    };
    public: {
      clear: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      delete_: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        null
      >;
      deleteIfExists: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        any
      >;
      init: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any; summand?: number; value: any },
        null
      >;
      makeRootLazy: FunctionReference<
        "mutation",
        "internal",
        { namespace?: any },
        null
      >;
      replace: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        null
      >;
      replaceOrInsert: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        any
      >;
    };
  };
  actionCache: {
    crons: {
      purge: FunctionReference<
        "mutation",
        "internal",
        { expiresAt?: number },
        null
      >;
    };
    lib: {
      get: FunctionReference<
        "query",
        "internal",
        { args: any; name: string; ttl: number | null },
        { kind: "hit"; value: any } | { expiredEntry?: string; kind: "miss" }
      >;
      put: FunctionReference<
        "mutation",
        "internal",
        {
          args: any;
          expiredEntry?: string;
          name: string;
          ttl: number | null;
          value: any;
        },
        { cacheHit: boolean; deletedExpiredEntry: boolean }
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        { args: any; name: string },
        null
      >;
      removeAll: FunctionReference<
        "mutation",
        "internal",
        { batchSize?: number; before?: number; name?: string },
        null
      >;
    };
  };
};
