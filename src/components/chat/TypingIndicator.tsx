const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-fade-in" dir="rtl">
      <div className="w-8 h-8 rounded-full bg-chat-ai flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-chat-ai-foreground">AI</span>
      </div>
      <div className="bg-chat-ai rounded-2xl rounded-tr-sm px-4 py-3">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-dot-1" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-dot-2" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-dot-3" />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
