import type { APIRoute } from "astro";
import { jsonResponse } from "../../lib/http";

export const GET: APIRoute = () => jsonResponse({ status: "ok" });
