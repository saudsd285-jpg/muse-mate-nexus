import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";
import { User, Volume2, Square } from "lucide-react";
import { useState, useRef } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

const ChatMessage = ({ role, content }: ChatMessageProps) => {
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
    return (
      <div className="flex items-start gap-3 px-3 sm:px-4 py-3 animate-fade-in flex-row-reverse" dir="rtl">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-primary">
          <User className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 bg-primary text-primary-foreground text-sm leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-5 animate-fade-in" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="prose prose-sm max-w-none dark:prose-invert
          [&_p]:my-3 [&_p]:leading-8 [&_p]:text-base
          [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1.5 [&_li]:leading-7
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-5 [&_h1]:leading-tight
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:my-4 [&_h2]:leading-tight
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-3
          [&_blockquote]:border-r-4 [&_blockquote]:rounded-xl [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:my-4
          [&_strong]:font-bold
          [&_hr]:my-6 [&_hr]:border-border
          text-foreground text-base
          [&_a]:text-[hsl(217,91%,65%)] [&_a]:underline [&_a]:decoration-[hsl(217,91%,65%)]/30 [&_a:hover]:decoration-[hsl(217,91%,65%)]
        ">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");
                if (match) return <CodeBlock language={match[1]} code={codeString} />;
                return (
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono text-primary" {...props}>
                    {children}
                  </code>
                );
              },
              pre({ children }) { return <>{children}</>; },
              a({ href, children }) {
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="text-[hsl(217,91%,65%)] underline decoration-[hsl(217,91%,65%)]/30 hover:decoration-[hsl(217,91%,65%)] transition-colors inline-flex items-center gap-1">
                    {children} 🔗
                  </a>
                );
              },
              img({ src, alt }) {
                return (
                  <div className="my-4 rounded-xl overflow-hidden border border-border">
                    <img src={src} alt={alt || "صورة"} className="w-full max-w-lg rounded-xl" loading="lazy" />
                  </div>
                );
              },
              blockquote({ children }) {
                const text = String(children);
                let borderColor = "border-primary/40";
                let bgColor = "bg-secondary/30";
                if (text.includes("📖") || text.includes("آية")) {
                  borderColor = "border-emerald-400/60";
                  bgColor = "bg-emerald-950/30";
                } else if (text.includes("⚠️") || text.includes("تنبيه")) {
                  borderColor = "border-amber-400/60";
                  bgColor = "bg-amber-950/30";
                } else if (text.includes("💡") || text.includes("فكرة")) {
                  borderColor = "border-cyan-400/60";
                  bgColor = "bg-cyan-950/30";
                } else if (text.includes("📌") || text.includes("ملاحظة")) {
                  borderColor = "border-blue-400/60";
                  bgColor = "bg-blue-950/30";
                } else if (text.includes("💻") || text.includes("كود")) {
                  borderColor = "border-violet-400/60";
                  bgColor = "bg-violet-950/30";
                } else if (text.includes("حديث") || text.includes("📜")) {
                  borderColor = "border-rose-300/60";
                  bgColor = "bg-rose-950/30";
                }
                return (
                  <blockquote className={`border-r-4 ${borderColor} ${bgColor} rounded-xl px-4 py-3 my-4`}>
                    {children}
                  </blockquote>
                );
              },
              strong({ children }) {
                const text = String(children);
                // Color coding based on emoji prefixes
                if (text.includes("🔴") || text.includes("معلومة مهمة")) return <strong className="text-red-400 font-bold">{children}</strong>;
                if (text.includes("🟡") || text.includes("ملاحظة عادية")) return <strong className="text-amber-400 font-bold">{children}</strong>;
                if (text.includes("🟢") || text.includes("مفيد شوي")) return <strong className="text-emerald-400 font-bold">{children}</strong>;
                if (text.includes("🩷") || text.includes("رقم")) return <strong className="text-pink-400 font-bold">{children}</strong>;
                if (text.includes("🟣") || text.includes("مكان")) return <strong className="text-purple-400 font-bold">{children}</strong>;
                if (text.includes("🔮") || text.includes("وقت")) return <strong className="text-purple-600 font-bold">{children}</strong>;
                if (text.includes("المصدر")) return <strong className="text-[hsl(215,20%,55%)] text-xs font-normal">{children}</strong>;
                return <strong className="text-primary font-bold">{children}</strong>;
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
  );
};

export default ChatMessage;
