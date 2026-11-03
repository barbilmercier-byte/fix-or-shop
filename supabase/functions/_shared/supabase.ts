import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "./http.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

/** Service-role client. Bypasses RLS, so every query below filters by user id explicitly. */
export const admin: SupabaseClient = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

/** Resolve the signed-in user from the request's Authorization header. */
export async function requireUser(req: Request): Promise<{ id: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new HttpError(401, "Not signed in");
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw new HttpError(401, "Not signed in");
  return { id: data.user.id };
}

/** Download a user's photo from storage and return it as a base64 image block. */
export async function loadPhoto(userId: string, path: string) {
  if (!path.startsWith(`${userId}/`)) throw new HttpError(403, "Photo does not belong to you");
  const { data, error } = await admin.storage.from("symptom-photos").download(path);
  if (error || !data) throw new HttpError(400, `Could not read photo ${path}`);
  const mediaType = data.type as "image/jpeg" | "image/png" | "image/webp";
  if (!["image/jpeg", "image/png", "image/webp"].includes(mediaType)) {
    throw new HttpError(400, "Photos must be JPEG, PNG or WebP");
  }
  const bytes = new Uint8Array(await data.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return {
    type: "image" as const,
    source: { type: "base64" as const, media_type: mediaType, data: btoa(binary) },
  };
}
