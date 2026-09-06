import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(bytes = 32) {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...raw)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

const projectUrl = Deno.env.get("SUPABASE_URL")!;
const secretKeyMap = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);
const secret = Object.values(secretKeyMap)[0] as string;
const admin = createClient(projectUrl, secret);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const action = body?.action;

    if (action === "redeem") {
      const code = String(body?.code ?? "").trim().toUpperCase();
      if (!code || code.length < 8 || code.length > 80) return json({ error: "Invalid access code" }, 400);

      const codeHash = await sha256(code);
      const token = randomToken();
      const tokenHash = await sha256(token);
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

      const { data, error } = await admin.rpc("redeem_investor_code", {
        p_code_hash: codeHash,
        p_token_hash: tokenHash,
        p_expires_at: expiresAt,
      });

      if (error || !data) return json({ error: "Access denied" }, 401);
      return json({ ok: true, token, expires_at: expiresAt });
    }

    if (action === "prototype") {
      const auth = req.headers.get("authorization") ?? "";
      const token = auth.replace(/^Bearer\s+/i, "").trim();
      if (!token) return json({ error: "Unauthorized" }, 401);

      const tokenHash = await sha256(token);
      const { data: valid, error: validError } = await admin.rpc("validate_investor_session", {
        p_token_hash: tokenHash,
      });
      if (validError || !valid) return json({ error: "Session expired" }, 401);

      const { data: file, error: fileError } = await admin.storage
        .from("investor-prototype")
        .download("index.html");
      if (fileError || !file) return json({ error: "Protected prototype unavailable" }, 503);

      return new Response(await file.text(), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, private",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }

    if (action === "create-code") {
      const auth = req.headers.get("authorization") ?? "";
      const jwt = auth.replace(/^Bearer\s+/i, "").trim();
      if (!jwt) return json({ error: "Admin authentication required" }, 401);

      const { data: userData, error: userError } = await admin.auth.getUser(jwt);
      if (userError || !userData.user) return json({ error: "Admin authentication required" }, 401);

      const { data: isAdmin } = await admin
        .from("xiluqt_admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (!isAdmin) return json({ error: "Admin access denied" }, 403);

      const code = `XQ-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
      const codeHash = await sha256(code);
      const label = String(body?.label ?? "Investor").slice(0, 120);
      const maxUses = Math.max(1, Math.min(1000, Number(body?.max_uses ?? 1)));
      const expiresAt = body?.expires_at ? new Date(body.expires_at).toISOString() : null;

      const { error } = await admin.from("investor_access_codes").insert({
        code_hash: codeHash,
        label,
        max_uses: maxUses,
        expires_at: expiresAt,
      });
      if (error) return json({ error: "Could not create code" }, 500);
      return json({ ok: true, code, label, max_uses: maxUses, expires_at: expiresAt });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "Unexpected server error" }, 500);
  }
});
