import { Menu, Settings, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ChatArea from "../components/ChatArea";
import ModelCard from "../components/ModelCard";
import ModelExplorer from "../components/ModelExplorer";
import RightPanel from "../components/RightPanel";
import SettingsSheet from "../components/SettingsSheet";
import Sidebar from "../components/Sidebar";
import { useChat } from "../hooks/useChat";
import { useModels } from "../hooks/useModels";
import { getCurrentProfile, updateProfile } from "../lib/auth";
import {
  type Chat,
  createChat,
  deleteChat,
  getChats,
  updateChat,
} from "../lib/db";
import type { OpenRouterModel } from "../lib/openrouter";

type MobileTab = "chat" | "explore" | "settings";

interface MainAppProps {
  onLogout: () => void;
}

export default function MainApp({ onLogout }: MainAppProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o-mini");
  const [perChatSystemPrompt, setPerChatSystemPrompt] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailModel, setDetailModel] = useState<OpenRouterModel | null>(null);

  const {
    models,
    loading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useModels();

  const {
    messages,
    setMessages,
    isStreaming,
    streamingContent,
    error: chatError,
    setError: setChatError,
    sendMessage,
    stopStreaming,
    loadMessages,
  } = useChat({
    chatId: selectedChatId,
    model: selectedModel,
    perChatSystemPrompt,
  });

  // Load chats on mount
  const reloadChats = useCallback(async () => {
    const all = await getChats();
    setChats(all);
  }, []);

  useEffect(() => {
    reloadChats();
  }, [reloadChats]);

  // Load profile defaults
  useEffect(() => {
    const profile = getCurrentProfile();
    if (profile?.settings?.defaultModel) {
      setSelectedModel(profile.settings.defaultModel);
    }
  }, []);

  // Listen for key failover events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      toast.warning(`🔑 Switched from ${detail.fromKey} to ${detail.toKey}`, {
        description: `Key ${detail.fromIndex} was exhausted. Now using Key ${detail.toIndex}.`,
        duration: 5000,
      });
    };
    window.addEventListener("key-failover", handler);
    return () => window.removeEventListener("key-failover", handler);
  }, []);

  const handleSelectChat = useCallback(
    async (chatId: string) => {
      setSelectedChatId(chatId);
      setSidebarOpen(false);
      setMobileTab("chat");
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        setSelectedModel(chat.model);
        setPerChatSystemPrompt(chat.systemPrompt || "");
      }
      await loadMessages(chatId);
    },
    [chats, loadMessages],
  );

  const handleNewChat = useCallback(async () => {
    const chat = await createChat(selectedModel, "New Chat");
    await reloadChats();
    setSelectedChatId(chat.id);
    setMessages([]);
    setPerChatSystemPrompt("");
    setChatError(null);
    setSidebarOpen(false);
    setMobileTab("chat");
  }, [selectedModel, reloadChats, setMessages, setChatError]);

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      await deleteChat(chatId);
      await reloadChats();
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages([]);
      }
    },
    [selectedChatId, reloadChats, setMessages],
  );

  const handleSelectModel = useCallback(
    async (modelId: string) => {
      setSelectedModel(modelId);
      if (selectedChatId) {
        await updateChat(selectedChatId, { model: modelId });
      }
      setMobileTab("chat");
    },
    [selectedChatId],
  );

  const handleSendMessage = useCallback(
    async (text: string) => {
      let chatId = selectedChatId;

      // Auto-create chat if none selected
      if (!chatId) {
        const newChat = await createChat(selectedModel, text.slice(0, 50));
        chatId = newChat.id;
        setSelectedChatId(chatId);
        await reloadChats();
        await loadMessages(chatId);
      } else {
        // Update chat title from first user message
        const currentChat = chats.find((c) => c.id === chatId);
        if (currentChat?.title === "New Chat" && messages.length === 0) {
          await updateChat(chatId, { title: text.slice(0, 50) });
          await reloadChats();
        }
      }

      // Save per-chat system prompt
      if (chatId && perChatSystemPrompt) {
        await updateChat(chatId, { systemPrompt: perChatSystemPrompt });
      }

      await sendMessage(text);
      await reloadChats();
    },
    [
      selectedChatId,
      selectedModel,
      messages,
      perChatSystemPrompt,
      reloadChats,
      loadMessages,
      sendMessage,
      chats,
    ],
  );

  const handlePerChatSystemPromptChange = useCallback(
    async (val: string) => {
      setPerChatSystemPrompt(val);
      if (selectedChatId) {
        await updateChat(selectedChatId, { systemPrompt: val });
      }
    },
    [selectedChatId],
  );

  const handleApplyPromptAsUniversal = useCallback((prompt: string) => {
    updateProfile({ universalSystemPrompt: prompt });
    toast.success("Universal system prompt updated");
  }, []);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "oklch(var(--surface-0))" }}
    >
      {/* Desktop layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 shrink-0 overflow-hidden">
          <Sidebar
            chats={chats}
            selectedChatId={selectedChatId}
            selectedModel={selectedModel}
            models={models}
            modelsLoading={modelsLoading}
            modelsError={modelsError}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            onSelectModel={handleSelectModel}
            onRefetchModels={refetchModels}
            onViewModelDetail={(m) => setDetailModel(m)}
          />
        </div>

        {/* Center Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatArea
            chatId={selectedChatId}
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
            error={chatError}
            perChatSystemPrompt={perChatSystemPrompt}
            onPerChatSystemPromptChange={handlePerChatSystemPromptChange}
            onSendMessage={handleSendMessage}
            onStopStreaming={stopStreaming}
            onApplyPrompt={handleApplyPromptAsUniversal}
            selectedModel={selectedModel}
            onModelClick={() => {}}
          />
        </div>

        {/* Right panel or model detail */}
        <div
          className="w-72 shrink-0 overflow-hidden"
          style={{ borderLeft: "1px solid oklch(var(--border))" }}
        >
          <AnimatePresence mode="wait">
            {detailModel ? (
              <motion.div
                key="model-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ModelCard
                  model={detailModel}
                  onClose={() => setDetailModel(null)}
                  onSelectModel={(id) => {
                    handleSelectModel(id);
                    setDetailModel(null);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="right-panel"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <RightPanel selectedModel={selectedModel} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex lg:hidden flex-col flex-1 overflow-hidden relative">
        {/* Mobile top bar */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 shrink-0"
          style={{
            background: "oklch(var(--surface-1))",
            borderBottom: "1px solid oklch(var(--border))",
          }}
        >
          <button
            type="button"
            data-ocid="mobile.menu.button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
            style={{
              background: "oklch(var(--brand) / 0.2)",
              color: "oklch(var(--brand))",
            }}
          >
            R
          </div>
          <span
            className="font-display font-semibold text-sm flex-1"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Rivelo
          </span>
          <button
            type="button"
            data-ocid="mobile.settings.button"
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-lg"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20"
                style={{ background: "oklch(0 0 0 / 0.5)" }}
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute left-0 top-0 bottom-0 w-72 z-30"
              >
                <Sidebar
                  chats={chats}
                  selectedChatId={selectedChatId}
                  selectedModel={selectedModel}
                  models={models}
                  modelsLoading={modelsLoading}
                  modelsError={modelsError}
                  onSelectChat={handleSelectChat}
                  onNewChat={handleNewChat}
                  onDeleteChat={handleDeleteChat}
                  onSelectModel={handleSelectModel}
                  onRefetchModels={refetchModels}
                  onViewModelDetail={(m) => {
                    setDetailModel(m);
                    setSidebarOpen(false);
                  }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile content area */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === "chat" && (
            <ChatArea
              chatId={selectedChatId}
              messages={messages}
              streamingContent={streamingContent}
              isStreaming={isStreaming}
              error={chatError}
              perChatSystemPrompt={perChatSystemPrompt}
              onPerChatSystemPromptChange={handlePerChatSystemPromptChange}
              onSendMessage={handleSendMessage}
              onStopStreaming={stopStreaming}
              onApplyPrompt={handleApplyPromptAsUniversal}
              selectedModel={selectedModel}
              onModelClick={() => setMobileTab("explore")}
            />
          )}

          {mobileTab === "explore" && (
            <div
              className="h-full flex flex-col"
              style={{ background: "oklch(var(--surface-0))" }}
            >
              {detailModel ? (
                <ModelCard
                  model={detailModel}
                  onClose={() => setDetailModel(null)}
                  onSelectModel={(id) => {
                    handleSelectModel(id);
                    setDetailModel(null);
                    setMobileTab("chat");
                  }}
                />
              ) : (
                <ModelExplorer
                  models={models}
                  loading={modelsLoading}
                  error={modelsError}
                  selectedModel={selectedModel}
                  onSelectModel={(id) => {
                    handleSelectModel(id);
                    setMobileTab("chat");
                  }}
                  onRefetch={refetchModels}
                  onViewModelDetail={(m) => setDetailModel(m)}
                />
              )}
            </div>
          )}

          {mobileTab === "settings" && (
            <div
              className="h-full overflow-auto"
              style={{ background: "oklch(var(--surface-0))" }}
            >
              <RightPanel selectedModel={selectedModel} />
            </div>
          )}
        </div>

        {/* Mobile bottom tab bar */}
        <div
          className="shrink-0 pb-safe"
          style={{
            background: "oklch(var(--surface-1))",
            borderTop: "1px solid oklch(var(--border))",
          }}
        >
          <div className="flex">
            {(
              [
                { id: "chat", label: "Chat", icon: "💬" },
                { id: "explore", label: "Explore", icon: "🔭" },
                { id: "settings", label: "Params", icon: "⚙️" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-ocid={`mobile.${tab.id}.tab`}
                onClick={() => setMobileTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors"
                style={{
                  color:
                    mobileTab === tab.id
                      ? "oklch(var(--brand))"
                      : "oklch(var(--muted-foreground))",
                }}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop footer */}
      <div
        className="hidden lg:flex items-center justify-end px-4 py-1.5 shrink-0"
        style={{
          background: "oklch(var(--surface-1))",
          borderTop: "1px solid oklch(var(--border))",
        }}
      >
        <button
          type="button"
          data-ocid="desktop.settings.button"
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{
            color: "oklch(var(--muted-foreground))",
            background: "oklch(var(--surface-2))",
          }}
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>
        <p
          className="text-xs ml-4"
          style={{ color: "oklch(var(--muted-foreground) / 0.5)" }}
        >
          &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "oklch(var(--brand))" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>

      {/* Settings sheet */}
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={onLogout}
        onProfileSwitch={() => window.location.reload()}
      />
    </div>
  );
}
