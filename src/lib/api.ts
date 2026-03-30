import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-file`;
const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-search`;

export function getAiModel(): string {
  return localStorage.getItem("uxin-ai-model") || "google/gemini-3-flash-preview";
}

export function setAiModel(model: string) {
  localStorage.setItem("uxin-ai-model", model);
}

export const AI_MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Lovable AI (سريع)", provider: "lovable" },
  { id: "google/gemini-2.5-pro", label: "Lovable AI (متقدم)", provider: "lovable" },
  { id: "openai/gpt-5", label: "OpenAI GPT-5", provider: "openai" },
  { id: "openai/gpt-5-mini", label: "OpenAI GPT-5 Mini", provider: "openai" },
  { id: "google/gemini-2.5-flash", label: "Google Gemini Flash", provider: "google" },
];

export async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
  signal,
  dialect,
  emotion,
}: {
  messages: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
  dialect?: string;
  emotion?: string;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, model: getAiModel(), dialect, emotion }),
      signal,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "خطأ غير متوقع" }));
      onError(err.error || `Error ${resp.status}`);
      return;
    }

    if (!resp.body) { onError("No response body"); return; }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { onDone(); return; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
    onDone();
  } catch (e) {
    if ((e as any)?.name === "AbortError") { onDone(); return; }
    onError(e instanceof Error ? e.message : "خطأ في الاتصال");
  }
}

export async function generateImage(prompt: string, style: string = "realistic"): Promise<{ imageUrl?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-image", {
      body: { prompt, style },
    });
    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    return { imageUrl: data.imageUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "فشل في إنشاء الصورة" };
  }
}

export async function analyzeFile(fileUrl: string, fileName: string, fileType: string): Promise<{ analysis?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("analyze-file", {
      body: { fileUrl, fileName, fileType, model: getAiModel() },
    });
    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    return { analysis: data.analysis };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "فشل في تحليل الملف" };
  }
}

export async function webSearch(query: string): Promise<{ result?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("web-search", {
      body: { query, model: getAiModel() },
    });
    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    return { result: data.result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "فشل في البحث" };
  }
}

export async function uploadFile(file: File, userId: string): Promise<{ url?: string; error?: string }> {
  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;
  const { error } = await supabase.storage.from("chat-uploads").upload(filePath, file);
  if (error) return { error: error.message };
  const { data } = supabase.storage.from("chat-uploads").getPublicUrl(filePath);
  return { url: data.publicUrl };
}

export async function loadConversations() {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createConversation(title: string, userId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ title, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteConversation(id: string) {
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) throw error;
}

export async function loadMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function saveMessage(conversationId: string, userId: string, role: string, content: string, imageUrl?: string) {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, user_id: userId, role, content, image_url: imageUrl });
  if (error) throw error;
}

export async function updateConversationTitle(id: string, title: string) {
  const { error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", id);
  if (error) throw error;
}
