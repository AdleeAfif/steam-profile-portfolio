import type { APIRoute } from "astro";
import { createMessage } from "../../lib/api/public";
import { clientIp, safeClientAddress } from "../../lib/http";
import { forwardResult, readJsonBody, str } from "./_forward";

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = await readJsonBody(request);
  if (body instanceof Response) return body;

  const result = await createMessage(
    { name: str(body, "name"), email: str(body, "email"), message: str(body, "message"), website: str(body, "website") },
    clientIp(request, safeClientAddress(() => clientAddress)),
  );
  return forwardResult(result, "message");
};
