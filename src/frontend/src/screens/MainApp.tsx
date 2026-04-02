import {
  Layers,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ChatArea from "../components/ChatArea";
import ModelCard from "../components/ModelCard";
import ModelExplorer from "../components/ModelExplorer";
import RightPanel from "../components/RightPanel";
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
import SettingsPage from "./SettingsPage";

type MobileTab = "chat" | "explore" | "settings";
type RightTab = "models" | "params";

interface MainAppProps {
  onLogout: () => void;
}

// --- Animated SVG tab icons ---

function ChatTabIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 80,
          strokeDashoffset: active ? 0 : 80,
          transition: "stroke-dashoffset 0.45s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </svg>
  );
}

function ExploreTabIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M21 21l-4.35-4.35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          transform: active ? "rotate(0deg)" : "rotate(-20deg)",
          transition: "transform 0.3s ease",
          transformOrigin: "18px 18px",
        }}
      />
    </svg>
  );
}

function SettingsTabIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <line
        x1="4"
        y1="6"
        x2="20"
        y2="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="18"
        x2="20"
        y2="18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx={active ? 16 : 8}
        cy="6"
        r="2"
        fill="currentColor"
        style={{ transition: "cx 0.3s ease" }}
      />
      <circle
        cx={active ? 8 : 14}
        cy="12"
        r="2"
        fill="currentColor"
        style={{ transition: "cx 0.3s ease" }}
      />
      <circle
        cx={active ? 14 : 10}
        cy="18"
        r="2"
        fill="currentColor"
        style={{ transition: "cx 0.3s ease" }}
      />
    </svg>
  );
}

// --- Collapsed sidebar strips ---

function CollapsedLeftSidebar({
  chats,
  selectedChatId,
  onNewChat,
  onSelectChat,
  onExpand,
}: {
  chats: Chat[];
  selectedChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onExpand: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center py-3 gap-3 h-full"
      style={{
        background: "oklch(var(--surface-1))",
        borderRight: "1px solid oklch(var(--border))",
        width: "48px",
      }}
    >
      {/* Logo */}
      <button
        type="button"
        onClick={onExpand}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
        style={{
          background: "oklch(var(--brand) / 0.15)",
          color: "oklch(var(--brand))",
        }}
        title="Expand sidebar"
      >
        R
      </button>
      {/* New chat */}
      <button
        type="button"
        data-ocid="sidebar.new_chat.button"
        onClick={onNewChat}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{
          background: "oklch(var(--surface-2))",
          color: "oklch(var(--muted-foreground))",
          border: "1px solid oklch(var(--border))",
        }}
        title="New chat"
      >
        <Plus className="w-4 h-4" />
      </button>
      {/* Chat icons */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-hidden w-full items-center">
        {chats.slice(0, 8).map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => onSelectChat(chat.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background:
                selectedChatId === chat.id
                  ? "oklch(var(--brand) / 0.15)"
                  : "transparent",
              color:
                selectedChatId === chat.id
                  ? "oklch(var(--brand))"
                  : "oklch(var(--muted-foreground))",
            }}
            title={chat.title}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
      {/* Models icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ color: "oklch(var(--muted-foreground))" }}
        title="Models"
      >
        <Layers className="w-4 h-4" />
      </div>
    </div>
  );
}

function CollapsedRightSidebar({
  rightTab,
  setRightTab,
  onExpand,
}: {
  rightTab: RightTab;
  setRightTab: (t: RightTab) => void;
  onExpand: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center py-3 gap-3 h-full"
      style={{
        background: "oklch(var(--surface-1))",
        borderLeft: "1px solid oklch(var(--border))",
        width: "48px",
      }}
    >
      <button
        type="button"
        onClick={() => {
          setRightTab("models");
          onExpand();
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{
          background:
            rightTab === "models"
              ? "oklch(var(--brand) / 0.15)"
              : "oklch(var(--surface-2))",
          color:
            rightTab === "models"
              ? "oklch(var(--brand))"
              : "oklch(var(--muted-foreground))",
        }}
        title="Models"
      >
        <Layers className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          setRightTab("params");
          onExpand();
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{
          background:
            rightTab === "params"
              ? "oklch(var(--brand) / 0.15)"
              : "oklch(var(--surface-2))",
          color:
            rightTab === "params"
              ? "oklch(var(--brand))"
              : "oklch(var(--muted-foreground))",
        }}
        title="Parameters"
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function MainApp({ onLogout }: MainAppProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o-mini");
  const [perChatSystemPrompt, setPerChatSystemPrompt] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailModel, setDetailModel] = useState<OpenRouterModel | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("models");

  // Sidebar widths and collapse
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(300);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Resize drag state (use refs to avoid re-renders)
  const leftDragging = useRef(false);
  const rightDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (leftDragging.current) {
        const delta = e.clientX - dragStartX.current;
        const newW = Math.max(
          160,
          Math.min(400, dragStartWidth.current + delta),
        );
        setLeftWidth(newW);
      }
      if (rightDragging.current) {
        const delta = dragStartX.current - e.clientX;
        const newW = Math.max(
          200,
          Math.min(420, dragStartWidth.current + delta),
        );
        setRightWidth(newW);
      }
    };
    const onMouseUp = () => {
      leftDragging.current = false;
      rightDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startLeftResize = (e: React.MouseEvent) => {
    e.preventDefault();
    leftDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = leftWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const startRightResize = (e: React.MouseEvent) => {
    e.preventDefault();
    rightDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = rightWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

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
    isThinking,
    streamingContent,
    thinkingContent,
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

  const reloadChats = useCallback(async () => {
    const all = await getChats();
    setChats(all);
  }, []);

  useEffect(() => {
    reloadChats();
  }, [reloadChats]);

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
      toast.warning(`Switched from ${detail.fromKey} to ${detail.toKey}`, {
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
      if (!chatId) {
        const newChat = await createChat(selectedModel, text.slice(0, 50));
        chatId = newChat.id;
        setSelectedChatId(chatId);
        await reloadChats();
        await loadMessages(chatId);
      } else {
        const currentChat = chats.find((c) => c.id === chatId);
        if (currentChat?.title === "New Chat" && messages.length === 0) {
          await updateChat(chatId, { title: text.slice(0, 50) });
          await reloadChats();
        }
      }
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

  // Settings page
  if (showSettings) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <SettingsPage
          onBack={() => setShowSettings(false)}
          onLogout={() => {
            setShowSettings(false);
            onLogout();
          }}
          onProfileSwitch={() => window.location.reload()}
        />
      </div>
    );
  }

  const chatAreaProps = {
    chatId: selectedChatId,
    messages,
    streamingContent,
    isStreaming,
    isThinking,
    thinkingContent,
    error: chatError,
    perChatSystemPrompt,
    onPerChatSystemPromptChange: handlePerChatSystemPromptChange,
    onSendMessage: handleSendMessage,
    onStopStreaming: stopStreaming,
    onApplyPrompt: handleApplyPromptAsUniversal,
    selectedModel,
    onModelClick: () => {},
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "oklch(var(--surface-0))" }}
    >
      {/* Desktop layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {leftCollapsed ? (
          <CollapsedLeftSidebar
            chats={chats}
            selectedChatId={selectedChatId}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onExpand={() => setLeftCollapsed(false)}
          />
        ) : (
          <div
            className="shrink-0 overflow-hidden flex relative"
            style={{ width: `${leftWidth}px` }}
          >
            <div className="flex-1 overflow-hidden">
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
                  setRightTab("models");
                }}
              />
            </div>
            {/* Collapse + resize handle */}
            <div
              className="absolute right-0 top-0 bottom-0 flex flex-col items-center"
              style={{ width: "12px" }}
            >
              {/* Collapse button */}
              <button
                type="button"
                data-ocid="sidebar.left.collapse.button"
                onClick={() => setLeftCollapsed(true)}
                className="absolute top-1/2 -translate-y-1/2 w-5 h-8 flex items-center justify-center rounded-md transition-colors z-10"
                style={{
                  background: "oklch(var(--surface-2))",
                  border: "1px solid oklch(var(--border))",
                  color: "oklch(var(--muted-foreground))",
                  right: 0,
                }}
                title="Collapse sidebar"
              >
                <CollapseLeftIcon />
              </button>
              {/* Resize handle */}
              <div
                className="resize-handle h-full"
                style={{ width: "4px" }}
                onMouseDown={startLeftResize}
                title="Drag to resize"
              />
            </div>
          </div>
        )}

        {/* Center Chat */}
        <div className="flex-1 overflow-hidden min-w-0">
          <ChatArea
            {...chatAreaProps}
            onModelClick={() => setRightTab("models")}
          />
        </div>

        {/* Right panel */}
        {rightCollapsed ? (
          <CollapsedRightSidebar
            rightTab={rightTab}
            setRightTab={setRightTab}
            onExpand={() => setRightCollapsed(false)}
          />
        ) : (
          <div
            className="shrink-0 overflow-hidden flex relative"
            style={{
              width: `${rightWidth}px`,
              borderLeft: "1px solid oklch(var(--border))",
            }}
          >
            {/* Resize handle + collapse button */}
            <div
              className="absolute left-0 top-0 bottom-0 flex flex-col items-center"
              style={{ width: "12px" }}
            >
              <div
                className="resize-handle h-full"
                style={{ width: "4px" }}
                onMouseDown={startRightResize}
                title="Drag to resize"
              />
              <button
                type="button"
                data-ocid="sidebar.right.collapse.button"
                onClick={() => setRightCollapsed(true)}
                className="absolute top-1/2 -translate-y-1/2 w-5 h-8 flex items-center justify-center rounded-md transition-colors z-10"
                style={{
                  background: "oklch(var(--surface-2))",
                  border: "1px solid oklch(var(--border))",
                  color: "oklch(var(--muted-foreground))",
                  left: 0,
                }}
                title="Collapse panel"
              >
                <CollapseRightIcon />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col ml-3">
              {/* Tab header */}
              {!detailModel && (
                <div
                  className="flex shrink-0"
                  style={{
                    borderBottom: "1px solid oklch(var(--border))",
                    background: "oklch(var(--surface-1))",
                  }}
                >
                  <button
                    type="button"
                    data-ocid="right.models.tab"
                    onClick={() => setRightTab("models")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
                    style={{
                      color:
                        rightTab === "models"
                          ? "oklch(var(--brand))"
                          : "oklch(var(--muted-foreground))",
                      borderBottom:
                        rightTab === "models"
                          ? "2px solid oklch(var(--brand))"
                          : "2px solid transparent",
                    }}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Models
                  </button>
                  <button
                    type="button"
                    data-ocid="right.params.tab"
                    onClick={() => setRightTab("params")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
                    style={{
                      color:
                        rightTab === "params"
                          ? "oklch(var(--brand))"
                          : "oklch(var(--muted-foreground))",
                      borderBottom:
                        rightTab === "params"
                          ? "2px solid oklch(var(--brand))"
                          : "2px solid transparent",
                    }}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Params
                  </button>
                </div>
              )}

              {/* Tab content */}
              <div className="flex-1 overflow-hidden">
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
                  ) : rightTab === "models" ? (
                    <motion.div
                      key="models-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="h-full"
                    >
                      <ModelExplorer
                        models={models}
                        loading={modelsLoading}
                        error={modelsError}
                        selectedModel={selectedModel}
                        onSelectModel={handleSelectModel}
                        onRefetch={refetchModels}
                        onViewModelDetail={(m) => setDetailModel(m)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="params-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="h-full"
                    >
                      <RightPanel selectedModel={selectedModel} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
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
              background: "oklch(var(--brand) / 0.15)",
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
            onClick={() => setShowSettings(true)}
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
                style={{ background: "oklch(0 0 0 / 0.35)" }}
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
              {...chatAreaProps}
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
            {[
              { id: "chat" as MobileTab, label: "Chat", Icon: ChatTabIcon },
              {
                id: "explore" as MobileTab,
                label: "Explore",
                Icon: ExploreTabIcon,
              },
              {
                id: "settings" as MobileTab,
                label: "Params",
                Icon: SettingsTabIcon,
              },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                data-ocid={`mobile.${id}.tab`}
                onClick={() => setMobileTab(id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors"
                style={{
                  color:
                    mobileTab === id
                      ? "oklch(var(--brand))"
                      : "oklch(var(--muted-foreground))",
                }}
              >
                <Icon active={mobileTab === id} />
                <span className="text-xs font-medium">{label}</span>
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
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{
            color: "oklch(var(--muted-foreground))",
            background: "oklch(var(--surface-2))",
            border: "1px solid oklch(var(--border))",
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
    </div>
  );
}

function CollapseLeftIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <polyline points="7 2 3 5 7 8" />
    </svg>
  );
}

function CollapseRightIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <polyline points="3 2 7 5 3 8" />
    </svg>
  );
}
