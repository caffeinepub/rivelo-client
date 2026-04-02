import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  Key,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { saveApiKeys } from "../lib/apiKeys";
import {
  getAllProfiles,
  getCurrentProfile,
  logout,
  switchProfile,
  updateProfile,
} from "../lib/auth";
import type { ApiKey } from "../lib/auth";
import PromptsModal from "./PromptsModal";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  onProfileSwitch: () => void;
}

export default function SettingsSheet({
  open,
  onClose,
  onLogout,
  onProfileSwitch,
}: SettingsSheetProps) {
  const profile = getCurrentProfile();
  const allProfiles = getAllProfiles();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(profile?.apiKeys || []);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [universalPrompt, setUniversalPrompt] = useState(
    profile?.universalSystemPrompt || "",
  );
  const [promptsOpen, setPromptsOpen] = useState(false);

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

  const handleSaveUniversalPrompt = () => {
    updateProfile({ universalSystemPrompt: universalPrompt });
  };

  const handleSwitchProfile = (id: string) => {
    switchProfile(id);
    onProfileSwitch();
    onClose();
  };

  const handleLogout = () => {
    logout();
    onLogout();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        data-ocid="settings.sheet"
        side="right"
        className="w-full sm:max-w-md p-0"
        style={{
          background: "oklch(var(--surface-1))",
          border: "1px solid oklch(var(--border))",
        }}
      >
        <SheetHeader
          className="px-4 py-3"
          style={{ borderBottom: "1px solid oklch(var(--border))" }}
        >
          <SheetTitle className="font-display">Settings</SheetTitle>
        </SheetHeader>

        <Tabs
          defaultValue="profile"
          className="flex flex-col h-[calc(100vh-60px)]"
        >
          <TabsList
            className="mx-4 mt-3 grid grid-cols-3 h-9"
            style={{ background: "oklch(var(--surface-2))" }}
          >
            <TabsTrigger
              data-ocid="settings.profile.tab"
              value="profile"
              className="text-xs"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              data-ocid="settings.apikeys.tab"
              value="apikeys"
              className="text-xs"
            >
              API Keys
            </TabsTrigger>
            <TabsTrigger
              data-ocid="settings.prompts.tab"
              value="prompts"
              className="text-xs"
            >
              Prompts
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Current profile */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "oklch(var(--surface-2))",
                    border: "1px solid oklch(var(--border))",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{
                        background: "oklch(var(--brand) / 0.2)",
                        color: "oklch(var(--brand))",
                      }}
                    >
                      {profile?.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium"
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
                  <Button
                    data-ocid="settings.logout.button"
                    variant="destructive"
                    size="sm"
                    className="w-full mt-3 text-xs"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </div>

                {/* Other profiles */}
                {allProfiles.length > 1 && (
                  <div>
                    <h3
                      className="text-xs font-semibold uppercase tracking-wide mb-2"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Other Profiles
                    </h3>
                    <div className="space-y-1">
                      {allProfiles
                        .filter((p) => p.id !== profile?.id)
                        .map((p) => (
                          <button
                            type="button"
                            key={p.id}
                            data-ocid="settings.profile.button"
                            onClick={() => handleSwitchProfile(p.id)}
                            className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                            style={{
                              background: "oklch(var(--surface-2))",
                              border: "1px solid oklch(var(--border))",
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                              style={{
                                background: "oklch(var(--brand) / 0.15)",
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

                {/* About */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "oklch(var(--surface-2))",
                    border: "1px solid oklch(var(--border))",
                  }}
                >
                  <h3
                    className="text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    About Rivelo Client
                  </h3>
                  <p
                    className="text-xs"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Version 1.0.0 • Mobile-first OpenRouter client
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    All data stored locally. No backend required.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="apikeys" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      API Keys
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Up to 6 keys with auto-failover
                    </p>
                  </div>
                  {apiKeys.length < 6 && (
                    <Button
                      data-ocid="settings.apikey.add.button"
                      size="sm"
                      onClick={handleAddKey}
                      className="gap-1 text-xs"
                      style={{
                        background: "oklch(var(--brand))",
                        color: "oklch(var(--surface-0))",
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Key
                    </Button>
                  )}
                </div>

                {apiKeys.length === 0 && (
                  <div
                    data-ocid="settings.apikeys.empty_state"
                    className="text-center py-8 text-sm"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No API keys added yet</p>
                    <p className="text-xs mt-1">
                      Add your OpenRouter API keys to start chatting
                    </p>
                  </div>
                )}

                {apiKeys.map((k, idx) => (
                  <div
                    key={k.id}
                    data-ocid={`settings.apikey.item.${idx + 1}`}
                    className="rounded-xl p-3 space-y-2"
                    style={{
                      background: "oklch(var(--surface-2))",
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
                          className="text-xs font-medium"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          Key {idx + 1}
                        </span>
                      </div>
                      <button
                        type="button"
                        data-ocid={`settings.apikey.delete.button.${idx + 1}`}
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-1 rounded"
                      >
                        <Trash2
                          className="w-3.5 h-3.5"
                          style={{ color: "oklch(var(--destructive))" }}
                        />
                      </button>
                    </div>
                    <Input
                      data-ocid={`settings.apikey.label.input.${idx + 1}`}
                      value={k.label}
                      onChange={(e) =>
                        handleUpdateKey(k.id, "label", e.target.value)
                      }
                      placeholder="Label (e.g. Personal, Work)"
                      className="h-8 text-xs"
                      style={{
                        background: "oklch(var(--surface-3))",
                        border: "1px solid oklch(var(--border))",
                      }}
                    />
                    <div className="relative">
                      <Input
                        data-ocid={`settings.apikey.key.input.${idx + 1}`}
                        value={k.key}
                        onChange={(e) =>
                          handleUpdateKey(k.id, "key", e.target.value)
                        }
                        placeholder="sk-or-..."
                        type={showKeys[k.id] ? "text" : "password"}
                        className="h-8 text-xs pr-8 font-mono"
                        style={{
                          background: "oklch(var(--surface-3))",
                          border: "1px solid oklch(var(--border))",
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
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
                            style={{ color: "oklch(var(--muted-foreground))" }}
                          />
                        ) : (
                          <Eye
                            className="w-3.5 h-3.5"
                            style={{ color: "oklch(var(--muted-foreground))" }}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                <div
                  className="flex items-start gap-2 p-3 rounded-xl"
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
                    Keys are stored locally. If Key 1 is rate-limited, Rivelo
                    automatically switches to Key 2, and so on.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      Universal System Prompt
                    </h3>
                    <button
                      type="button"
                      data-ocid="settings.presets.open_modal_button"
                      onClick={() => setPromptsOpen(true)}
                      className="text-xs font-medium"
                      style={{ color: "oklch(var(--brand))" }}
                    >
                      Presets
                    </button>
                  </div>
                  <p
                    className="text-xs mb-2"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Applies to all chats unless a per-chat prompt is set
                  </p>
                  <Textarea
                    data-ocid="settings.universal_prompt.textarea"
                    value={universalPrompt}
                    onChange={(e) => setUniversalPrompt(e.target.value)}
                    onBlur={handleSaveUniversalPrompt}
                    placeholder="You are a helpful assistant..."
                    className="min-h-[120px] text-xs resize-none"
                    style={{
                      background: "oklch(var(--surface-2))",
                      border: "1px solid oklch(var(--border))",
                    }}
                  />
                  <Button
                    data-ocid="settings.universal_prompt.save_button"
                    size="sm"
                    className="w-full mt-2 text-xs"
                    onClick={handleSaveUniversalPrompt}
                    style={{
                      background: "oklch(var(--brand))",
                      color: "oklch(var(--surface-0))",
                    }}
                  >
                    Save Prompt
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

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
      </SheetContent>
    </Sheet>
  );
}
