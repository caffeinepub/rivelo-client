import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, RefreshCw, Search, Star, X } from "lucide-react";
import { useState } from "react";
import { getCurrentProfile, toggleFavoriteModel } from "../lib/auth";
import type { OpenRouterModel } from "../lib/openrouter";
import { getProviderFromModelId } from "../lib/openrouter";

const PROVIDERS = [
  "All",
  "anthropic",
  "openai",
  "meta-llama",
  "google",
  "mistralai",
  "cohere",
  "deepseek",
  "qwen",
];
const PROVIDER_LABELS: Record<string, string> = {
  All: "All",
  anthropic: "Anthropic",
  openai: "OpenAI",
  "meta-llama": "Meta",
  google: "Google",
  mistralai: "Mistral",
  cohere: "Cohere",
  deepseek: "DeepSeek",
  qwen: "Qwen",
};

interface ModelExplorerProps {
  models: OpenRouterModel[];
  loading: boolean;
  error: string | null;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onRefetch: () => void;
  onViewModelDetail?: (model: OpenRouterModel) => void;
  compact?: boolean;
}

export default function ModelExplorer({
  models,
  loading,
  error,
  selectedModel,
  onSelectModel,
  onRefetch,
  onViewModelDetail,
  compact = false,
}: ModelExplorerProps) {
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("All");
  const [favRefresh, setFavRefresh] = useState(0);

  const profile = getCurrentProfile();
  const favIds = new Set(profile?.favoriteModels || []);

  const handleToggleFav = (e: React.MouseEvent, modelId: string) => {
    e.stopPropagation();
    toggleFavoriteModel(modelId);
    setFavRefresh((n) => n + 1);
  };

  const filtered = models.filter((m) => {
    const prov = getProviderFromModelId(m.id);
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase());
    const matchProvider = provider === "All" || prov === provider;
    return matchSearch && matchProvider;
  });

  const favModels = models.filter((m) => favIds.has(m.id));

  return (
    <div className="flex flex-col h-full" key={favRefresh}>
      {/* Search */}
      <div className="px-3 py-2">
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
          style={{
            background: "oklch(var(--surface-2))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <Search
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: "oklch(var(--muted-foreground))" }}
          />
          <input
            data-ocid="models.search_input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "oklch(var(--foreground))" }}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")}>
              <X
                className="w-3.5 h-3.5"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
            </button>
          )}
          <button
            type="button"
            data-ocid="models.refresh.button"
            onClick={onRefetch}
            title="Refresh models"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              style={{ color: "oklch(var(--muted-foreground))" }}
            />
          </button>
        </div>
      </div>

      {/* Provider pills */}
      {!compact && (
        <div className="px-3 pb-2">
          <div
            className="flex gap-1 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {PROVIDERS.map((p) => (
              <button
                key={p}
                type="button"
                data-ocid="models.provider.tab"
                onClick={() => setProvider(p)}
                className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background:
                    provider === p
                      ? "oklch(var(--brand))"
                      : "oklch(var(--surface-2))",
                  color:
                    provider === p
                      ? "oklch(var(--surface-0))"
                      : "oklch(var(--muted-foreground))",
                  border: "1px solid oklch(var(--border))",
                }}
              >
                {PROVIDER_LABELS[p] || p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mx-3 mb-2 px-3 py-2 rounded-lg text-xs"
          style={{
            background: "oklch(var(--destructive) / 0.15)",
            color: "oklch(var(--destructive))",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          data-ocid="models.loading_state"
          className="flex items-center gap-2 px-3 py-4 text-xs"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Loading models...
        </div>
      )}

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="px-2 pb-3">
          {/* Favorites section */}
          {favModels.length > 0 && !search && provider === "All" && (
            <div className="mb-2">
              <div className="px-2 py-1.5 flex items-center gap-1">
                <Star
                  className="w-3 h-3"
                  style={{ color: "oklch(var(--brand))" }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "oklch(var(--brand))" }}
                >
                  Favorites
                </span>
              </div>
              {favModels.map((m) => (
                <ModelRow
                  key={m.id}
                  model={m}
                  isFav={true}
                  isSelected={selectedModel === m.id}
                  onSelect={() => onSelectModel(m.id)}
                  onToggleFav={handleToggleFav}
                  onViewDetail={onViewModelDetail}
                />
              ))}
              <div
                className="mx-2 my-1"
                style={{ borderBottom: "1px solid oklch(var(--border))" }}
              />
            </div>
          )}

          {/* All models */}
          {!loading && (
            <div>
              <div className="px-2 py-1.5">
                <span
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  {search || provider !== "All"
                    ? `Results (${filtered.length})`
                    : `All Models (${models.length})`}
                </span>
              </div>
              {filtered.length === 0 && !loading && (
                <div
                  data-ocid="models.empty_state"
                  className="px-3 py-6 text-center text-sm"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  No models found
                </div>
              )}
              {filtered.map((m) => (
                <ModelRow
                  key={m.id}
                  model={m}
                  isFav={favIds.has(m.id)}
                  isSelected={selectedModel === m.id}
                  onSelect={() => onSelectModel(m.id)}
                  onToggleFav={handleToggleFav}
                  onViewDetail={onViewModelDetail}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ModelRow({
  model,
  isFav,
  isSelected,
  onSelect,
  onToggleFav,
  onViewDetail,
}: {
  model: OpenRouterModel;
  isFav: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFav: (e: React.MouseEvent, id: string) => void;
  onViewDetail?: (m: OpenRouterModel) => void;
}) {
  const provider = getProviderFromModelId(model.id);
  const shortName =
    model.name.length > 28 ? `${model.name.slice(0, 26)}\u2026` : model.name;
  const inputPrice = Number.parseFloat(model.pricing?.prompt || "0");
  const isFree = inputPrice === 0;

  return (
    <button
      type="button"
      data-ocid="models.item.1"
      onClick={onSelect}
      className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg group transition-colors"
      style={{
        background: isSelected ? "oklch(var(--brand) / 0.12)" : "transparent",
        border: isSelected
          ? "1px solid oklch(var(--brand) / 0.3)"
          : "1px solid transparent",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className="text-xs font-medium truncate"
            style={{
              color: isSelected
                ? "oklch(var(--brand))"
                : "oklch(var(--foreground))",
            }}
          >
            {shortName}
          </span>
          {isFree && (
            <span
              className="text-xs px-1 rounded shrink-0"
              style={{
                background: "oklch(var(--success) / 0.15)",
                color: "oklch(var(--success))",
              }}
            >
              Free
            </span>
          )}
        </div>
        <span
          className="text-xs"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          {provider}
        </span>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        {onViewDetail && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail(model);
            }}
            className="p-1 rounded transition-opacity"
            title="View details"
          >
            <ChevronRight
              className="w-3 h-3"
              style={{ color: "oklch(var(--muted-foreground))" }}
            />
          </button>
        )}
        <button
          type="button"
          data-ocid="models.fav.toggle"
          onClick={(e) => onToggleFav(e, model.id)}
          className="p-1 rounded transition-all"
          title={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className="w-3.5 h-3.5"
            style={{
              color: isFav
                ? "oklch(var(--brand))"
                : "oklch(var(--muted-foreground))",
              fill: isFav ? "oklch(var(--brand))" : "none",
            }}
          />
        </button>
      </div>
    </button>
  );
}
