import { useState, useRef, useEffect, useCallback } from "react";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessage from "@/components/chat/ChatMessage";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ConversationSidebar, { Conversation } from "@/components/chat/ConversationSidebar";
import SettingsDialog from "@/components/chat/SettingsDialog";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import AdminPanel from "@/components/chat/AdminPanel";
import VoiceCallDialog from "@/components/chat/VoiceCallDialog";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  streamChat,
  generateImage,
  analyzeFile,
  webSearch,
  uploadFile,
  loadConversations,
  createConversation,
  deleteConversation as deleteConvApi,
  loadMessages,
  saveMessage,
  updateConversationTitle,
  getAiModel,
} from "@/lib/api";
import { getDialect, getEmotion } from "@/components/chat/SettingsDialog";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; image_url?: string };

const Index = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [voiceCallOpen, setVoiceCallOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!user) return;
    loadConversations().then((data) => {
      setConversations(
        data.map((c: any) => ({ id: c.id, title: c.title, createdAt: new Date(c.created_at) }))
      );
    });
  }, [user]);

  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    loadMessages(activeConvId).then((data) => {
      setMessages(data.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content, image_url: m.image_url })));
    });
  }, [activeConvId]);

  const ensureConversation = async (title: string): Promise<string> => {
    if (activeConvId) return activeConvId;
    const conv = await createConversation(title.slice(0, 40) + (title.length > 40 ? "..." : ""), user!.id);
    setActiveConvId(conv.id);
    setConversations((prev) => [{ id: conv.id, title: conv.title, createdAt: new Date(conv.created_at) }, ...prev]);
    return conv.id;
  };

  const autoTitleConversation = async (convId: string, userMessage: string, aiResponse: string) => {
    // Generate a short title from the first exchange
    try {
      let title = userMessage.slice(0, 35);
      if (userMessage.length > 35) title += "...";
      // Use the AI to generate a better title
      const titleMessages = [
        { role: "user" as const, content: `اكتب عنوان قصير جداً (أقل من 5 كلمات) لمحادثة بدأت بهذا السؤال: "${userMessage.slice(0, 100)}". اكتب العنوان فقط بدون أي شيء آخر.` }
      ];
      let generatedTitle = "";
      await streamChat({
        messages: titleMessages,
        onDelta: (chunk) => { generatedTitle += chunk; },
        onDone: async () => {
          const clean = generatedTitle.replace(/["\n]/g, "").trim().slice(0, 40);
          if (clean) {
            await updateConversationTitle(convId, clean);
            setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, title: clean } : c));
          }
        },
        onError: () => {},
      });
    } catch {}
  };

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const handleSend = async (message: string) => {
    if (!user) return;
    const isImageRequest = /(?:أنشئ|ارسم|صمم|ولّد|اصنع|generate|create|draw|make)\s*(?:صورة|رسم|image|picture|photo)/i.test(message);
    const isFirstMessage = messages.length === 0;
    const convId = await ensureConversation(message);
    const userMsg: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    await saveMessage(convId, user.id, "user", message);
    setIsLoading(true);

    if (isImageRequest) {
      const { imageUrl, error } = await generateImage(message);
      setIsLoading(false);
      if (error) {
        toast({ title: "خطأ", description: error, variant: "destructive" });
        const errMsg: Message = { role: "assistant", content: `عذراً، حدث خطأ: ${error}` };
        setMessages((prev) => [...prev, errMsg]);
        await saveMessage(convId, user.id, "assistant", errMsg.content);
        return;
      }
      const aiMsg: Message = { role: "assistant", content: `تم إنشاء الصورة بنجاح! 🎨\n\n![صورة](${imageUrl})`, image_url: imageUrl };
      setMessages((prev) => [...prev, aiMsg]);
      await saveMessage(convId, user.id, "assistant", aiMsg.content, imageUrl);
      if (isFirstMessage) autoTitleConversation(convId, message, "صورة");
    } else {
      const allMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      let assistantContent = "";
      const controller = new AbortController();
      abortRef.current = controller;

      await streamChat({
        messages: allMessages,
        onDelta: (chunk) => {
          assistantContent += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && !last.image_url) {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
            }
            return [...prev, { role: "assistant", content: assistantContent }];
          });
        },
        onDone: async () => {
          setIsLoading(false);
          if (assistantContent) {
            await saveMessage(convId, user.id, "assistant", assistantContent);
            if (isFirstMessage) autoTitleConversation(convId, message, assistantContent);
          }
        },
        onError: (error) => {
          setIsLoading(false);
          toast({ title: "خطأ", description: error, variant: "destructive" });
        },
        signal: controller.signal,
        dialect: getDialect(),
        emotion: getEmotion(),
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    const convId = await ensureConversation(`📎 ${file.name}`);
    const userMsg: Message = { role: "user", content: `📎 تحليل الملف: **${file.name}**` };
    setMessages((prev) => [...prev, userMsg]);
    await saveMessage(convId, user.id, "user", userMsg.content);
    setIsLoading(true);

    const { url, error: uploadError } = await uploadFile(file, user.id);
    if (uploadError || !url) {
      setIsLoading(false);
      toast({ title: "خطأ", description: uploadError || "فشل رفع الملف", variant: "destructive" });
      return;
    }

    const { analysis, error } = await analyzeFile(url, file.name, file.type);
    setIsLoading(false);

    if (error) {
      const errMsg: Message = { role: "assistant", content: `عذراً، فشل تحليل الملف: ${error}` };
      setMessages((prev) => [...prev, errMsg]);
      await saveMessage(convId, user.id, "assistant", errMsg.content);
      return;
    }

    const aiMsg: Message = { role: "assistant", content: analysis || "لم أتمكن من تحليل الملف" };
    setMessages((prev) => [...prev, aiMsg]);
    await saveMessage(convId, user.id, "assistant", aiMsg.content);
  };

  const handleSearch = async (query: string) => {
    if (!user) return;
    const convId = await ensureConversation(query);
    const userMsg: Message = { role: "user", content: `🔍 بحث: **${query}**` };
    setMessages((prev) => [...prev, userMsg]);
    await saveMessage(convId, user.id, "user", userMsg.content);
    setIsLoading(true);

    const { result, error } = await webSearch(query);
    setIsLoading(false);

    if (error) {
      toast({ title: "خطأ", description: error, variant: "destructive" });
      return;
    }

    const aiMsg: Message = { role: "assistant", content: result || "لم يتم العثور على نتائج" };
    setMessages((prev) => [...prev, aiMsg]);
    await saveMessage(convId, user.id, "assistant", aiMsg.content);
  };

  const handleNewConversation = () => { setActiveConvId(null); setMessages([]); };

  const handleDeleteConversation = async (id: string) => {
    await deleteConvApi(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    await updateConversationTitle(id, newTitle);
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title: newTitle } : c));
  };

  const closeMobileSidebar = () => { if (isMobile) setSidebarOpen(false); };

  return (
    <div className="h-screen flex overflow-hidden" dir="rtl">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={isMobile ? { x: 280 } : { width: 0, opacity: 0 }}
            animate={isMobile ? { x: 0 } : { width: 280, opacity: 1 }}
            exit={isMobile ? { x: 280 } : { width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={`${isMobile ? "fixed top-0 right-0 bottom-0 w-[280px] z-40" : "border-l border-border flex-shrink-0 overflow-hidden"}`}
          >
            <div className="h-full relative">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-secondary hover:bg-secondary/80"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <ConversationSidebar
                conversations={conversations}
                activeId={activeConvId}
                onSelect={setActiveConvId}
                onNew={handleNewConversation}
                onDelete={handleDeleteConversation}
                onRename={handleRenameConversation}
                onClose={closeMobileSidebar}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAdmin={() => setAdminOpen(true)}
          onSignOut={signOut}
          onStartCall={() => setVoiceCallOpen(true)}
          userName={user?.user_metadata?.full_name || user?.email?.split("@")[0]}
          messages={messages.map(m => ({ role: m.role, content: m.content }))}
          conversationTitle={conversations.find(c => c.id === activeConvId)?.title}
        />

        <div className="flex-1 overflow-y-auto scrollbar-thin bg-chat-bg">
          {messages.length === 0 && !isLoading ? (
            <WelcomeScreen />
          ) : (
            <div className="py-4">
              {messages.map((msg, i) => (
                <ChatMessage key={i} role={msg.role} content={msg.content} />
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <ChatInput
          onSend={handleSend}
          onFileUpload={handleFileUpload}
          onSearch={handleSearch}
          isLoading={isLoading}
          onStop={handleStop}
        />
      </div>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} />
      <VoiceCallDialog
        open={voiceCallOpen}
        onClose={() => setVoiceCallOpen(false)}
        onMessageReceived={async (userText, aiText) => {
          if (!user) return;
          const convId = await ensureConversation(userText);
          await saveMessage(convId, user.id, "user", userText);
          await saveMessage(convId, user.id, "assistant", aiText);
          setMessages(prev => [...prev, { role: "user", content: userText }, { role: "assistant", content: aiText }]);
        }}
      />
    </div>
  );
};

export default Index;
