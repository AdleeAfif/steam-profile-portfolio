import type { APIRoute } from "astro";
import { adminApi } from "../../lib/api/admin";
import { clientIp } from "../../lib/http";
import { clearSession, readSession } from "../../lib/session";

export const POST: APIRoute = async ({ cookies, redirect, request }) => {
  const token = readSession(cookies);
  if (token) await adminApi(token, clientIp(request)).logout();
  clearSession(cookies);
  return redirect("/admin/login", 303);
};

export const GET: APIRoute = ({ redirect }) => redirect("/admin", 303);
