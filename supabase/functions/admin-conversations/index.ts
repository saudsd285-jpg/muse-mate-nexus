import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { password, action, conversationId } = await req.json();
    
    if (password !== "135579") {
      return new Response(JSON.stringify({ error: "كلمة السر غير صحيحة" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500);
      
      if (error) throw error;

      // Get user emails for display
      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      const userMap: Record<string, string> = {};
      
      for (const uid of userIds) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (userData?.user) {
          userMap[uid] = userData.user.email || userData.user.user_metadata?.full_name || uid.slice(0, 8);
        }
      }

      return new Response(JSON.stringify({ conversations: data, users: userMap }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "messages" && conversationId) {
      const { data, error } = await supabaseAdmin
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;

      return new Response(JSON.stringify({ messages: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
