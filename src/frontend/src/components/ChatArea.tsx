import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Send,
  Sparkles,
  StopCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Message } from "../lib/db";
import MessageBubble from "./MessageBubble";
import PromptsModal from "./PromptsModal";

interface ChatAreaProps {
  chatId: string | null;
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  error: string | null;
  perChatSystemPrompt: string;
  onPerChatSystemPromptChange: (val: string) => void;
  onSendMessage: (text: string) => void;
  onStopStreaming: () => void;
  onApplyPrompt: (prompt: string) => void;
  selectedModel: string;
  onModelClick: () => void;
}

function extractQuestion(content: string): string | null {
  const match = content.match(/\[QUESTION\]:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

export default function ChatArea({
  chatId,
  messages,
  streamingContent,
  isStreaming,
  error,
  perChatSystemPrompt,
  onPerChatSystemPromptChange,
  onSendMessage,
  onStopStreaming,
  onApplyPrompt,
  selectedModel,
  onModelClick,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [qaAnswer, setQaAnswer] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesLen = messages.length;
  const streamLen = streamingContent.length;

  // Auto-scroll to bottom
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional scroll trigger
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesLen, streamLen]);

  // Extract question from last assistant message
  const lastAssistantMsg = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const lastMsgContent = isStreaming
    ? streamingContent
    : lastAssistantMsg?.content || "";
  const activeQuestion = extractQuestion(lastMsgContent);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleQaSend = () => {
    if (!qaAnswer.trim() || isStreaming) return;
    onSendMessage(qaAnswer.trim());
    setQaAnswer("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQaSend();
    }
  };

  const modelShortName = selectedModel.split("/").pop() || selectedModel;
  const hasCustomPrompt = perChatSystemPrompt.trim().length > 0;

  // Build display messages (merge streaming into last assistant)
  const displayMessages = messages.map((m, idx) => {
    if (isStreaming && idx === messages.length - 1 && m.role === "assistant") {
      return { ...m, content: streamingContent || "" };
    }
    return m;
  });

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "oklch(var(--surface-0))" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          borderBottom: "1px solid oklch(var(--border))",
          background: "oklch(var(--surface-1))",
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: "oklch(var(--success))" }}
          />
          <button
            type="button"
            data-ocid="chat.model.button"
            onClick={onModelClick}
            className="text-sm font-medium truncate hover:underline"
            style={{ color: "oklch(var(--foreground))" }}
            title={selectedModel}
          >
            {modelShortName}
          </button>
          {hasCustomPrompt && (
            <Badge
              variant="secondary"
              className="text-xs shrink-0"
              style={{
                background: "oklch(var(--brand) / 0.15)",
                color: "oklch(var(--brand))",
                border: "none",
              }}
            >
              Custom prompt
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          {!chatId && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "oklch(var(--surface-2))" }}
              >
                <Bot
                  className="w-8 h-8"
                  style={{ color: "oklch(var(--brand))" }}
                />
              </div>
              <h3 className="text-lg font-semibold font-display mb-1">
                Start a new conversation
              </h3>
              <p
                className="text-sm"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Select a model and type your message below
              </p>
            </div>
          )}

          {chatId && displayMessages.length === 0 && !isStreaming && (
            <div
              data-ocid="chat.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Bot
                className="w-10 h-10 mb-3"
                style={{ color: "oklch(var(--brand) / 0.5)" }}
              />
              <p
                className="text-sm"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                No messages yet. Say something!
              </p>
            </div>
          )}

          {displayMessages
            .filter((m) => m.role !== "system")
            .map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={
                  isStreaming &&
                  idx === displayMessages.length - 1 &&
                  msg.role === "assistant"
                }
                data-ocid={`chat.item.${idx + 1}`}
              />
            ))}

          {error && (
            <div
              data-ocid="chat.error_state"
              className="mx-auto max-w-md mt-2 px-4 py-2 rounded-xl text-sm"
              style={{
                background: "oklch(var(--destructive) / 0.15)",
                color: "oklch(var(--destructive))",
                border: "1px solid oklch(var(--destructive) / 0.3)",
              }}
            >
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Q&A Panel */}
      {activeQuestion && !isStreaming && (
        <div
          className="mx-4 mb-2 rounded-xl p-3"
          style={{
            background: "oklch(var(--brand) / 0.08)",
            border: "1px solid oklch(var(--brand) / 0.25)",
          }}
        >
          <div className="flex items-start gap-2 mb-2">
            <HelpCircle
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: "oklch(var(--brand))" }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "oklch(var(--brand))" }}
            >
              {activeQuestion}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              data-ocid="chat.qa.input"
              value={qaAnswer}
              onChange={(e) => setQaAnswer(e.target.value)}
              onKeyDown={handleQaKeyDown}
              placeholder="Your answer..."
              className="flex-1 px-3 py-1.5 text-sm rounded-lg outline-none"
              style={{
                background: "oklch(var(--surface-2))",
                border: "1px solid oklch(var(--brand) / 0.3)",
                color: "oklch(var(--foreground))",
              }}
            />
            <Button
              data-ocid="chat.qa.submit_button"
              size="sm"
              onClick={handleQaSend}
              disabled={!qaAnswer.trim()}
              style={{
                background: "oklch(var(--brand))",
                color: "oklch(var(--surface-0))",
              }}
            >
              Send
            </Button>
          </div>
        </div>
      )}

      {/* System prompt toggle */}
      <div className="mx-4 mb-1">
        <button
          type="button"
          data-ocid="chat.system_prompt.toggle"
          onClick={() => setSystemPromptOpen(!systemPromptOpen)}
          className="flex items-center gap-1.5 text-xs py-1 transition-colors"
          style={{
            color: hasCustomPrompt
              ? "oklch(var(--brand))"
              : "oklch(var(--muted-foreground))",
          }}
        >
          {systemPromptOpen ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3" />
          )}
          System Prompt
          {hasCustomPrompt && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "oklch(var(--brand))" }}
            />
          )}
        </button>

        {systemPromptOpen && (
          <div className="mb-2">
            <Textarea
              data-ocid="chat.system_prompt.textarea"
              value={perChatSystemPrompt}
              onChange={(e) => onPerChatSystemPromptChange(e.target.value)}
              placeholder="Set a system prompt for this chat (overrides universal prompt)..."
              className="min-h-[80px] max-h-[150px] text-xs resize-none"
              style={{
                background: "oklch(var(--surface-2))",
                border: "1px solid oklch(var(--border))",
                color: "oklch(var(--foreground))",
              }}
            />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-4 pb-safe pb-3 shrink-0">
        <div
          className="rounded-xl p-2"
          style={{
            background: "oklch(var(--surface-1))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <Textarea
            ref={textareaRef}
            data-ocid="chat.input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              chatId
                ? `Message ${modelShortName}...`
                : "Select a chat to start..."
            }
            disabled={!chatId || isStreaming}
            className="min-h-[44px] max-h-[200px] text-sm resize-none border-0 p-0 shadow-none focus-visible:ring-0 bg-transparent"
            style={{ color: "oklch(var(--foreground))" }}
            rows={1}
          />
          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="button"
              data-ocid="chat.prompts.open_modal_button"
              onClick={() => setPromptsOpen(true)}
              className="p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1"
              style={{ color: "oklch(var(--muted-foreground))" }}
              title="Preset prompts"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Prompts</span>
            </button>

            <div className="flex-1" />

            {isStreaming ? (
              <Button
                data-ocid="chat.stop.button"
                size="sm"
                onClick={onStopStreaming}
                className="h-8 px-3 text-xs gap-1"
                style={{
                  background: "oklch(var(--destructive))",
                  color: "white",
                }}
              >
                <StopCircle className="w-3.5 h-3.5" />
                Stop
              </Button>
            ) : (
              <Button
                data-ocid="chat.send.button"
                size="sm"
                onClick={handleSend}
                disabled={!input.trim() || !chatId}
                className="h-8 px-3 text-xs gap-1"
                style={{
                  background:
                    input.trim() && chatId
                      ? "oklch(var(--brand))"
                      : "oklch(var(--surface-3))",
                  color:
                    input.trim() && chatId
                      ? "oklch(var(--surface-0))"
                      : "oklch(var(--muted-foreground))",
                }}
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Prompts Modal */}
      <PromptsModal
        open={promptsOpen}
        onClose={() => setPromptsOpen(false)}
        onApplyUniversal={(p) => {
          onApplyPrompt(p);
          setPromptsOpen(false);
        }}
        onApplyToChat={(p) => {
          onPerChatSystemPromptChange(p);
          setPromptsOpen(false);
        }}
      />
    </div>
  );
}
