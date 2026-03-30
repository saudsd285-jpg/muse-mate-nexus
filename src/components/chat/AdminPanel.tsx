import { useState, useEffect } from "react";
import { X, Lock, MessageSquare, Brain, Users, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

const ADMIN_PASSWORD = "135579";

const AdminPanel = ({ open, onClose }: AdminPanelProps) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [customRules, setCustomRules] = useState<{ trigger: string; response: string }[]>(() => {
    const saved = localStorage.getItem("uxin-custom-rules");
    return saved ? JSON.parse(saved) : [];
  });
  const [newTrigger, setNewTrigger] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [tab, setTab] = useState<"chats" | "rules">("chats");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError("");
      loadAllConversations();
    } else {
      setError("كلمة السر غير صحيحة");
    }
  };

  const loadAllConversations = async () => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ password: ADMIN_PASSWORD, action: "list" }),
        }
      );
      const data = await resp.json();
      if (data.conversations) {
        setAllConversations(data.conversations);
        setUserMap(data.users || {});
      }
    } catch (e) {
      console.error("Failed to load admin conversations:", e);
    }
    setLoading(false);
  };

  const viewConversation = async (convId: string) => {
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ password: ADMIN_PASSWORD, action: "messages", conversationId: convId }),
        }
      );
      const data = await resp.json();
      if (data.messages) {
        setConvMessages(data.messages);
        setSelectedConv(convId);
      }
    } catch (e) {
      console.error("Failed to load messages:", e);
    }
  };

  const addRule = () => {
    if (!newTrigger.trim() || !newResponse.trim()) return;
    const rules = [...customRules, { trigger: newTrigger.trim(), response: newResponse.trim() }];
    setCustomRules(rules);
    localStorage.setItem("uxin-custom-rules", JSON.stringify(rules));
    setNewTrigger("");
    setNewResponse("");
  };

  const removeRule = (idx: number) => {
    const rules = customRules.filter((_, i) => i !== idx);
    setCustomRules(rules);
    localStorage.setItem("uxin-custom-rules", JSON.stringify(rules));
  };

  if (!authenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-2xl border border-border w-full max-w-sm mx-4 shadow-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">لوحة المدير</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">سجّل كلمة السر للدخول</p>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="كلمة السر"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground outline-none focus:border-primary mb-3"
          />
          {error && <p className="text-destructive text-xs mb-3">{error}</p>}
          <button onClick={handleLogin}
            className="w-full py-2.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors">
            دخول
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl border border-border w-full max-w-2xl mx-4 shadow-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">🛡️ لوحة المدير</h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full flex items-center gap-1">
              <Users className="w-3 h-3" /> {allConversations.length} محادثة من جميع المستخدمين
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAllConversations} className="p-1.5 rounded-lg hover:bg-secondary" title="تحديث">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => { onClose(); setAuthenticated(false); setPassword(""); }} className="p-1.5 rounded-lg hover:bg-secondary">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5">
          <button onClick={() => setTab("chats")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === "chats" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>
            <MessageSquare className="w-4 h-4 inline ml-1" /> المحادثات
          </button>
          <button onClick={() => setTab("rules")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === "rules" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>
            <Brain className="w-4 h-4 inline ml-1" /> تعليم الذكاء
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
          {tab === "chats" && (
            <div>
              {selectedConv ? (
                <div>
                  <button onClick={() => setSelectedConv(null)} className="text-sm text-primary mb-4 hover:underline">← العودة للمحادثات</button>
                  <div className="space-y-3">
                    {convMessages.map((m) => (
                      <div key={m.id} className={`p-3 rounded-xl text-sm ${m.role === "user" ? "bg-primary/10 border border-primary/20" : "bg-secondary"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">{m.role === "user" ? "👤 المستخدم" : "🤖 الذكاء"}</span>
                          <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("ar")}</span>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">{m.content.slice(0, 500)}{m.content.length > 500 ? "..." : ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
                  ) : allConversations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">لا توجد محادثات</p>
                  ) : (
                    allConversations.map((conv) => (
                      <div key={conv.id} onClick={() => viewConversation(conv.id)}
                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{conv.title}</p>
                          <p className="text-xs text-muted-foreground">
                            👤 {userMap[conv.user_id] || conv.user_id.slice(0, 8)} • {new Date(conv.updated_at).toLocaleDateString("ar")}
                          </p>
                        </div>
                        <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "rules" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">علّم الذكاء الاصطناعي ردود مخصصة: لو واحد قال كذا، قول كذا.</p>
              <div className="flex flex-col gap-2">
                <input value={newTrigger} onChange={(e) => setNewTrigger(e.target.value)} placeholder="لو قال المستخدم..."
                  className="px-3 py-2 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-primary" />
                <input value={newResponse} onChange={(e) => setNewResponse(e.target.value)} placeholder="قول له..."
                  className="px-3 py-2 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-primary" />
                <button onClick={addRule} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                  إضافة قاعدة
                </button>
              </div>
              {customRules.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-sm font-medium">القواعد الحالية:</h4>
                  {customRules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 rounded-xl bg-secondary/50 text-sm">
                      <div className="flex-1">
                        <p><span className="text-primary font-medium">إذا:</span> {rule.trigger}</p>
                        <p><span className="text-primary font-medium">الرد:</span> {rule.response}</p>
                      </div>
                      <button onClick={() => removeRule(idx)} className="text-destructive hover:opacity-80 p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPanel;
