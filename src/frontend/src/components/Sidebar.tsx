import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronDown,
  ChevronUp,
  Grid3x3,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentProfile } from "../lib/auth";
import { type Chat, deleteChat, getChats } from "../lib/db";
import type { OpenRouterModel } from "../lib/openrouter";
import ModelExplorer from "./ModelExplorer";

interface SidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  selectedModel: string;
  models: OpenRouterModel[];
  modelsLoading: boolean;
  modelsError: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onSelectModel: (id: string) => void;
  onRefetchModels: () => void;
  onViewModelDetail?: (m: OpenRouterModel) => void;
}

export default function Sidebar({
  chats,
  selectedChatId,
  selectedModel,
  models,
  modelsLoading,
  modelsError,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onSelectModel,
  onRefetchModels,
  onViewModelDetail,
}: SidebarProps) {
  const [modelsOpen, setModelsOpen] = useState(true);
  const profile = getCurrentProfile();

  function formatTime(ts: number) {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "oklch(var(--surface-1))",
        borderRight: "1px solid oklch(var(--border))",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-3 shrink-0"
        style={{ borderBottom: "1px solid oklch(var(--border))" }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              background: "oklch(var(--brand) / 0.2)",
              color: "oklch(var(--brand))",
            }}
          >
            R
          </div>
          <span
            className="font-display font-semibold text-sm truncate"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Rivelo
          </span>
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ml-auto shrink-0"
            style={{
              background: "oklch(var(--brand) / 0.15)",
              color: "oklch(var(--brand))",
            }}
            title={profile?.username}
          >
            {profile?.username?.[0]?.toUpperCase()}
          </div>
        </div>
        <Button
          data-ocid="sidebar.new_chat.button"
          size="sm"
          onClick={onNewChat}
          className="shrink-0 h-7 px-2.5 text-xs gap-1"
          style={{
            background: "oklch(var(--brand))",
            color: "oklch(var(--surface-0))",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </Button>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Chats List */}
        <div
          style={{
            flex: modelsOpen ? "0 0 auto" : "1 1 auto",
            maxHeight: modelsOpen ? "40%" : "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="px-3 py-2 shrink-0">
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Chats
            </span>
          </div>
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="px-2 pb-2">
              {chats.length === 0 && (
                <div
                  data-ocid="sidebar.chats.empty_state"
                  className="px-3 py-4 text-center text-xs"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  No chats yet. Start a new one!
                </div>
              )}
              {chats.map((chat, idx) => (
                <button
                  type="button"
                  key={chat.id}
                  data-ocid={`sidebar.chat.item.${idx + 1}`}
                  onClick={() => onSelectChat(chat.id)}
                  className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg group transition-all relative"
                  style={{
                    background:
                      selectedChatId === chat.id
                        ? "oklch(var(--brand) / 0.12)"
                        : "transparent",
                    border:
                      selectedChatId === chat.id
                        ? "1px solid oklch(var(--brand) / 0.25)"
                        : "1px solid transparent",
                  }}
                >
                  <MessageSquare
                    className="w-3.5 h-3.5 shrink-0"
                    style={{
                      color:
                        selectedChatId === chat.id
                          ? "oklch(var(--brand))"
                          : "oklch(var(--muted-foreground))",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium truncate"
                      style={{
                        color:
                          selectedChatId === chat.id
                            ? "oklch(var(--brand))"
                            : "oklch(var(--foreground))",
                      }}
                    >
                      {chat.title}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      {formatTime(chat.updatedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-ocid={`sidebar.chat.delete.button.${idx + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity shrink-0"
                  >
                    <Trash2
                      className="w-3 h-3"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    />
                  </button>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Models Explorer */}
        <div
          style={{
            flex: modelsOpen ? "1 1 0" : "0 0 auto",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            borderTop: "1px solid oklch(var(--border))",
          }}
        >
          <button
            type="button"
            data-ocid="sidebar.models.toggle"
            onClick={() => setModelsOpen(!modelsOpen)}
            className="flex items-center gap-2 px-3 py-2 w-full shrink-0"
          >
            <Grid3x3
              className="w-3.5 h-3.5"
              style={{ color: "oklch(var(--brand))" }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-wide flex-1 text-left"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Models
            </span>
            {modelsOpen ? (
              <ChevronUp
                className="w-3.5 h-3.5"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
            ) : (
              <ChevronDown
                className="w-3.5 h-3.5"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
            )}
          </button>

          {modelsOpen && (
            <div className="flex-1 overflow-hidden">
              <ModelExplorer
                models={models}
                loading={modelsLoading}
                error={modelsError}
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                onRefetch={onRefetchModels}
                onViewModelDetail={onViewModelDetail}
                compact={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
