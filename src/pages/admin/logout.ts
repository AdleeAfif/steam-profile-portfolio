import type { APIRoute } from "astro";
import { adminApi } from "../../lib/api/admin";
import { clearSession, readSession } from "../../lib/session";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const token = readSession(cookies);
  if (token) await adminApi(token).logout();
  clearSession(cookies);
  return redirect("/admin/login", 303);
};

export const GET: APIRoute = ({ redirect }) => redirect("/admin", 303);
