import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Search, X, FileText, Image as ImageIcon, Mic, MicOff, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onFileUpload: (file: File) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  onStop?: () => void;
}

const ChatInput = ({ onSend, onFileUpload, onSearch, isLoading, onStop }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  const handleSend = () => {
    if (isLoading && onStop) { onStop(); return; }
    if (selectedFile) { onFileUpload(selectedFile); setSelectedFile(null); return; }
    if (!input.trim()) return;
    const isSearch = /^(?:ابحث|بحث|search|find|ابحث عن)\s/i.test(input.trim());
    if (isSearch) { onSearch(input.trim()); } else { onSend(input.trim()); }
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { alert("حجم الملف يجب أن يكون أقل من 20MB"); return; }
      setSelectedFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("المتصفح لا يدعم التعرف على الصوت"); return; }
    const recognition = new SR();
    recognition.lang = "ar-SA";
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput((prev) => prev + " " + text);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="p-2 sm:p-4 border-t border-border safe-bottom" dir="rtl">
      {selectedFile && (
        <div className="max-w-3xl mx-auto mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm">
            {getFileIcon(selectedFile)}
            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)} className="p-0.5 hover:text-destructive transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 max-w-3xl mx-auto bg-secondary rounded-2xl px-3 py-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          title="رفع ملف"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept="image/*,.pdf,.txt,.md,.csv,.json,.html,.css,.js,.ts,.py,.java,.cpp,.xlsx,.xls"
          className="hidden"
        />

        <button
          onClick={() => { if (input.trim()) onSearch(input.trim()); }}
          disabled={!input.trim() || isLoading}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          title="بحث في الإنترنت"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={toggleVoice}
          className={`p-2 rounded-xl transition-colors ${isListening ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
          title={isListening ? "إيقاف التسجيل" : "تحدث"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? "اضغط إرسال لتحليل الملف..." : "اكتب رسالتك هنا..."}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground py-2 text-sm scrollbar-thin"
        />
        <button
          onClick={handleSend}
          disabled={!isLoading && !input.trim() && !selectedFile}
          className={`p-2 rounded-xl transition-opacity flex-shrink-0 ${
            isLoading
              ? "bg-destructive text-destructive-foreground hover:opacity-90"
              : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          }`}
        >
          {isLoading ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4 rotate-180" />}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
