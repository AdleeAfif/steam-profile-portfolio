import type { components } from "./schema";

type Schemas = components["schemas"];

export type ApiError = Schemas["Error"]["error"];
export type StatusKind = Schemas["StatusKind"];
export type Level = Schemas["Level"];
export type Status = Schemas["Status"];
export type ProfileView = Schemas["ProfileView"];
export type Profile = Schemas["Profile"];
export type StatusConfig = Schemas["StatusConfig"];
export type Company = Schemas["Company"];
export type CompanyKind = Schemas["CompanyKind"];
export type Skill = Schemas["Skill"];
export type SkillCategory = Schemas["SkillCategory"];
export type SkillDetail = Schemas["SkillDetail"];
export type Certificate = Schemas["Certificate"];
export type CertificateList = Schemas["CertificateList"];
export type Project = Schemas["Project"];
export type ProjectAchievement = Schemas["ProjectAchievement"];
export type Achievement = Schemas["Achievement"];
export type AchievementList = Schemas["AchievementList"];
export type Friend = Schemas["Friend"];
export type FriendKind = Schemas["FriendKind"];
export type Group = Schemas["Group"];
export type Review = Schemas["Review"];
export type WorkshopItem = Schemas["WorkshopItem"];
export type WorkshopKind = Schemas["WorkshopKind"];
export type WishlistItem = Schemas["WishlistItem"];
export type Activity = Schemas["Activity"];
export type RepoActivity = Schemas["RepoActivity"];
export type Replay = Schemas["Replay"];
export type ReplayYears = Schemas["ReplayYears"];
export type Comment = Schemas["Comment"];
export type CommentPage = Schemas["CommentPage"];
export type CommentCreate = Schemas["CommentCreate"];
export type MessageCreate = Schemas["MessageCreate"];
export type MessageCreated = Schemas["MessageCreated"];
export type Client = Schemas["Client"];
export type ClientFeature = Schemas["ClientFeature"];
export type AdminEntity = Schemas["AdminEntity"];
export type LoginResponse = Schemas["LoginResponse"];
export type Me = Schemas["Me"];
export type StatusUpdate = Schemas["StatusUpdate"];
export type AdminMessage = Schemas["AdminMessage"];
export type AdminMessagePage = Schemas["AdminMessagePage"];
export type SummaryItem = Schemas["SummaryItem"];
export type Collection = components["parameters"]["Collection"];

export const COLLECTIONS: readonly Collection[] = [
  "companies",
  "skills",
  "certificates",
  "projects",
  "achievements",
  "friends",
  "groups",
  "reviews",
  "workshop",
  "wishlist",
  "clients",
];

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; error: ApiError | null };
