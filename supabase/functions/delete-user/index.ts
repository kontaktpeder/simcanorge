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

    // Verify caller identity
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
    const isSelfDelete = callerId === targetUserId;

    // Allow self-deletion OR admin deletion of others
    if (!isSelfDelete) {
      const { data: roleRow } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("user_id", callerId)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleRow) {
        return new Response(
          JSON.stringify({ error: "Kun admin kan slette andre brukere" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // 1. Purge user data not covered by FK cascades
    const { error: purgeError } = await supabaseAdmin.rpc(
      "purge_user_data_before_auth_delete",
      { _user_id: targetUserId }
    );
    if (purgeError) {
      console.error("purge error:", purgeError);
      return new Response(
        JSON.stringify({ error: "Feil ved opprydding av brukerdata: " + purgeError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. Clean up Storage files for this user
    try {
      // Owner avatars
      const { data: ownerFiles } = await supabaseAdmin.storage
        .from("simca-images")
        .list(`owners/${targetUserId}`);
      if (ownerFiles && ownerFiles.length > 0) {
        const paths = ownerFiles.map((f) => `owners/${targetUserId}/${f.name}`);
        await supabaseAdmin.storage.from("simca-images").remove(paths);
      }

      // Person profile avatars & covers (stored under person profile id, need to look up)
      const { data: personProfile } = await supabaseAdmin
        .from("person_profiles")
        .select("id")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (personProfile) {
        const profilePaths = [
          `profiles/${personProfile.id}/avatar.webp`,
          `profiles/${personProfile.id}/cover.webp`,
        ];
        await supabaseAdmin.storage.from("simca-images").remove(profilePaths);
      }
    } catch (storageErr) {
      console.warn("Storage cleanup warning (non-fatal):", storageErr);
    }

    // 3. Invalidate all active sessions
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(
      targetUserId,
      "global"
    );
    if (signOutError) {
      console.warn("signOut warning (non-fatal):", signOutError.message);
    }

    // 4. Delete the user from auth (triggers FK cascades)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      console.error("deleteUser error:", deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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
