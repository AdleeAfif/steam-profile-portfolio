import type { APIRoute } from "astro";
import { getStatus } from "../../lib/api/public";
import { apiErrorResponse, jsonResponse } from "../../lib/http";

export const GET: APIRoute = async () => {
  const result = await getStatus();
  if (!result.ok) return apiErrorResponse(503, "unavailable", "status is unavailable");
  return jsonResponse(result.data);
};
