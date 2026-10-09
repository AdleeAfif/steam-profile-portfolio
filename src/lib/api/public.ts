import createClient from "openapi-fetch";
import { PROFILE_API_APP, PROFILE_API_KEY, PROFILE_API_URL } from "astro:env/server";
import type { paths } from "./schema";
import { settle, timedFetch } from "./result";
import type {
  AchievementList,
  Activity,
  ApiResult,
  Certificate,
  CertificateList,
  Comment,
  CommentCreate,
  CommentPage,
  Company,
  Friend,
  Group,
  MessageCreate,
  MessageCreated,
  ProfileView,
  Project,
  Replay,
  ReplayYears,
  Review,
  Skill,
  SkillCategory,
  SkillDetail,
  Status,
  WishlistItem,
  WorkshopItem,
} from "./types";

const client = createClient<paths>({ baseUrl: PROFILE_API_URL, fetch: timedFetch });

type Items<T> = { items: T[] };

export const getProfile = (): Promise<ApiResult<ProfileView>> => settle(client.GET("/v1/profile"));

export const getStatus = (): Promise<ApiResult<Status>> => settle(client.GET("/v1/status"));

export const listCompanies = (): Promise<ApiResult<Items<Company>>> => settle(client.GET("/v1/companies"));

export const listSkills = (query: { company?: string; category?: SkillCategory; q?: string } = {}): Promise<
  ApiResult<Items<Skill>>
> => settle(client.GET("/v1/skills", { params: { query } }));

export const getSkill = (id: string): Promise<ApiResult<SkillDetail>> =>
  settle(client.GET("/v1/skills/{id}", { params: { path: { id } } }));

export const listCertificates = (): Promise<ApiResult<CertificateList>> => settle(client.GET("/v1/certificates"));

export const getCertificate = (id: string): Promise<ApiResult<Certificate>> =>
  settle(client.GET("/v1/certificates/{id}", { params: { path: { id } } }));

export const listProjects = (): Promise<ApiResult<Items<Project>>> => settle(client.GET("/v1/projects"));

export const getProject = (slug: string): Promise<ApiResult<Project>> =>
  settle(client.GET("/v1/projects/{slug}", { params: { path: { slug } } }));

export const listAchievements = (): Promise<ApiResult<AchievementList>> => settle(client.GET("/v1/achievements"));

export const listFriends = (): Promise<ApiResult<Items<Friend>>> => settle(client.GET("/v1/friends"));

export const listGroups = (): Promise<ApiResult<Items<Group>>> => settle(client.GET("/v1/groups"));

export const listReviews = (): Promise<ApiResult<Items<Review>>> => settle(client.GET("/v1/reviews"));

export const listWorkshop = (): Promise<ApiResult<Items<WorkshopItem>>> => settle(client.GET("/v1/workshop"));

export const listWishlist = (): Promise<ApiResult<Items<WishlistItem>>> => settle(client.GET("/v1/wishlist"));

export const getActivity = (): Promise<ApiResult<Activity>> => settle(client.GET("/v1/activity"));

export const getReplayYears = (): Promise<ApiResult<ReplayYears>> =>
  settle(client.GET("/v1/replay")) as Promise<ApiResult<ReplayYears>>;

export const getReplay = (year: number): Promise<ApiResult<Replay>> =>
  settle(client.GET("/v1/replay", { params: { query: { year } } })) as Promise<ApiResult<Replay>>;

export const listComments = (query: { cursor?: string; limit?: number } = {}): Promise<ApiResult<CommentPage>> =>
  settle(client.GET("/v1/apps/{app}/comments", { params: { path: { app: PROFILE_API_APP }, query } }));

function serverHeaders(clientIp: string | null): Record<string, string> {
  const headers: Record<string, string> = { "X-API-Key": PROFILE_API_KEY };
  if (clientIp) headers["X-Client-IP"] = clientIp;
  return headers;
}

export const createComment = (body: CommentCreate, clientIp: string | null): Promise<ApiResult<Comment>> =>
  settle(
    client.POST("/v1/apps/{app}/comments", {
      params: { path: { app: PROFILE_API_APP } },
      headers: serverHeaders(clientIp),
      body,
    }),
  );

export const createMessage = (body: MessageCreate, clientIp: string | null): Promise<ApiResult<MessageCreated>> =>
  settle(
    client.POST("/v1/apps/{app}/messages", {
      params: { path: { app: PROFILE_API_APP } },
      headers: serverHeaders(clientIp),
      body,
    }),
  );
