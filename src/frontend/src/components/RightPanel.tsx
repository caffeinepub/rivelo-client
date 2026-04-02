import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart2,
  ChevronDown,
  Hash,
  Repeat,
  Settings,
  Thermometer,
} from "lucide-react";
import { useState } from "react";
import { getCurrentProfile, updateProfile } from "../lib/auth";
import PromptsModal from "./PromptsModal";

interface RightPanelProps {
  selectedModel: string;
  onUpdateSettings?: () => void;
}

export default function RightPanel({
  selectedModel,
  onUpdateSettings,
}: RightPanelProps) {
  const profile = getCurrentProfile();
  const settings = profile?.settings || {
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    frequencyPenalty: 0,
    defaultModel: "",
  };

  const [temperature, setTemperature] = useState(settings.temperature);
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens);
  const [topP, setTopP] = useState(settings.topP);
  const [frequencyPenalty, setFrequencyPenalty] = useState(
    settings.frequencyPenalty,
  );
  const [universalPrompt, setUniversalPrompt] = useState(
    profile?.universalSystemPrompt || "",
  );
  const [promptsOpen, setPromptsOpen] = useState(false);

  const saveParam = (key: string, val: number) => {
    const current = getCurrentProfile();
    if (!current) return;
    updateProfile({ settings: { ...current.settings, [key]: val } });
    onUpdateSettings?.();
  };

  const saveUniversalPrompt = (val: string) => {
    setUniversalPrompt(val);
    updateProfile({ universalSystemPrompt: val });
  };

  const modelShortName = selectedModel.split("/").pop() || selectedModel;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "oklch(var(--surface-1))" }}
    >
      <div
        className="px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid oklch(var(--border))" }}
      >
        <h2
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          Parameters
        </h2>
        <p
          className="text-xs mt-0.5 truncate"
          style={{ color: "oklch(var(--brand))" }}
        >
          {modelShortName}
        </p>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Temperature */}
          <SliderParam
            label="Temperature"
            icon={<Thermometer className="w-3.5 h-3.5" />}
            value={temperature}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => {
              setTemperature(v);
              saveParam("temperature", v);
            }}
          />

          {/* Max Tokens */}
          <SliderParam
            label="Max Tokens"
            icon={<Hash className="w-3.5 h-3.5" />}
            value={maxTokens}
            min={256}
            max={32768}
            step={256}
            onChange={(v) => {
              setMaxTokens(v);
              saveParam("maxTokens", v);
            }}
          />

          {/* Top P */}
          <SliderParam
            label="Top P"
            icon={<BarChart2 className="w-3.5 h-3.5" />}
            value={topP}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => {
              setTopP(v);
              saveParam("topP", v);
            }}
          />

          {/* Frequency Penalty */}
          <SliderParam
            label="Frequency Penalty"
            icon={<Repeat className="w-3.5 h-3.5" />}
            value={frequencyPenalty}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => {
              setFrequencyPenalty(v);
              saveParam("frequencyPenalty", v);
            }}
          />

          {/* Universal System Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Universal Prompt
              </span>
              <button
                type="button"
                data-ocid="rightpanel.prompts.open_modal_button"
                onClick={() => setPromptsOpen(true)}
                className="text-xs font-medium"
                style={{ color: "oklch(var(--brand))" }}
              >
                Presets
              </button>
            </div>
            <Textarea
              data-ocid="rightpanel.universal_prompt.textarea"
              value={universalPrompt}
              onChange={(e) => saveUniversalPrompt(e.target.value)}
              placeholder="Set a universal system prompt for all chats..."
              className="text-xs min-h-[100px] max-h-[200px] resize-none"
              style={{
                background: "oklch(var(--surface-2))",
                border: "1px solid oklch(var(--border))",
              }}
            />
          </div>
        </div>
      </ScrollArea>

      <PromptsModal
        open={promptsOpen}
        onClose={() => setPromptsOpen(false)}
        onApplyUniversal={(p) => {
          saveUniversalPrompt(p);
          setPromptsOpen(false);
        }}
        onApplyToChat={(p) => {
          saveUniversalPrompt(p);
          setPromptsOpen(false);
        }}
      />
    </div>
  );
}

function SliderParam({
  label,
  icon,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span style={{ color: "oklch(var(--brand))" }}>{icon}</span>
          <span
            className="text-xs font-medium"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {label}
          </span>
        </div>
        <span
          className="text-xs font-mono font-semibold"
          style={{ color: "oklch(var(--brand))" }}
        >
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
      <div className="flex justify-between mt-0.5">
        <span
          className="text-xs"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          {min}
        </span>
        <span
          className="text-xs"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          {max}
        </span>
      </div>
    </div>
  );
}
