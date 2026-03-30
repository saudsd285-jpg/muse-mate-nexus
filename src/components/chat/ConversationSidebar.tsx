import { Plus, MessageSquare, Trash2, Pencil, Check, X } from "lucide-react";
import { useState } from "react";

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onClose?: () => void;
}

const ConversationSidebar = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onClose,
}: ConversationSidebarProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const confirmEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="h-full flex flex-col bg-sidebar" dir="rtl">
      <div className="p-4 border-b border-sidebar-border">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>محادثة جديدة</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-8">
            لا توجد محادثات بعد
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => { onSelect(conv.id); onClose?.(); }}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
              activeId === conv.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />
            {editingId === conv.id ? (
              <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                  className="flex-1 bg-secondary/50 rounded px-2 py-0.5 text-xs outline-none"
                  autoFocus
                />
                <button onClick={confirmEdit} className="p-0.5 hover:text-primary"><Check className="w-3 h-3" /></button>
                <button onClick={() => setEditingId(null)} className="p-0.5 hover:text-destructive"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <>
                <span className="flex-1 truncate">{conv.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); startEdit(conv); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-primary"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationSidebar;
