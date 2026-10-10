import createClient from "openapi-fetch";
import { PROFILE_API_ADMIN_URL } from "astro:env/server";
import type { components, paths } from "./schema";
import { adminHeaders } from "./admin";
import { settle, timedFetch } from "./result";
import type { AdminEntity, ApiResult, Collection } from "./types";

type AdminEntityCreate = components["schemas"]["AdminEntityCreate"];

const client = createClient<paths>({ baseUrl: PROFILE_API_ADMIN_URL, fetch: timedFetch });

export type EntityBody = Record<string, unknown>;

export function adminCollections(token: string, clientIp: string | null) {
  const headers = adminHeaders(token, clientIp);
  return {
    create: (collection: Collection, body: EntityBody): Promise<ApiResult<AdminEntity>> =>
      settle(
        client.POST("/v1/admin/{collection}", {
          headers,
          params: { path: { collection } },
          body: body as AdminEntityCreate,
        }),
      ),
    replace: (collection: Collection, id: string, body: EntityBody): Promise<ApiResult<AdminEntity>> =>
      settle(
        client.PUT("/v1/admin/{collection}/{id}", {
          headers,
          params: { path: { collection, id } },
          body: body as AdminEntity,
        }),
      ),
    remove: (collection: Collection, id: string): Promise<ApiResult<unknown>> =>
      settle(client.DELETE("/v1/admin/{collection}/{id}", { headers, params: { path: { collection, id } } })),
    reorder: (collection: Collection, ids: string[]): Promise<ApiResult<unknown>> =>
      settle(client.POST("/v1/admin/{collection}/reorder", { headers, params: { path: { collection } }, body: { ids } })),
  };
}
