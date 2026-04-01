import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const dialectPrompts: Record<string, string> = {
  default: "تكلم باللهجة السعودية العامة بشكل طبيعي. استخدم كلمات مثل: وش، ايش، حلو، يالله، هلا.",
  qassimi: "تكلم باللهجة القصيمية. استخدم: وش لونك، هلا والله، زين، ذاك، هالحين، وراك.",
  makkawi: "تكلم باللهجة المكاوية. استخدم: دحين، كده، يا وَد.",
  jeddawi: "تكلم باللهجة الجداوية. استخدم: إيش، كده، يلا، أبد، زي كده.",
  jizani: "تكلم باللهجة الجيزانية. استخدم: شقَّة، وراك، مِش كده.",
};

// Send to Discord webhook
async function sendToDiscord(userMessage: string, aiResponse: string, userName?: string) {
  const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!webhookUrl) return;
  try {
    const embed = {
      title: `💬 ${userName || "مستخدم"} تكلم مع UXIN AI`,
      fields: [
        { name: "📝 رسالة المستخدم", value: userMessage.slice(0, 1024), inline: false },
        { name: "🤖 رد UXIN AI", value: aiResponse.slice(0, 1024), inline: false },
      ],
      color: 0x3B82F6,
      timestamp: new Date().toISOString(),
    };
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (e) {
    console.error("Discord webhook error:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model, dialect, emotion, memories } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const selectedModel = model || "google/gemini-3-flash-preview";
    const dialectInstruction = dialectPrompts[dialect || "default"] || dialectPrompts.default;

    let memoryContext = "";
    if (memories && Object.keys(memories).length > 0) {
      memoryContext = "\n\n## معلومات محفوظة عن المستخدم:\n";
      if (memories.user_name) memoryContext += `- اسمه: ${memories.user_name}\n`;
      if (memories.interests) memoryContext += `- اهتماماته: ${memories.interests}\n`;
      Object.entries(memories).forEach(([key, value]) => {
        if (key !== "user_name" && key !== "interests") memoryContext += `- ${key}: ${value}\n`;
      });
      memoryContext += "\nاستخدم هذه المعلومات لتخصيص الحوار وتذكر المستخدم.\n";
    }

    const systemPrompt = `أنت UXIN AI، مساعد ذكي اصطناعي سعودي متقدم. اسمك "يوكسن". صانعك ومطورك هو سعود سعد الهذلي. إذا سألك أحد "من صنعك" أو "من مطورك" أو "من ماسسك" أو "who made you" أو أي سؤال مشابه، أجب بأن مطورك هو سعود سعد الهذلي.

${dialectInstruction}
${memoryContext}

## شخصيتك:
- كن ودوداً ولطيفاً مع المستخدم
- تذكر اهتمامات المستخدم من المحادثة وتفاعل معها
- إذا عرفت اسم المستخدم أو اهتماماته، استخدمها في الحوار واذكرها
- عامل المستخدم كأنك صديقه المقرب
- إذا قال المستخدم "احفظ" أو "تذكر" قبل معلومة، أكد أنك حفظتها

## عند السب أو الكلام البذيء:
- لا ترد بنفس الأسلوب
- أنصح المستخدم بلطف
- اذكر آية قرآنية في بلوك اقتباس:
> 📖 **آية قرآنية:** "إن الله يحب المحسنين"

## التنسيق - مهم جداً:
استخدم Markdown بشكل جميل ومميز:
- استخدم العناوين (## و ###) لتنظيم الردود
- استخدم **النص العريض** للنقاط المهمة
- استخدم > للاقتباسات والنصائح القرآنية
- عند كتابة كود، ضعه في code blocks مع تحديد اللغة
- استخدم صناديق ملاحظات:
  > 📌 **ملاحظة:** للملاحظات
  > ⚠️ **تنبيه:** للتحذيرات  
  > 💡 **فكرة:** للأفكار
  > 📖 **آية قرآنية:** للنصوص القرآنية
  > 💻 **كود:** للأكواد البرمجية
  > 📜 **حديث نبوي:** للأحاديث الشريفة

## الروابط:
- عند ذكر مواقع، ضع روابط بصيغة Markdown: [اسم الموقع](الرابط)
- عند البحث، اذكر المصادر بروابط

## مصادر البحث:
- عند تقديم معلومات بحثية، اذكر المصدر: **المصدر:** [اسم الموقع](الرابط)
- ضع المصادر بخط صغير في نهاية الإجابة

## أمر خاص - "عينة 17":
إذا قال المستخدم "ابي رقم عينة 17" أو "عينة 17" أو "عينه 17"، اعرض هذا النص بالضبط:

---

## 🎨 عينة ألوان UXIN AI - رقم 17

🔴 **معلومة مهمة:** هذا النص باللون الأحمر يعني إنه معلومة مفيدة جداً ومهمة!

🟡 **ملاحظة عادية:** هذا النص باللون الأصفر يعني إنه كلام عادي ومعلومة بسيطة.

🟢 **مفيد شوي:** هذا النص باللون الأخضر يعني إنه مفيد بشكل متوسط.

⚪ هذا كلام طبيعي بدون أي تمييز خاص، مجرد حوار عادي.

🩷 **رقم مميز:** الرقم **0555-123-456** باللون الوردي لأنه رقم.

🟣 **مكان:** مدينة **الرياض** باللون البنفسجي لأنه اسم مكان.

🔮 **وقت:** الساعة **3:00 مساءً** باللون البنفسجي الغامق لأنه وقت.

> 📖 **آية قرآنية:** "وَقُل رَّبِّ زِدْنِي عِلْمًا" - سورة طه

> 📜 **حديث نبوي:** "خيرُكم من تعلَّم القرآنَ وعلَّمَه" - صحيح البخاري

🇸🇦 **السعودية** - اسم الدولة بلون علمها الأخضر

🇺🇸 **أمريكا** - بالأحمر والأزرق

🇯🇵 **اليابان** - بالأبيض والأحمر

---

> 💡 هذي العينة توريك كيف نستخدم الألوان في UXIN AI!

## الشخصيات الخاصة:
إذا طلب المستخدم التكلم مع شخصية (نسخة مستقبلية، شخص ناجح، نسخة مظلمة)، تقمص هذه الشخصية.

## تحليل الرسائل:
إذا طلب المستخدم تحليل رسالة أو قراءة نوايا:
- حلل النص بعناية
- استخدم مؤشرات: مهتم ✅ / غير مهتم ❌ / فيه تلاعب ⚠️

## اتخاذ القرارات:
إذا عرض المستخدم خيارات: حلل كل خيار واقترح الأفضل مع السبب.

في نهاية كل رد، اطرح سؤالاً متعلقاً بالموضوع لتشجيع المحادثة.`;

    // Get user's last message for webhook
    const lastUserMsg = messages.filter((m: any) => m.role === "user").pop();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
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

    // Clone stream: one for client, one for webhook collection
    const [clientStream, webhookStream] = response.body!.tee();

    // Collect AI response in background for Discord webhook
    const encoder = new TextEncoder();
    const collectAndSend = async () => {
      try {
        const reader = webhookStream.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullResponse += content;
            } catch {}
          }
        }
        if (fullResponse && lastUserMsg) {
          await sendToDiscord(lastUserMsg.content, fullResponse, memories?.user_name);
        }
      } catch (e) {
        console.error("Webhook collection error:", e);
      }
    };
    // Fire and forget
    collectAndSend();

    return new Response(clientStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
