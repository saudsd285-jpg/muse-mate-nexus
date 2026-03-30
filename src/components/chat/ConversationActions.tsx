import { Download, Share2, X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Message = { role: "user" | "assistant"; content: string };

interface ConversationActionsProps {
  messages: Message[];
  conversationTitle?: string;
}

const ConversationActions = ({ messages, conversationTitle }: ConversationActionsProps) => {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const exportAsPDF = () => {
    if (messages.length === 0) {
      toast({ title: "لا توجد رسائل", description: "أضف رسائل أولاً لتصديرها", variant: "destructive" });
      return;
    }

    // Build HTML content for PDF
    const title = conversationTitle || "محادثة UXIN AI";
    const now = new Date().toLocaleString("ar");

    const messagesHtml = messages.map(m => {
      const isUser = m.role === "user";
      const cleanContent = m.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
      return `
        <div style="margin-bottom:16px;padding:12px 16px;border-radius:12px;background:${isUser ? '#1a7a4c15' : '#f5f5f5'};border-right:4px solid ${isUser ? '#1a7a4c' : '#888'}">
          <div style="font-size:12px;color:#888;margin-bottom:6px;font-weight:600">${isUser ? '👤 أنت' : '🤖 UXIN AI'}</div>
          <div style="font-size:14px;line-height:1.8;color:#222">${cleanContent}</div>
        </div>`;
    }).join("");

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { font-family: 'Cairo', sans-serif; max-width: 700px; margin: 0 auto; padding: 40px 20px; background: #fff; }
          h1 { font-size: 22px; color: #1a7a4c; border-bottom: 2px solid #1a7a4c; padding-bottom: 12px; }
          .meta { font-size: 12px; color: #999; margin-bottom: 24px; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #bbb; border-top: 1px solid #eee; padding-top: 16px; }
        </style>
      </head>
      <body>
        <h1>💬 ${title}</h1>
        <div class="meta">تاريخ التصدير: ${now} • عدد الرسائل: ${messages.length}</div>
        ${messagesHtml}
        <div class="footer">تم التصدير من UXIN AI</div>
      </body>
      </html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }

    toast({ title: "تم فتح نافذة الطباعة", description: "اختر 'حفظ كـ PDF' للتصدير" });
  };

  const shareAsText = () => {
    if (messages.length === 0) {
      toast({ title: "لا توجد رسائل", variant: "destructive" });
      return;
    }

    const title = conversationTitle || "محادثة UXIN AI";
    const text = messages.map(m => `${m.role === "user" ? "👤 أنت" : "🤖 UXIN AI"}:\n${m.content}`).join("\n\n---\n\n");
    const full = `💬 ${title}\n\n${text}\n\n— تم المشاركة من UXIN AI`;

    if (navigator.share) {
      navigator.share({ title, text: full }).catch(() => {});
    } else {
      setShowShare(true);
    }
  };

  const copyToClipboard = () => {
    const title = conversationTitle || "محادثة UXIN AI";
    const text = messages.map(m => `${m.role === "user" ? "👤 أنت" : "🤖 UXIN AI"}:\n${m.content}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(`💬 ${title}\n\n${text}\n\n— UXIN AI`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "تم النسخ!" });
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={exportAsPDF}
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title="تصدير PDF"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={shareAsText}
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title="مشاركة"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Share dialog */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" dir="rtl">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm mx-4 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">مشاركة المحادثة</h3>
              <button onClick={() => setShowShare(false)} className="p-1 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-2">
              <button onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "تم النسخ!" : "نسخ المحادثة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConversationActions;
