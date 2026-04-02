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

function extractThinkContent(raw: string): {
  thinking: string;
  main: string;
  isThinking: boolean;
} {
  const openIdx = raw.indexOf("<think>");
  if (openIdx === -1) {
    return { thinking: "", main: raw, isThinking: false };
  }
  const closeIdx = raw.indexOf("</think>");
  if (closeIdx === -1) {
    // Still inside <think> block
    return {
      thinking: raw.slice(openIdx + 7),
      main: "",
      isThinking: true,
    };
  }
  return {
    thinking: raw.slice(openIdx + 7, closeIdx),
    main: raw.slice(closeIdx + 8).trim(),
    isThinking: false,
  };
}

export function useChat({
  chatId,
  model,
  perChatSystemPrompt,
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [thinkingContent, setThinkingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);
  const streamStartedRef = useRef(false);

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
      streamStartedRef.current = false;

      // Save user message
      const userMsg = await addMessage(chatId, "user", userInput.trim());
      setMessages((prev) => [...prev, userMsg]);

      // Create placeholder assistant message
      const assistantMsg = await addMessage(chatId, "assistant", "");
      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(true);
      setIsThinking(true);
      setStreamingContent("");
      setThinkingContent("");

      // Build messages array for API
      const history = await getMessages(chatId);
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
        setIsThinking(false);
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
            streamStartedRef.current = true;
            accumulatedContent += chunk;

            // Parse think blocks
            const {
              thinking,
              main,
              isThinking: stillThinking,
            } = extractThinkContent(accumulatedContent);
            setThinkingContent(thinking);
            setIsThinking(stillThinking);
            setStreamingContent(
              main || (stillThinking ? "" : accumulatedContent),
            );
          },
          async () => {
            if (abortRef.current) return;
            // Extract final content without think tags
            const { main } = extractThinkContent(accumulatedContent);
            const finalContent = main || accumulatedContent;
            await updateMessage(assistantMsg.id, finalContent);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: finalContent } : m,
              ),
            );
            setStreamingContent("");
            setThinkingContent("");
            setIsThinking(false);
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
            setThinkingContent("");
            setIsThinking(false);
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
    setIsThinking(false);
    setStreamingContent("");
    setThinkingContent("");
  }, []);

  return {
    messages,
    setMessages,
    isStreaming,
    isThinking,
    streamingContent,
    thinkingContent,
    error,
    setError,
    sendMessage,
    stopStreaming,
    loadMessages,
  };
}
