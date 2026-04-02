import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PRESET_PROMPTS } from "../lib/systemPrompts";

interface PromptsModalProps {
  open: boolean;
  onClose: () => void;
  onApplyUniversal: (prompt: string) => void;
  onApplyToChat: (prompt: string) => void;
}

export default function PromptsModal({
  open,
  onClose,
  onApplyUniversal,
  onApplyToChat,
}: PromptsModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-ocid="prompts.dialog"
        className="max-w-lg w-full p-0 overflow-hidden"
        style={{
          background: "oklch(var(--surface-1))",
          border: "1px solid oklch(var(--border))",
          maxHeight: "85vh",
        }}
      >
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="font-display font-semibold">
            Preset Prompts
          </DialogTitle>
          <p
            className="text-xs mt-1"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Choose an expert persona to apply as system prompt
          </p>
        </DialogHeader>
        <ScrollArea className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
          <div className="p-4 grid gap-3">
            {PRESET_PROMPTS.map((preset, idx) => (
              <div
                key={preset.id}
                data-ocid={`prompts.item.${idx + 1}`}
                className="rounded-xl p-3"
                style={{
                  background: "oklch(var(--surface-2))",
                  border: "1px solid oklch(var(--border))",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{preset.icon}</span>
                  <div>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      {preset.name}
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      {preset.description}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    data-ocid={`prompts.apply_universal.button.${idx + 1}`}
                    onClick={() => onApplyUniversal(preset.prompt)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: "oklch(var(--surface-3))",
                      color: "oklch(var(--foreground))",
                    }}
                  >
                    Apply Universal
                  </button>
                  <button
                    type="button"
                    data-ocid={`prompts.apply_chat.button.${idx + 1}`}
                    onClick={() => onApplyToChat(preset.prompt)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: "oklch(var(--brand))",
                      color: "oklch(var(--surface-0))",
                    }}
                  >
                    Apply to Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
