import { Theme, useTheme } from "@/contexts/ThemeContext";
import { X } from "lucide-react";
import { AI_MODELS, getAiModel, setAiModel } from "@/lib/api";
import { useState } from "react";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const themes: { id: Theme; label: string; emoji: string }[] = [
  { id: "dark", label: "أسود", emoji: "⚫" },
  { id: "light", label: "أبيض", emoji: "⚪" },
  { id: "green", label: "أخضر", emoji: "🟢" },
  { id: "olive", label: "زيتي", emoji: "🟫" },
];

const dialects = [
  { id: "default", label: "فصحى / افتراضي" },
  { id: "qassimi", label: "قصيمي" },
  { id: "makkawi", label: "مكاوي" },
  { id: "jeddawi", label: "جداوي" },
  { id: "jizani", label: "جيزاني" },
];

const emotions = [
  { id: "neutral", label: "محايد", emoji: "😐" },
  { id: "friendly", label: "ودود", emoji: "😊" },
  { id: "professional", label: "احترافي", emoji: "💼" },
  { id: "funny", label: "مرح", emoji: "😄" },
  { id: "caring", label: "حنون", emoji: "🤗" },
];

const providerLabels: Record<string, string> = {
  lovable: "🤖 Lovable AI",
  openai: "🔑 OpenAI",
  google: "🌐 Google AI",
};

export function getDialect(): string {
  return localStorage.getItem("uxin-dialect") || "default";
}
export function setDialectStorage(d: string) {
  localStorage.setItem("uxin-dialect", d);
}
export function getEmotion(): string {
  return localStorage.getItem("uxin-emotion") || "neutral";
}
export function setEmotionStorage(e: string) {
  localStorage.setItem("uxin-emotion", e);
}

const SettingsDialog = ({ open, onClose }: SettingsDialogProps) => {
  const { theme, setTheme } = useTheme();
  const [selectedModel, setSelectedModel] = useState(getAiModel());
  const [dialect, setDialect] = useState(getDialect());
  const [emotion, setEmotion] = useState(getEmotion());

  if (!open) return null;

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setAiModel(modelId);
  };

  const grouped = AI_MODELS.reduce((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = [];
    acc[m.provider].push(m);
    return acc;
  }, {} as Record<string, typeof AI_MODELS>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md mx-4 shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold">الإعدادات</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Theme */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">🎨 المظهر</h3>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm ${
                    theme === t.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dialect */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">🗣️ اللهجة</h3>
            <div className="grid grid-cols-2 gap-2">
              {dialects.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { setDialect(d.id); setDialectStorage(d.id); }}
                  className={`px-3 py-2.5 rounded-xl border transition-all text-sm ${
                    dialect === d.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Emotion */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">💭 مشاعر الذكاء الاصطناعي</h3>
            <div className="grid grid-cols-2 gap-2">
              {emotions.map((e) => (
                <button
                  key={e.id}
                  onClick={() => { setEmotion(e.id); setEmotionStorage(e.id); }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-sm ${
                    emotion === e.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  <span>{e.emoji}</span>
                  <span>{e.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Model */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">🧠 نموذج الذكاء الاصطناعي</h3>
            <div className="space-y-3">
              {Object.entries(grouped).map(([provider, models]) => (
                <div key={provider}>
                  <p className="text-xs text-muted-foreground mb-1.5">{providerLabels[provider]}</p>
                  <div className="space-y-1">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleModelChange(m.id)}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm text-right ${
                          selectedModel === m.id
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:border-muted-foreground/30 text-muted-foreground"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedModel === m.id ? "bg-primary" : "bg-muted"}`} />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
