import { useState } from "react";
import { useTimetableStore } from "@/stores/timetable-store";
import { cn } from "@/lib/utils";
import { Plus, X, Check, Pencil } from "lucide-react";

export function DraftTabs() {
  const drafts = useTimetableStore((s) => s.drafts);
  const currentSemester = useTimetableStore((s) => s.currentSemester);
  const activeDraftId = useTimetableStore((s) => s.activeDraftId);
  const createDraft = useTimetableStore((s) => s.createDraft);
  const setActiveDraft = useTimetableStore((s) => s.setActiveDraft);
  const deleteDraft = useTimetableStore((s) => s.deleteDraft);
  const renameDraft = useTimetableStore((s) => s.renameDraft);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const semesterDrafts = drafts.filter((d) => d.semester === currentSemester);

  const handleStartRename = (draftId: string, currentName: string) => {
    setEditingId(draftId);
    setEditName(currentName);
  };

  const handleFinishRename = () => {
    if (editingId && editName.trim()) {
      renameDraft(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto" dir="rtl">
      {semesterDrafts.map((draft) => (
        <div
          key={draft.id}
          className={cn(
            "group relative flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all shrink-0",
            "border",
            draft.id === activeDraftId
              ? "bg-primary/10 border-primary text-primary"
              : "bg-secondary border-transparent text-secondary-foreground hover:bg-accent",
          )}
        >
          {editingId === draft.id ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFinishRename();
                  if (e.key === "Escape") setEditingId(null);
                }}
                onBlur={handleFinishRename}
                className="bg-transparent border-none outline-none w-20 text-sm"
                autoFocus
              />
              <button onClick={handleFinishRename}>
                <Check className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setActiveDraft(draft.id)}
                className="flex items-center gap-1"
              >
                {draft.isPublished && (
                  <Check className="h-3 w-3 text-success" />
                )}
                <span>{draft.name}</span>
              </button>
              <button
                onClick={() => handleStartRename(draft.id, draft.name)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
              </button>
              {semesterDrafts.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDraft(draft.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </>
          )}
        </div>
      ))}
      <button
        onClick={() => createDraft()}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm",
          "text-muted-foreground hover:text-foreground hover:bg-accent transition-all shrink-0",
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
