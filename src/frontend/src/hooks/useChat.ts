import { useCallback, useRef, useState } from "react";
import {
  getActiveApiKey,
  isFailoverError,
  rotateToNextKey,
} from "../lib/apiKeys";
import { getCurrentProfile } from "../lib/auth";
import {
  type Message,
  addMessage,
  getMessages,
  updateMessage,
} from "../lib/db";
import type { ChatMessage } from "../lib/openrouter";
import { streamChat } from "../lib/openrouter";
import { IDENTITY_PROMPT } from "../lib/systemPrompts";

interface UseChatOptions {
  chatId: string | null;
  model: string;
  perChatSystemPrompt?: string;
}

export function useChat({
  chatId,
  model,
  perChatSystemPrompt,
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const loadMessages = useCallback(async (cId: string) => {
    try {
      const msgs = await getMessages(cId);
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, []);

  const buildSystemMessages = useCallback((): ChatMessage[] => {
    const profile = getCurrentProfile();
    const universalPrompt = profile?.universalSystemPrompt || "";
    const msgs: ChatMessage[] = [{ role: "system", content: IDENTITY_PROMPT }];
    if (perChatSystemPrompt?.trim()) {
      msgs.push({ role: "system", content: perChatSystemPrompt });
    } else if (universalPrompt.trim()) {
      msgs.push({ role: "system", content: universalPrompt });
    }
    return msgs;
  }, [perChatSystemPrompt]);

  const sendMessage = useCallback(
    async (userInput: string): Promise<void> => {
      if (!chatId || !userInput.trim() || isStreaming) return;

      setError(null);
      abortRef.current = false;

      // Save user message
      const userMsg = await addMessage(chatId, "user", userInput.trim());
      setMessages((prev) => [...prev, userMsg]);

      // Create placeholder assistant message
      const assistantMsg = await addMessage(chatId, "assistant", "");
      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(true);
      setStreamingContent("");

      // Build messages array for API
      const history = await getMessages(chatId);
      // Exclude the empty assistant placeholder and the new user message from history
      const historyMsgs: ChatMessage[] = history
        .filter(
          (m) =>
            m.id !== assistantMsg.id &&
            m.role !== "system" &&
            m.id !== userMsg.id,
        )
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
        .filter((m) => m.content.trim() !== "");

      const apiMessages: ChatMessage[] = [
        ...buildSystemMessages(),
        ...historyMsgs,
        { role: "user", content: userInput.trim() },
      ];

      const profile = getCurrentProfile();
      const params = profile?.settings || {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        frequencyPenalty: 0,
      };

      let accumulatedContent = "";
      let apiKey = getActiveApiKey();

      if (!apiKey) {
        setError("No API key configured. Please add an API key in Settings.");
        setIsStreaming(false);
        // Remove empty assistant placeholder
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
        return;
      }

      const attemptStream = (key: string) => {
        streamChat(
          apiMessages,
          model,
          key,
          {
            temperature: params.temperature,
            max_tokens: params.maxTokens,
            top_p: params.topP,
            frequency_penalty: params.frequencyPenalty,
          },
          (chunk) => {
            if (abortRef.current) return;
            accumulatedContent += chunk;
            setStreamingContent(accumulatedContent);
          },
          async () => {
            if (abortRef.current) return;
            // Save final content
            await updateMessage(assistantMsg.id, accumulatedContent);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: accumulatedContent }
                  : m,
              ),
            );
            setStreamingContent("");
            setIsStreaming(false);
          },
          async (status, message) => {
            if (abortRef.current) return;
            if (isFailoverError(status, message)) {
              const nextKey = rotateToNextKey();
              if (nextKey) {
                attemptStream(nextKey);
                return;
              }
            }
            const errMsg = `Error: ${message}`;
            await updateMessage(assistantMsg.id, errMsg);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: errMsg } : m,
              ),
            );
            setStreamingContent("");
            setIsStreaming(false);
            setError(message);
          },
        );
      };

      attemptStream(apiKey);
    },
    [chatId, model, isStreaming, buildSystemMessages],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
    setStreamingContent("");
  }, []);

  return {
    messages,
    setMessages,
    isStreaming,
    streamingContent,
    error,
    setError,
    sendMessage,
    stopStreaming,
    loadMessages,
  };
}
