import { Settings, PanelRightOpen, PanelRightClose, LogOut, Shield, Phone } from "lucide-react";
import ConversationActions from "./ConversationActions";

type Message = { role: "user" | "assistant"; content: string };

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  onOpenSettings: () => void;
  onOpenAdmin?: () => void;
  onSignOut?: () => void;
  onStartCall?: () => void;
  userName?: string;
  messages?: Message[];
  conversationTitle?: string;
}

const ChatHeader = ({ onToggleSidebar, sidebarOpen, onOpenSettings, onOpenAdmin, onSignOut, onStartCall, userName, messages = [], conversationTitle }: ChatHeaderProps) => {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4" dir="rtl">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          {sidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
        </button>
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-primary">UXIN</span>{" "}
          <span className="text-foreground">AI</span>
        </h1>
      </div>
      <div className="flex items-center gap-1.5">
        {userName && <span className="text-xs text-muted-foreground hidden sm:block ml-2">{userName}</span>}
        
        {messages.length > 0 && <ConversationActions messages={messages} conversationTitle={conversationTitle} />}

        {onStartCall && (
          <button onClick={onStartCall}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-primary/70 hover:text-primary"
            title="مكالمة صوتية">
            <Phone className="w-4 h-4" />
          </button>
        )}

        {onOpenAdmin && (
          <button onClick={onOpenAdmin}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-amber-600/70 hover:text-amber-500"
            title="لوحة المدير">
            <Shield className="w-4 h-4" />
          </button>
        )}
        <button onClick={onOpenSettings}
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <Settings className="w-5 h-5" />
        </button>
        {onSignOut && (
          <button onClick={onSignOut}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive"
            title="تسجيل الخروج">
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
};

export default ChatHeader;
