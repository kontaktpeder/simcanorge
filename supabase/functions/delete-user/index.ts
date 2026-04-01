import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DeleteUserRequest {
  user_id: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Mangler autorisasjon" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body: DeleteUserRequest = await req.json();
    const targetUserId = body?.user_id;
    if (!targetUserId || typeof targetUserId !== "string") {
      return new Response(
        JSON.stringify({ error: "Mangler user_id" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Ugyldig token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const callerId = claimsData.claims.sub;

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(
        JSON.stringify({ error: "Kun admin kan slette brukere" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Invalider alle aktive sesjoner før sletting
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(
      targetUserId,
      "global"
    );
    if (signOutError) {
      console.warn("signOut warning (non-fatal):", signOutError.message);
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      console.error("deleteUser error:", deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await supabaseAdmin
      .from("account_requests")
      .update({
        status: "done",
        admin_note: "Bruker slettet",
        resolved_by: callerId,
        resolved_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId);

    return new Response(
      JSON.stringify({ success: true, message: "Bruker slettet" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in delete-user:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Ukjent feil" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
