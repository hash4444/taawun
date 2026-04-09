import { useState } from 'react';
import { ChatSession } from '@/hooks/useChatSessions';
import { cn } from '@/lib/utils';
import {
  Plus,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  Pencil,
  Check,
  X,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onArchive: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
  isRTL?: boolean;
}

export function ChatSessionSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onRename,
  onPin,
  onArchive,
  onDelete,
  isRTL,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const activeSessions = sessions.filter(s => !s.is_archived);
  const archivedSessions = sessions.filter(s => s.is_archived);

  const startEdit = (s: ChatSession) => {
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const confirmEdit = (id: string) => {
    if (editTitle.trim()) onRename(id, editTitle.trim());
    setEditingId(null);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const SessionItem = ({ s }: { s: ChatSession }) => {
    const isActive = s.id === activeSessionId;
    const isEditing = editingId === s.id;

    return (
      <div
        className={cn(
          'group flex items-start gap-2 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-100',
          isActive
            ? 'bg-muted border border-border/80'
            : 'hover:bg-muted/50 border border-transparent',
        )}
        onClick={() => !isEditing && onSelect(s.id)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <MessageSquare size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="h-6 text-xs px-1.5 py-0"
                onKeyDown={e => { if (e.key === 'Enter') confirmEdit(s.id); if (e.key === 'Escape') setEditingId(null); }}
                autoFocus
                onClick={e => e.stopPropagation()}
              />
              <button onClick={(e) => { e.stopPropagation(); confirmEdit(s.id); }} className="p-0.5 hover:text-foreground text-muted-foreground"><Check size={12} /></button>
              <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-0.5 hover:text-foreground text-muted-foreground"><X size={12} /></button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1">
                {s.is_pinned && <Pin size={10} className="text-muted-foreground flex-shrink-0" />}
                <span className="text-xs font-medium text-foreground truncate block">{s.title}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{formatDate(s.updated_at)}</span>
            </>
          )}
        </div>
        {!isEditing && (
          <div className={cn('flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0')}>
            <button onClick={(e) => { e.stopPropagation(); startEdit(s); }} className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground"><Pencil size={11} /></button>
            <button onClick={(e) => { e.stopPropagation(); onPin(s.id, !s.is_pinned); }} className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground">
              {s.is_pinned ? <PinOff size={11} /> : <Pin size={11} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onArchive(s.id, !s.is_archived); }} className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground">
              {s.is_archived ? <ArchiveRestore size={11} /> : <Archive size={11} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} className="p-1 rounded hover:bg-background text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border/60">
        <Button
          variant="outline"
          size="sm"
          onClick={onNew}
          className="w-full justify-start gap-2 text-xs h-8"
        >
          <Plus size={14} />
          {isRTL ? 'محادثة جديدة' : 'New Chat'}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {activeSessions.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-6">
              {isRTL ? 'لا توجد محادثات بعد' : 'No chats yet'}
            </p>
          )}
          {activeSessions.map(s => <SessionItem key={s.id} s={s} />)}
        </div>

        {archivedSessions.length > 0 && (
          <div className="p-2 pt-0">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-1.5 w-full text-[11px] text-muted-foreground hover:text-foreground py-2 px-3 transition-colors"
            >
              <Archive size={11} />
              {isRTL ? `مؤرشف (${archivedSessions.length})` : `Archived (${archivedSessions.length})`}
              <ChevronDown size={11} className={cn('ml-auto transition-transform', showArchived && 'rotate-180')} />
            </button>
            {showArchived && (
              <div className="space-y-0.5">
                {archivedSessions.map(s => <SessionItem key={s.id} s={s} />)}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
