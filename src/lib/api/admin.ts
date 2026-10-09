import createClient from "openapi-fetch";
import { PROFILE_API_ADMIN_URL } from "astro:env/server";
import type { paths } from "./schema";
import { settle, timedFetch } from "./result";
import type {
  AdminEntity,
  AdminMessage,
  AdminMessagePage,
  ApiResult,
  Collection,
  Comment,
  CommentPage,
  LoginResponse,
  Me,
  Profile,
  StatusUpdate,
  SummaryItem,
} from "./types";

const client = createClient<paths>({ baseUrl: PROFILE_API_ADMIN_URL, fetch: timedFetch });

export const login = (username: string, password: string, clientIp: string | null): Promise<ApiResult<LoginResponse>> =>
  settle(
    client.POST("/v1/admin/login", {
      body: { username, password },
      headers: clientIp ? { "X-Client-IP": clientIp } : {},
    }),
  );

export function adminApi(token: string) {
  const headers = { Authorization: `Bearer ${token}` };
  return {
    logout: () => settle(client.POST("/v1/admin/logout", { headers })),
    me: (): Promise<ApiResult<Me>> => settle(client.GET("/v1/admin/me", { headers })),
    putStatus: (body: StatusUpdate): Promise<ApiResult<Profile>> =>
      settle(client.PUT("/v1/admin/status", { headers, body })) as Promise<ApiResult<Profile>>,
    getProfile: (): Promise<ApiResult<Profile>> => settle(client.GET("/v1/admin/profile", { headers })),
    putProfile: (body: Profile): Promise<ApiResult<Profile>> =>
      settle(client.PUT("/v1/admin/profile", { headers, body })),
    summary: (): Promise<ApiResult<{ items: SummaryItem[] }>> => settle(client.GET("/v1/admin/summary", { headers })),
    rotateKey: (app: string): Promise<ApiResult<{ key: string }>> =>
      settle(client.POST("/v1/admin/clients/{app}/rotate-key", { headers, params: { path: { app } } })),

    list: (collection: Collection): Promise<ApiResult<{ items: AdminEntity[] }>> =>
      settle(client.GET("/v1/admin/{collection}", { headers, params: { path: { collection } } })),
    get: (collection: Collection, id: string): Promise<ApiResult<AdminEntity>> =>
      settle(client.GET("/v1/admin/{collection}/{id}", { headers, params: { path: { collection, id } } })),

    messages: (
      app: string,
      query: { read?: boolean; cursor?: string; limit?: number } = {},
    ): Promise<ApiResult<AdminMessagePage>> =>
      settle(client.GET("/v1/admin/apps/{app}/messages", { headers, params: { path: { app }, query } })),
    updateMessage: (app: string, id: string, read: boolean): Promise<ApiResult<AdminMessage>> =>
      settle(
        client.PATCH("/v1/admin/apps/{app}/messages/{id}", { headers, params: { path: { app, id } }, body: { read } }),
      ) as Promise<ApiResult<AdminMessage>>,
    comments: (
      app: string,
      query: { approved?: boolean; cursor?: string; limit?: number } = {},
    ): Promise<ApiResult<CommentPage>> =>
      settle(client.GET("/v1/admin/apps/{app}/comments", { headers, params: { path: { app }, query } })) as Promise<
        ApiResult<CommentPage>
      >,
    updateComment: (app: string, id: string, approved: boolean): Promise<ApiResult<Comment>> =>
      settle(
        client.PATCH("/v1/admin/apps/{app}/comments/{id}", {
          headers,
          params: { path: { app, id } },
          body: { approved },
        }),
      ) as Promise<ApiResult<Comment>>,
    deleteMessage: (app: string, id: string): Promise<ApiResult<unknown>> =>
      settle(client.DELETE("/v1/admin/apps/{app}/messages/{id}", { headers, params: { path: { app, id } } })),
    deleteComment: (app: string, id: string): Promise<ApiResult<unknown>> =>
      settle(client.DELETE("/v1/admin/apps/{app}/comments/{id}", { headers, params: { path: { app, id } } })),
  };
}

export type AdminApi = ReturnType<typeof adminApi>;

const ADMIN_PROXY_PATH = /^(?:[a-z-]+)(?:\/[A-Za-z0-9._~-]+){0,3}$/;

export function isProxyablePath(path: string): boolean {
  return ADMIN_PROXY_PATH.test(path) && path !== "login" && !path.split("/").includes("..");
}

export async function forwardAdmin(
  token: string,
  method: string,
  path: string,
  search: string,
  body: string | null,
): Promise<Response> {
  const url = `${PROFILE_API_ADMIN_URL.replace(/\/$/, "")}/v1/admin/${path}${search}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body !== null) headers["Content-Type"] = "application/json";
  try {
    const res = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(5000) });
    return new Response(res.status === 204 ? null : await res.text(), {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return Response.json(
      { error: { code: "unavailable", message: "profile-api is unreachable" } },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
