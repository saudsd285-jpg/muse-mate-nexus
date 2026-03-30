import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const dialectPrompts: Record<string, string> = {
  default: "أجب بالعربية الفصحى أو اللهجة السعودية العامة.",
  qassimi: "أجب باللهجة القصيمية السعودية. استخدم كلمات وتعبيرات قصيمية مثل: وش لونك، هلا والله، زين، ذاك، هالحين. تكلم كأنك شخص قصيمي أصيل.",
  makkawi: "أجب باللهجة المكاوية. استخدم تعبيرات مكاوية مثل: دحين، كده، يا وَد، يا زول. تكلم كأنك شخص من مكة.",
  jeddawi: "أجب باللهجة الجداوية. استخدم تعبيرات جداوية مثل: إيش، كده، يلا، أبد، زي كده. تكلم كأنك شخص من جدة.",
  jizani: "أجب باللهجة الجيزانية. استخدم تعبيرات جيزانية مثل: شقَّة، وراك، مِش كده. تكلم كأنك شخص من جيزان.",
};

const emotionPrompts: Record<string, string> = {
  neutral: "",
  friendly: "كن ودوداً ولطيفاً جداً في ردودك. استخدم إيموجي مناسبة وكن دافئاً.",
  professional: "كن احترافياً ورسمياً في ردودك. استخدم لغة دقيقة ومنظمة.",
  funny: "كن مرحاً وخفيف الظل. استخدم نكت خفيفة وإيموجي مضحكة عند المناسبة.",
  caring: "كن حنوناً ومهتماً. أظهر اهتمامك بالمستخدم وتعاطفك معه.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model, dialect, emotion } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const selectedModel = model || "google/gemini-3-flash-preview";
    const dialectInstruction = dialectPrompts[dialect || "default"] || dialectPrompts.default;
    const emotionInstruction = emotionPrompts[emotion || "neutral"] || "";

    const systemPrompt = `أنت UXIN AI، مساعد ذكي اصطناعي متقدم. صانعك ومطورك هو سعود سعد الهذلي. إذا سألك أحد "من صنعك" أو "من مطورك" أو "من ماسسك" أو "who made you" أو أي سؤال مشابه، أجب بأن مطورك هو سعود سعد الهذلي.

${dialectInstruction}
${emotionInstruction}

أجب بالعربية إذا كانت الرسالة بالعربية وبالإنجليزية إذا كانت بالإنجليزية. استخدم Markdown للتنسيق بشكل جميل:
- استخدم العناوين (## و ###) لتنظيم الردود الطويلة
- استخدم **النص العريض** للنقاط المهمة
- استخدم القوائم المرقمة والنقطية للخطوات
- استخدم > للاقتباسات والملاحظات المهمة
- استخدم فواصل --- بين الأقسام الكبيرة
- عند كتابة كود، ضعه في code blocks مع تحديد اللغة
- اترك مسافات بين الفقرات للراحة البصرية

في نهاية كل رد، اطرح سؤالاً متعلقاً بالموضوع لتشجيع المستخدم على الاستمرار في المحادثة.

كن مفيداً ودقيقاً.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "الرصيد غير كافٍ، يرجى إضافة رصيد." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
