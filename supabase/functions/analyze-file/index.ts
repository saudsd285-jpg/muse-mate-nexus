import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileUrl, fileName, fileType, model } = await req.json();
    if (!fileUrl) {
      return new Response(JSON.stringify({ error: "File URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const selectedModel = model || "google/gemini-3-flash-preview";
    const isImage = fileType?.startsWith("image/");

    let messages;
    if (isImage) {
      messages = [
        {
          role: "system",
          content: "أنت UXIN AI. حلل الصورة المرسلة بدقة وقدم وصفاً تفصيلياً. أجب بنفس لغة المستخدم.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: `حلل هذه الصورة (${fileName}) وأخبرني بمحتواها بالتفصيل.` },
            { type: "image_url", image_url: { url: fileUrl } },
          ],
        },
      ];
    } else {
      // For text/PDF files, fetch content and send as text
      let fileContent = "";
      try {
        const resp = await fetch(fileUrl);
        fileContent = await resp.text();
        // Truncate very large files
        if (fileContent.length > 30000) {
          fileContent = fileContent.substring(0, 30000) + "\n\n... (تم اقتطاع بقية المحتوى)";
        }
      } catch (err) {
        console.error("Error fetching file:", err);
        fileContent = "(لم أتمكن من قراءة محتوى الملف)";
      }

      messages = [
        {
          role: "system",
          content: "أنت UXIN AI. حلل الملف المرسل وقدم ملخصاً شاملاً لمحتواه. أجب بنفس لغة المحتوى.",
        },
        {
          role: "user",
          content: `حلل هذا الملف "${fileName}" (نوع: ${fileType}):\n\n${fileContent}`,
        },
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: selectedModel, messages }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "فشل في تحليل الملف" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "لم أتمكن من تحليل الملف";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-file error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
