import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Key,
  Palette,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import PromptsModal from "../components/PromptsModal";
import { saveApiKeys } from "../lib/apiKeys";
import {
  getAllProfiles,
  getCurrentProfile,
  logout,
  switchProfile,
  updateProfile,
} from "../lib/auth";
import type { ApiKey } from "../lib/auth";
import { PRESET_PROMPTS } from "../lib/systemPrompts";

type SettingsSection =
  | "appearance"
  | "chat"
  | "system-prompts"
  | "api-keys"
  | "profile"
  | "about";

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
  onProfileSwitch: () => void;
}

const ACCENT_PRESETS = [
  { name: "Royal Blue", value: "0.52 0.22 260" },
  { name: "Teal", value: "0.72 0.16 192" },
  { name: "Purple", value: "0.60 0.20 300" },
  { name: "Pink", value: "0.68 0.18 330" },
  { name: "Orange", value: "0.72 0.18 55" },
];

const FONT_SIZE_MAP: Record<string, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

export default function SettingsPage({
  onBack,
  onLogout,
  onProfileSwitch,
}: SettingsPageProps) {
  const [section, setSection] = useState<SettingsSection>("appearance");
  const profile = getCurrentProfile();
  const allProfiles = getAllProfiles();

  // Appearance state
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">(
    () =>
      (localStorage.getItem("rivelo_font_size") as
        | "small"
        | "medium"
        | "large") ?? "medium",
  );
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem("rivelo_accent") ?? "0.52 0.22 260",
  );

  // Chat settings
  const [temperature, setTemperature] = useState(
    profile?.settings?.temperature ?? 0.7,
  );
  const [maxTokens, setMaxTokens] = useState(
    profile?.settings?.maxTokens ?? 4096,
  );
  const [streamEnabled, setStreamEnabled] = useState(
    () => localStorage.getItem("rivelo_stream") !== "false",
  );

  // System prompts
  const [universalPrompt, setUniversalPrompt] = useState(
    profile?.universalSystemPrompt ?? "",
  );
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [promptsOpen, setPromptsOpen] = useState(false);

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(profile?.apiKeys ?? []);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const handleFontSize = (size: "small" | "medium" | "large") => {
    setFontSize(size);
    localStorage.setItem("rivelo_font_size", size);
    document.documentElement.style.setProperty(
      "--font-size-base",
      FONT_SIZE_MAP[size],
    );
  };

  const handleAccentColor = (val: string) => {
    setAccentColor(val);
    localStorage.setItem("rivelo_accent", val);
    document.documentElement.style.setProperty("--brand", val);
    document.documentElement.style.setProperty("--primary", val);
  };

  const handleSaveChat = useCallback(() => {
    updateProfile({
      settings: {
        temperature,
        maxTokens,
        topP: profile?.settings?.topP ?? 1,
        frequencyPenalty: profile?.settings?.frequencyPenalty ?? 0,
        defaultModel: profile?.settings?.defaultModel ?? "openai/gpt-4o-mini",
      },
    });
    localStorage.setItem("rivelo_stream", streamEnabled ? "true" : "false");
    toast.success("Chat settings saved");
  }, [temperature, maxTokens, streamEnabled, profile]);

  const handleSaveUniversalPrompt = useCallback(() => {
    updateProfile({ universalSystemPrompt: universalPrompt });
    toast.success("System prompt saved");
  }, [universalPrompt]);

  const handleAddKey = () => {
    const newKeys: ApiKey[] = [
      ...apiKeys,
      {
        id: `key_${Date.now()}`,
        label: `Key ${apiKeys.length + 1}`,
        key: "",
        isActive: apiKeys.length === 0,
      },
    ];
    setApiKeys(newKeys);
    saveApiKeys(newKeys);
  };

  const handleUpdateKey = (id: string, field: "label" | "key", val: string) => {
    const updated = apiKeys.map((k) =>
      k.id === id ? { ...k, [field]: val } : k,
    );
    setApiKeys(updated);
    saveApiKeys(updated);
  };

  const handleDeleteKey = (id: string) => {
    const updated = apiKeys.filter((k) => k.id !== id);
    setApiKeys(updated);
    saveApiKeys(updated);
  };

  const handleSwitchProfile = (id: string) => {
    switchProfile(id);
    onProfileSwitch();
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const navItems: Array<{
    id: SettingsSection;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "appearance",
      label: "Appearance",
      icon: <Palette className="w-4 h-4" />,
    },
    { id: "chat", label: "Chat", icon: <ChatIcon /> },
    { id: "system-prompts", label: "System Prompts", icon: <PromptIcon /> },
    { id: "api-keys", label: "API Keys", icon: <Key className="w-4 h-4" /> },
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "about", label: "About", icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "oklch(var(--surface-0))" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          background: "oklch(var(--surface-1))",
          borderBottom: "1px solid oklch(var(--border))",
        }}
      >
        <button
          type="button"
          data-ocid="settings.back.button"
          onClick={onBack}
          className="p-2 rounded-lg transition-colors"
          style={{
            color: "oklch(var(--muted-foreground))",
            background: "oklch(var(--surface-2))",
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1
          className="font-display font-semibold text-base"
          style={{ color: "oklch(var(--foreground))" }}
        >
          Settings
        </h1>
      </div>

      {/* Body — two-column on desktop */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left nav */}
        <div
          className="w-52 shrink-0 flex flex-col py-3 overflow-y-auto"
          style={{
            background: "oklch(var(--surface-1))",
            borderRight: "1px solid oklch(var(--border))",
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              data-ocid={`settings.${item.id}.tab`}
              onClick={() => setSection(item.id)}
              className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background:
                  section === item.id
                    ? "oklch(var(--brand) / 0.1)"
                    : "transparent",
                color:
                  section === item.id
                    ? "oklch(var(--brand))"
                    : "oklch(var(--foreground))",
                fontWeight: section === item.id ? 600 : 400,
              }}
            >
              {item.icon}
              {item.label}
              {section === item.id && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto" />
              )}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-2xl space-y-6">
              {/* ── Appearance ── */}
              {section === "appearance" && (
                <>
                  <SectionHeader title="Appearance" />

                  <SettingRow
                    label="Font Size"
                    description="Adjust the base font size for the interface"
                  >
                    <div className="flex gap-2">
                      {(["small", "medium", "large"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          data-ocid={`settings.font_size.${s}.button`}
                          onClick={() => handleFontSize(s)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors"
                          style={{
                            background:
                              fontSize === s
                                ? "oklch(var(--brand))"
                                : "oklch(var(--surface-2))",
                            color:
                              fontSize === s
                                ? "white"
                                : "oklch(var(--foreground))",
                            border: "1px solid oklch(var(--border))",
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </SettingRow>

                  <SettingRow
                    label="Accent Color"
                    description="Brand color used for buttons and highlights"
                  >
                    <div className="flex gap-2">
                      {ACCENT_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          data-ocid={`settings.accent.${preset.name.toLowerCase().replace(" ", "_")}.button`}
                          onClick={() => handleAccentColor(preset.value)}
                          title={preset.name}
                          className="w-8 h-8 rounded-full border-2 transition-all"
                          style={{
                            background: `oklch(${preset.value})`,
                            borderColor:
                              accentColor === preset.value
                                ? "oklch(var(--foreground))"
                                : "transparent",
                            boxShadow:
                              accentColor === preset.value
                                ? "0 0 0 2px oklch(var(--surface-0))"
                                : "none",
                          }}
                        />
                      ))}
                    </div>
                  </SettingRow>
                </>
              )}

              {/* ── Chat ── */}
              {section === "chat" && (
                <>
                  <SectionHeader title="Chat" />

                  <SettingRow
                    label="Default Temperature"
                    description={`Controls response randomness. Current: ${temperature.toFixed(1)}`}
                  >
                    <div className="w-full max-w-xs">
                      <Slider
                        data-ocid="settings.temperature.slider"
                        min={0}
                        max={2}
                        step={0.1}
                        value={[temperature]}
                        onValueChange={([v]) => setTemperature(v)}
                        className="w-full"
                      />
                      <div
                        className="flex justify-between text-xs mt-1"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        <span>0</span>
                        <span>2</span>
                      </div>
                    </div>
                  </SettingRow>

                  <SettingRow
                    label="Default Max Tokens"
                    description={`Maximum response length. Current: ${maxTokens}`}
                  >
                    <div className="w-full max-w-xs">
                      <Slider
                        data-ocid="settings.max_tokens.slider"
                        min={256}
                        max={32768}
                        step={256}
                        value={[maxTokens]}
                        onValueChange={([v]) => setMaxTokens(v)}
                        className="w-full"
                      />
                      <div
                        className="flex justify-between text-xs mt-1"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        <span>256</span>
                        <span>32k</span>
                      </div>
                    </div>
                  </SettingRow>

                  <SettingRow
                    label="Stream Responses"
                    description="Show AI responses as they are generated"
                  >
                    <Switch
                      data-ocid="settings.stream.switch"
                      checked={streamEnabled}
                      onCheckedChange={setStreamEnabled}
                    />
                  </SettingRow>

                  <button
                    type="button"
                    data-ocid="settings.chat.save_button"
                    onClick={handleSaveChat}
                    className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                    style={{
                      background: "oklch(var(--brand))",
                      color: "white",
                    }}
                  >
                    Save Chat Settings
                  </button>
                </>
              )}

              {/* ── System Prompts ── */}
              {section === "system-prompts" && (
                <>
                  <SectionHeader title="System Prompts" />

                  <div className="space-y-2">
                    <label
                      htmlFor="universal-prompt-textarea"
                      className="text-sm font-semibold"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      Universal System Prompt
                    </label>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Applies to all chats unless a per-chat prompt is set
                    </p>
                    <Textarea
                      id="universal-prompt-textarea"
                      data-ocid="settings.universal_prompt.textarea"
                      value={universalPrompt}
                      onChange={(e) => setUniversalPrompt(e.target.value)}
                      placeholder="You are a helpful assistant..."
                      className="min-h-[120px] text-sm resize-none"
                      style={{
                        background: "oklch(var(--surface-2))",
                        border: "1px solid oklch(var(--border))",
                      }}
                    />
                    <button
                      type="button"
                      data-ocid="settings.universal_prompt.save_button"
                      onClick={handleSaveUniversalPrompt}
                      className="px-5 py-2 rounded-lg text-sm font-semibold"
                      style={{
                        background: "oklch(var(--brand))",
                        color: "white",
                      }}
                    >
                      Save Prompt
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        Preset Prompts
                      </span>
                      <button
                        type="button"
                        data-ocid="settings.presets.open_modal_button"
                        onClick={() => setPromptsOpen(true)}
                        className="text-xs font-medium"
                        style={{ color: "oklch(var(--brand))" }}
                      >
                        Open Full Library
                      </button>
                    </div>
                    <div className="space-y-2">
                      {PRESET_PROMPTS.map((preset) => (
                        <div
                          key={preset.id}
                          className="rounded-xl overflow-hidden"
                          style={{
                            border: "1px solid oklch(var(--border))",
                            background: "oklch(var(--surface-1))",
                          }}
                        >
                          <button
                            type="button"
                            data-ocid={`settings.preset.${preset.id}.toggle`}
                            onClick={() =>
                              setExpandedPrompt(
                                expandedPrompt === preset.id ? null : preset.id,
                              )
                            }
                            className="flex items-center gap-3 w-full px-4 py-3"
                          >
                            <span className="text-lg">{preset.icon}</span>
                            <div className="flex-1 text-left">
                              <p
                                className="text-sm font-semibold"
                                style={{ color: "oklch(var(--foreground))" }}
                              >
                                {preset.name}
                              </p>
                              <p
                                className="text-xs"
                                style={{
                                  color: "oklch(var(--muted-foreground))",
                                }}
                              >
                                {preset.description}
                              </p>
                            </div>
                            {expandedPrompt === preset.id ? (
                              <ChevronDown
                                className="w-4 h-4"
                                style={{
                                  color: "oklch(var(--muted-foreground))",
                                }}
                              />
                            ) : (
                              <ChevronRight
                                className="w-4 h-4"
                                style={{
                                  color: "oklch(var(--muted-foreground))",
                                }}
                              />
                            )}
                          </button>
                          {expandedPrompt === preset.id && (
                            <div
                              className="px-4 pb-4"
                              style={{
                                borderTop: "1px solid oklch(var(--border))",
                              }}
                            >
                              <pre
                                className="text-xs mt-3 whitespace-pre-wrap font-sans leading-relaxed"
                                style={{
                                  color: "oklch(var(--muted-foreground))",
                                  maxHeight: "200px",
                                  overflow: "auto",
                                }}
                              >
                                {preset.prompt.slice(0, 400)}...
                              </pre>
                              <button
                                type="button"
                                data-ocid={`settings.preset.${preset.id}.apply_button`}
                                onClick={() => {
                                  setUniversalPrompt(preset.prompt);
                                  updateProfile({
                                    universalSystemPrompt: preset.prompt,
                                  });
                                  toast.success(
                                    `${preset.name} prompt applied`,
                                  );
                                }}
                                className="mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold"
                                style={{
                                  background: "oklch(var(--brand))",
                                  color: "white",
                                }}
                              >
                                Apply as Universal
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── API Keys ── */}
              {section === "api-keys" && (
                <>
                  <SectionHeader title="API Keys" />

                  <div className="flex items-center justify-between mb-3">
                    <p
                      className="text-sm"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Up to 6 OpenRouter keys with auto-failover
                    </p>
                    {apiKeys.length < 6 && (
                      <button
                        type="button"
                        data-ocid="settings.apikey.add.button"
                        onClick={handleAddKey}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                          background: "oklch(var(--brand))",
                          color: "white",
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Key
                      </button>
                    )}
                  </div>

                  {apiKeys.length === 0 && (
                    <div
                      data-ocid="settings.apikeys.empty_state"
                      className="text-center py-10 rounded-xl"
                      style={{
                        background: "oklch(var(--surface-2))",
                        border: "1px solid oklch(var(--border))",
                      }}
                    >
                      <Key
                        className="w-8 h-8 mx-auto mb-2 opacity-30"
                        style={{ color: "oklch(var(--brand))" }}
                      />
                      <p
                        className="text-sm"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        No API keys added yet
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {apiKeys.map((k, idx) => (
                      <div
                        key={k.id}
                        data-ocid={`settings.apikey.item.${idx + 1}`}
                        className="rounded-xl p-4 space-y-3"
                        style={{
                          background: "oklch(var(--surface-1))",
                          border: "1px solid oklch(var(--border))",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Key
                              className="w-3.5 h-3.5"
                              style={{ color: "oklch(var(--brand))" }}
                            />
                            <span
                              className="text-xs font-semibold"
                              style={{
                                color: "oklch(var(--muted-foreground))",
                              }}
                            >
                              Key {idx + 1}
                            </span>
                          </div>
                          <button
                            type="button"
                            data-ocid={`settings.apikey.delete.button.${idx + 1}`}
                            onClick={() => handleDeleteKey(k.id)}
                          >
                            <Trash2
                              className="w-3.5 h-3.5"
                              style={{ color: "oklch(var(--destructive))" }}
                            />
                          </button>
                        </div>
                        <input
                          data-ocid={`settings.apikey.label.input.${idx + 1}`}
                          value={k.label}
                          onChange={(e) =>
                            handleUpdateKey(k.id, "label", e.target.value)
                          }
                          placeholder="Label (e.g. Personal, Work)"
                          className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                          style={{
                            background: "oklch(var(--surface-2))",
                            border: "1px solid oklch(var(--border))",
                            color: "oklch(var(--foreground))",
                          }}
                        />
                        <div className="relative">
                          <input
                            data-ocid={`settings.apikey.key.input.${idx + 1}`}
                            value={k.key}
                            onChange={(e) =>
                              handleUpdateKey(k.id, "key", e.target.value)
                            }
                            placeholder="sk-or-..."
                            type={showKeys[k.id] ? "text" : "password"}
                            className="w-full px-3 py-2 text-sm rounded-lg outline-none pr-9"
                            style={{
                              background: "oklch(var(--surface-2))",
                              border: "1px solid oklch(var(--border))",
                              color: "oklch(var(--foreground))",
                              fontFamily: "GeistMono, monospace",
                            }}
                          />
                          <button
                            type="button"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2"
                            onClick={() =>
                              setShowKeys((prev) => ({
                                ...prev,
                                [k.id]: !prev[k.id],
                              }))
                            }
                          >
                            {showKeys[k.id] ? (
                              <EyeOff
                                className="w-3.5 h-3.5"
                                style={{
                                  color: "oklch(var(--muted-foreground))",
                                }}
                              />
                            ) : (
                              <Eye
                                className="w-3.5 h-3.5"
                                style={{
                                  color: "oklch(var(--muted-foreground))",
                                }}
                              />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex items-start gap-2 p-3 rounded-xl mt-3"
                    style={{
                      background: "oklch(var(--brand) / 0.08)",
                      border: "1px solid oklch(var(--brand) / 0.2)",
                    }}
                  >
                    <Info
                      className="w-3.5 h-3.5 mt-0.5 shrink-0"
                      style={{ color: "oklch(var(--brand))" }}
                    />
                    <p
                      className="text-xs"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Keys stored locally. Auto-failover activates when Key 1 is
                      rate-limited — switches to Key 2 automatically.
                    </p>
                  </div>
                </>
              )}

              {/* ── Profile ── */}
              {section === "profile" && (
                <>
                  <SectionHeader title="Profile" />

                  <div
                    className="rounded-xl p-5"
                    style={{
                      background: "oklch(var(--surface-1))",
                      border: "1px solid oklch(var(--border))",
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold"
                        style={{
                          background: "oklch(var(--brand) / 0.15)",
                          color: "oklch(var(--brand))",
                        }}
                      >
                        {profile?.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          {profile?.username}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          Active profile
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-ocid="settings.logout.button"
                      onClick={handleLogout}
                      className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
                      style={{
                        background: "oklch(var(--destructive) / 0.12)",
                        color: "oklch(var(--destructive))",
                        border: "1px solid oklch(var(--destructive) / 0.3)",
                      }}
                    >
                      Sign Out
                    </button>
                  </div>

                  {allProfiles.length > 1 && (
                    <div className="mt-4">
                      <p
                        className="text-xs font-semibold uppercase tracking-wide mb-2"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        Other Profiles
                      </p>
                      <div className="space-y-2">
                        {allProfiles
                          .filter((p) => p.id !== profile?.id)
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              data-ocid="settings.profile.switch.button"
                              onClick={() => handleSwitchProfile(p.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left"
                              style={{
                                background: "oklch(var(--surface-1))",
                                border: "1px solid oklch(var(--border))",
                              }}
                            >
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{
                                  background: "oklch(var(--brand) / 0.12)",
                                  color: "oklch(var(--brand))",
                                }}
                              >
                                {p.username[0]?.toUpperCase()}
                              </div>
                              <span
                                className="text-sm"
                                style={{ color: "oklch(var(--foreground))" }}
                              >
                                {p.username}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── About ── */}
              {section === "about" && (
                <>
                  <SectionHeader title="About" />
                  <div
                    className="rounded-xl p-5 space-y-3"
                    style={{
                      background: "oklch(var(--surface-1))",
                      border: "1px solid oklch(var(--border))",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold"
                        style={{
                          background: "oklch(var(--brand) / 0.15)",
                          color: "oklch(var(--brand))",
                        }}
                      >
                        R
                      </div>
                      <div>
                        <p
                          className="font-semibold font-display"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          Rivelo Client
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          Version 2.0.0
                        </p>
                      </div>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      A mobile-first OpenRouter client. All data is stored
                      locally in your browser — no backend required.
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Supports 200+ AI models, multi-profile auth, API key
                      failover, in-app code sandbox, and streaming responses.
                    </p>
                  </div>

                  <div
                    className="mt-4 text-xs"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    &copy; {new Date().getFullYear()}. Built with love using{" "}
                    <a
                      href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "oklch(var(--brand))" }}
                    >
                      caffeine.ai
                    </a>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <PromptsModal
        open={promptsOpen}
        onClose={() => setPromptsOpen(false)}
        onApplyUniversal={(p) => {
          setUniversalPrompt(p);
          updateProfile({ universalSystemPrompt: p });
          setPromptsOpen(false);
        }}
        onApplyToChat={(p) => {
          setUniversalPrompt(p);
          updateProfile({ universalSystemPrompt: p });
          setPromptsOpen(false);
        }}
      />
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2
      className="font-display font-semibold text-lg mb-1"
      style={{ color: "oklch(var(--foreground))" }}
    >
      {title}
    </h2>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-4"
      style={{ borderBottom: "1px solid oklch(var(--border))" }}
    >
      <div className="flex-1">
        <p
          className="text-sm font-semibold"
          style={{ color: "oklch(var(--foreground))" }}
        >
          {label}
        </p>
        {description && (
          <p
            className="text-xs mt-0.5"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PromptIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
