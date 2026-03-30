import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock = ({ language, code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden my-2 border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary text-xs text-muted-foreground">
        <span>{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "تم النسخ" : "نسخ"}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm bg-muted/50" dir="ltr">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
