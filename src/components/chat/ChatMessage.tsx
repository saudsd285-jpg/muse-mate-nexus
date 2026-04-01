import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";
import { User, Volume2, Square, Bot } from "lucide-react";
import { useState, useRef } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

const ChatMessage = ({ role, content, imageUrl }: ChatMessageProps) => {
  const isUser = role === "user";
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleSpeak = () => {
    if (isSpeaking) { speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const plain = content.replace(/[#*_`~\[\]()!>]/g, "").replace(/\n+/g, ". ");
    const u = new SpeechSynthesisUtterance(plain);
    u.lang = /[a-zA-Z]/.test(content.charAt(0)) ? "en-US" : "ar-SA";
    u.onend = () => setIsSpeaking(false);
    utteranceRef.current = u;
    setIsSpeaking(true);
    speechSynthesis.speak(u);
  };

  if (isUser) {
    // Check if content has an image markdown
    const imgMatch = content.match(/!\[.*?\]\((.*?)\)/);
    const textContent = content.replace(/!\[.*?\]\(.*?\)/g, "").trim();

    return (
      <div className="flex items-start gap-3 px-3 sm:px-4 py-3 animate-fade-in flex-row-reverse" dir="rtl">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
          {textContent && (
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-gradient-to-br from-primary to-[hsl(217,91%,50%)] text-primary-foreground text-sm leading-relaxed shadow-lg shadow-primary/10">
              {textContent}
            </div>
          )}
          {(imgMatch || imageUrl) && (
            <div className="rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg max-w-sm">
              <img src={imgMatch?.[1] || imageUrl} alt="صورة مرفقة" className="w-full rounded-2xl" loading="lazy" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-5 animate-fade-in" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-accent to-primary shadow-lg shadow-accent/20">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="prose prose-sm max-w-none dark:prose-invert
              [&_p]:my-3 [&_p]:leading-8 [&_p]:text-base
              [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1.5 [&_li]:leading-7
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-5 [&_h1]:leading-tight [&_h1]:text-primary
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:my-4 [&_h2]:leading-tight [&_h2]:text-primary
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-3 [&_h3]:text-accent
              [&_blockquote]:border-r-4 [&_blockquote]:rounded-xl [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:my-4
              [&_strong]:font-bold
              [&_hr]:my-6 [&_hr]:border-border
              text-foreground text-base
              [&_a]:text-accent [&_a]:underline [&_a]:decoration-accent/30 [&_a:hover]:decoration-accent
            ">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    if (match) return <CodeBlock language={match[1]} code={codeString} />;
                    return (
                      <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono text-accent" {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre({ children }) { return <>{children}</>; },
                  a({ href, children }) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer"
                        className="text-accent underline decoration-accent/30 hover:decoration-accent transition-colors inline-flex items-center gap-1">
                        {children} 🔗
                      </a>
                    );
                  },
                  img({ src, alt }) {
                    return (
                      <div className="my-4 rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg max-w-lg">
                        <img src={src} alt={alt || "صورة"} className="w-full rounded-xl" loading="lazy" />
                      </div>
                    );
                  },
                  blockquote({ children }) {
                    const text = String(children);
                    let borderColor = "border-primary/40";
                    let bgColor = "bg-secondary/30";
                    let textColorClass = "";
                    if (text.includes("آية") || text.includes("قرآن")) {
                      borderColor = "border-emerald-500/60";
                      bgColor = "bg-emerald-950/30";
                      textColorClass = "text-emerald-300";
                    } else if (text.includes("تنبيه") || text.includes("تحذير")) {
                      borderColor = "border-amber-400/60";
                      bgColor = "bg-amber-950/30";
                    } else if (text.includes("فكرة")) {
                      borderColor = "border-cyan-400/60";
                      bgColor = "bg-cyan-950/30";
                    } else if (text.includes("ملاحظة")) {
                      borderColor = "border-blue-400/60";
                      bgColor = "bg-blue-950/30";
                    } else if (text.includes("كود")) {
                      borderColor = "border-violet-400/60";
                      bgColor = "bg-violet-950/30";
                    } else if (text.includes("حديث")) {
                      borderColor = "border-sky-300/60";
                      bgColor = "bg-sky-950/30";
                      textColorClass = "text-sky-300";
                    }
                    return (
                      <blockquote className={`border-r-4 ${borderColor} ${bgColor} rounded-xl px-4 py-3 my-4 ${textColorClass}`}>
                        {children}
                      </blockquote>
                    );
                  },
                  strong({ children }) {
                    const text = String(children);
                    // Remove emoji prefixes for clean display
                    const cleanText = text.replace(/^[🔴🟡🟢🩷🟣🔮⚪🇸🇦🇺🇸🇯🇵🇪🇬🇦🇪🇰🇼🇶🇦🇧🇭🇴🇲🇮🇶🇯🇴🇱🇧🇸🇾🇾🇪🇱🇾🇹🇳🇩🇿🇲🇦🇸🇩📖📜]\s*/, "");
                    
                    // Country detection - green for Saudi, flag colors for others
                    if (text.includes("السعودية") || text.includes("🇸🇦")) return <strong className="text-green-400 font-bold">{cleanText}</strong>;
                    if (text.includes("🇺🇸") || text.includes("أمريكا")) return <strong className="text-blue-400 font-bold">{cleanText}</strong>;
                    if (text.includes("🇯🇵") || text.includes("اليابان")) return <strong className="text-red-400 font-bold">{cleanText}</strong>;
                    if (text.includes("🇪🇬") || text.includes("مصر")) return <strong className="text-yellow-400 font-bold">{cleanText}</strong>;
                    if (text.includes("🇦🇪") || text.includes("الإمارات")) return <strong className="text-red-400 font-bold">{cleanText}</strong>;

                    // Semantic colors without emojis
                    if (text.includes("🔴") || text.includes("مهم")) return <strong className="text-red-400 font-bold">{cleanText}</strong>;
                    if (text.includes("🟡") || text.includes("ملاحظة")) return <strong className="text-amber-400 font-bold">{cleanText}</strong>;
                    if (text.includes("🟢") || text.includes("مفيد")) return <strong className="text-emerald-400 font-bold">{cleanText}</strong>;
                    if (text.includes("🩷") || text.includes("رقم")) return <strong className="text-pink-400 font-bold">{cleanText}</strong>;
                    if (text.includes("🟣") || text.includes("مكان")) return <strong className="text-purple-400 font-bold">{cleanText}</strong>;
                    if (text.includes("🔮") || text.includes("وقت")) return <strong className="text-purple-600 font-bold">{cleanText}</strong>;
                    if (text.includes("المصدر")) return <strong className="text-muted-foreground text-xs font-normal">{cleanText}</strong>;
                    if (text.includes("آية") || text.includes("قرآن")) return <strong className="text-emerald-400 font-bold">{cleanText}</strong>;
                    if (text.includes("حديث")) return <strong className="text-sky-300 font-bold">{cleanText}</strong>;
                    return <strong className="text-primary font-bold">{cleanText}</strong>;
                  },
                  // Color list items based on content
                  li({ children }) {
                    return <li className="text-foreground/90">{children}</li>;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <button onClick={handleSpeak}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                title={isSpeaking ? "إيقاف القراءة" : "قراءة بالصوت"}>
                {isSpeaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
