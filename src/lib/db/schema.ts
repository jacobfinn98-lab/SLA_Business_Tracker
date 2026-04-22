import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "training_associate",
  "associate",
  "marketing_director",
  "senior_marketing_director",
  "admin",
]);

export const contactTypeEnum = pgEnum("contact_type", [
  "prospect",
  "client",
  "agent",
  "network",
]);

export const contactSegmentEnum = pgEnum("contact_segment", [
  "prospect",
  "client",
  "agent",
  "network",
]);

export const bpmFormatEnum = pgEnum("bpm_format", ["in-person", "online"]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
]);

// ─── Teams ────────────────────────────────────────────────────────────────────

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamName: text("team_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name").notNull(),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("training_associate"),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Sessions (better-auth managed) ──────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Team Members ─────────────────────────────────────────────────────────────

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull().default("training_associate"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// ─── Contacts ─────────────────────────────────────────────────────────────────

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  profilePicUrl: text("profile_pic_url"),
  occupation: text("occupation"),
  company: text("company"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  linkedin: text("linkedin"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  xHandle: text("x_handle"),
  archetype: text("archetype"),
  contactType: contactTypeEnum("contact_type").notNull(),
  // 8 SLA qualifiers
  married: boolean("married").notNull().default(false),
  age25Plus: boolean("age_25_plus").notNull().default(false),
  children: boolean("children").notNull().default(false),
  homeOwner: boolean("home_owner").notNull().default(false),
  occupationQualifier: boolean("occupation_qualifier").notNull().default(false),
  ambitious: boolean("ambitious").notNull().default(false),
  dissatisfied: boolean("dissatisfied").notNull().default(false),
  entrepreneurial: boolean("entrepreneurial").notNull().default(false),
  comments: text("comments"),
  referredBy: text("referred_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Activities / Appointments ────────────────────────────────────────────────

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  contactSegment: contactSegmentEnum("contact_segment").notNull(),
  dateTime: timestamp("date_time").notNull(),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── BPM Guests ───────────────────────────────────────────────────────────────

export const bpmGuests = pgTable("bpm_guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  contactName: text("contact_name").notNull(),
  attended: boolean("attended").notNull().default(false),
  format: bpmFormatEnum("format").notNull(),
  dateAttended: timestamp("date_attended").notNull(),
  bookNextStep: text("book_next_step"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Daily Challenges ─────────────────────────────────────────────────────────

export const dailyChallenges = pgTable("daily_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rpValue: integer("rp_value").notNull().default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Challenge Submissions ────────────────────────────────────────────────────

export const challengeSubmissions = pgTable(
  "challenge_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => dailyChallenges.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    proofImageUrl: text("proof_image_url"),
    goodFaithAcknowledged: boolean("good_faith_acknowledged")
      .notNull()
      .default(false),
    status: submissionStatusEnum("status").notNull().default("pending"),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at"),
  },
  (table) => ({
    agentChallengeDayUniqueIdx: uniqueIndex(
      "challenge_submissions_agent_challenge_day_uidx"
    ).on(
      table.agentId,
      table.challengeId,
      sql`date(${table.submittedAt} at time zone 'utc')`
    ),
  })
);

// ─── Business Submissions ─────────────────────────────────────────────────────

export const businessSubmissions = pgTable("business_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  servicingAgentId: uuid("servicing_agent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contractNumber: text("contract_number").notNull(),
  details: text("details").notNull(),
  comments: text("comments"),
  servicingPoints: integer("servicing_points").notNull(),
  licensedSplitAgentCode: text("licensed_split_agent_code"),
  licensedSplitPoints: integer("licensed_split_points"),
  nonLicensedAgentCode: text("non_licensed_agent_code"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

// ─── Recruits ─────────────────────────────────────────────────────────────────

export const recruits = pgTable("recruits", {
  id: uuid("id").primaryKey().defaultRandom(),
  recruitingAgentId: uuid("recruiting_agent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agentCode: text("agent_code").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

// ─── Providers ────────────────────────────────────────────────────────────────

export const providers = pgTable(
  "providers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    carrierName: text("carrier_name").notNull(),
    logoUrl: text("logo_url"),
    details: text("details"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("providers_carrier_name_idx").on(t.carrierName)]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, { fields: [users.teamId], references: [teams.id] }),
  contacts: many(contacts),
  activities: many(activities),
  bpmGuests: many(bpmGuests),
  challengeSubmissions: many(challengeSubmissions),
  businessSubmissions: many(businessSubmissions),
  recruits: many(recruits),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  users: many(users),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  owner: one(users, { fields: [contacts.ownerId], references: [users.id] }),
  activities: many(activities),
  bpmGuests: many(bpmGuests),
}));

export const challengeSubmissionsRelations = relations(
  challengeSubmissions,
  ({ one }) => ({
    challenge: one(dailyChallenges, {
      fields: [challengeSubmissions.challengeId],
      references: [dailyChallenges.id],
    }),
    agent: one(users, {
      fields: [challengeSubmissions.agentId],
      references: [users.id],
    }),
    reviewer: one(users, {
      fields: [challengeSubmissions.reviewedById],
      references: [users.id],
    }),
  })
);
