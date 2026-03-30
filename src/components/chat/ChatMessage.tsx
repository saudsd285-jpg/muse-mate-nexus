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
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
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
      <div className="flex items-start gap-3 px-4 py-3 animate-fade-in flex-row-reverse" dir="rtl">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-primary">
          <User className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 bg-primary text-primary-foreground text-sm">
          {content}
        </div>
      </div>
    );
  }

  // Assistant - ChatGPT style: no bubble, wide content
  return (
    <div className="px-4 py-5 animate-fade-in" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-2 [&_p]:leading-7 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:my-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:my-2 [&_blockquote]:border-r-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-secondary/30 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:rounded-lg [&_blockquote]:my-3 [&_strong]:text-primary [&_hr]:my-4 [&_hr]:border-border text-foreground text-[15px]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");
                if (match) {
                  return <CodeBlock language={match[1]} code={codeString} />;
                }
                return (
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono text-primary" {...props}>
                    {children}
                  </code>
                );
              },
              pre({ children }) {
                return <>{children}</>;
              },
              img({ src, alt }) {
                return (
                  <div className="my-4 rounded-xl overflow-hidden border border-border">
                    <img src={src} alt={alt || "صورة"} className="w-full max-w-lg rounded-xl" loading="lazy" />
                  </div>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {/* Actions row */}
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={handleSpeak}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title={isSpeaking ? "إيقاف القراءة" : "قراءة بالصوت"}
          >
            {isSpeaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
