import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, MessageSquare, Star, X, Zap } from "lucide-react";
import { useState } from "react";
import { getCurrentProfile, toggleFavoriteModel } from "../lib/auth";
import type { OpenRouterModel } from "../lib/openrouter";
import {
  formatPrice,
  getProviderFromModelId,
  parseCapabilities,
} from "../lib/openrouter";

interface ModelCardProps {
  model: OpenRouterModel;
  onClose?: () => void;
  onSelectModel?: (id: string) => void;
}

export default function ModelCard({
  model,
  onClose,
  onSelectModel,
}: ModelCardProps) {
  const [favRefresh, setFavRefresh] = useState(0);
  const profile = getCurrentProfile();
  const isFav = (profile?.favoriteModels || []).includes(model.id);

  const handleToggleFav = () => {
    toggleFavoriteModel(model.id);
    setFavRefresh((n) => n + 1);
  };

  const provider = getProviderFromModelId(model.id);
  const capabilities = parseCapabilities(model);
  const inputPrice = formatPrice(model.pricing?.prompt || "0");
  const outputPrice = formatPrice(model.pricing?.completion || "0");
  const isFree =
    Number.parseFloat(model.pricing?.prompt || "0") === 0 &&
    Number.parseFloat(model.pricing?.completion || "0") === 0;
  const contextK = model.context_length
    ? Math.round(model.context_length / 1000)
    : null;
  const maxCompletionK = model.top_provider?.max_completion_tokens
    ? Math.round(model.top_provider.max_completion_tokens / 1000)
    : null;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "oklch(var(--surface-1))" }}
      key={favRefresh}
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 shrink-0"
        style={{ borderBottom: "1px solid oklch(var(--border))" }}
      >
        <div className="flex-1 min-w-0">
          <h2
            className="font-semibold font-display text-sm leading-snug"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {model.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className="text-xs"
              style={{
                background: "oklch(var(--surface-2))",
                color: "oklch(var(--muted-foreground))",
                border: "none",
              }}
            >
              {provider}
            </Badge>
            {isFree && (
              <Badge
                className="text-xs"
                style={{
                  background: "oklch(var(--success) / 0.15)",
                  color: "oklch(var(--success))",
                  border: "none",
                }}
              >
                Free
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-ocid="model.fav.toggle"
            onClick={handleToggleFav}
            className="p-2 rounded-lg transition-colors"
            style={{
              background: isFav
                ? "oklch(var(--brand) / 0.15)"
                : "oklch(var(--surface-2))",
            }}
            title={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className="w-4 h-4"
              style={{
                color: isFav
                  ? "oklch(var(--brand))"
                  : "oklch(var(--muted-foreground))",
                fill: isFav ? "oklch(var(--brand))" : "none",
              }}
            />
          </button>
          {onClose && (
            <button
              type="button"
              data-ocid="model.close.button"
              onClick={onClose}
              className="p-2 rounded-lg"
              style={{ background: "oklch(var(--surface-2))" }}
            >
              <X
                className="w-4 h-4"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Model ID */}
          <div>
            <p
              className="text-xs font-mono"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              {model.id}
            </p>
          </div>

          {/* Description */}
          {model.description && (
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Description
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "oklch(var(--foreground))" }}
              >
                {model.description}
              </p>
            </div>
          )}

          {/* Capabilities */}
          {capabilities.length > 0 && (
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Capabilities
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: "oklch(var(--brand) / 0.12)",
                      color: "oklch(var(--brand))",
                      border: "1px solid oklch(var(--brand) / 0.25)",
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Context & tokens */}
          <div className="grid grid-cols-2 gap-2">
            {contextK && (
              <div
                className="rounded-xl p-3"
                style={{ background: "oklch(var(--surface-2))" }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <MessageSquare
                    className="w-3 h-3"
                    style={{ color: "oklch(var(--brand))" }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Context
                  </span>
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "oklch(var(--foreground))" }}
                >
                  {contextK}K
                </p>
              </div>
            )}
            {maxCompletionK && (
              <div
                className="rounded-xl p-3"
                style={{ background: "oklch(var(--surface-2))" }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <Zap
                    className="w-3 h-3"
                    style={{ color: "oklch(var(--brand))" }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Max Output
                  </span>
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "oklch(var(--foreground))" }}
                >
                  {maxCompletionK}K
                </p>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Pricing
            </h3>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid oklch(var(--border))" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "oklch(var(--surface-2))" }}>
                    <th
                      className="px-3 py-2 text-left text-xs font-medium"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Type
                    </th>
                    <th
                      className="px-3 py-2 text-right text-xs font-medium"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderTop: "1px solid oklch(var(--border))" }}>
                    <td
                      className="px-3 py-2 text-xs"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      Input tokens
                    </td>
                    <td
                      className="px-3 py-2 text-right text-xs font-mono"
                      style={{
                        color: isFree
                          ? "oklch(var(--success))"
                          : "oklch(var(--foreground))",
                      }}
                    >
                      {inputPrice}
                    </td>
                  </tr>
                  <tr style={{ borderTop: "1px solid oklch(var(--border))" }}>
                    <td
                      className="px-3 py-2 text-xs"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      Output tokens
                    </td>
                    <td
                      className="px-3 py-2 text-right text-xs font-mono"
                      style={{
                        color: isFree
                          ? "oklch(var(--success))"
                          : "oklch(var(--foreground))",
                      }}
                    >
                      {outputPrice}
                    </td>
                  </tr>
                  {model.pricing?.image &&
                    Number.parseFloat(model.pricing.image) > 0 && (
                      <tr
                        style={{ borderTop: "1px solid oklch(var(--border))" }}
                      >
                        <td
                          className="px-3 py-2 text-xs"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          Image
                        </td>
                        <td
                          className="px-3 py-2 text-right text-xs font-mono"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          {formatPrice(model.pricing.image)}
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Architecture */}
          {model.architecture && (
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Architecture
              </h3>
              <div className="space-y-1.5">
                {model.architecture.modality && (
                  <div className="flex justify-between">
                    <span
                      className="text-xs"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Modality
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      {model.architecture.modality}
                    </span>
                  </div>
                )}
                {model.architecture.tokenizer && (
                  <div className="flex justify-between">
                    <span
                      className="text-xs"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Tokenizer
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      {model.architecture.tokenizer}
                    </span>
                  </div>
                )}
                {model.architecture.instruct_type && (
                  <div className="flex justify-between">
                    <span
                      className="text-xs"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Instruct type
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      {model.architecture.instruct_type}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Moderation */}
          {model.top_provider?.is_moderated !== undefined && (
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              <Info className="w-3.5 h-3.5" />
              {model.top_provider.is_moderated ? "Moderated" : "Not moderated"}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* CTA */}
      {onSelectModel && (
        <div
          className="p-4 shrink-0"
          style={{ borderTop: "1px solid oklch(var(--border))" }}
        >
          <button
            type="button"
            data-ocid="model.select.button"
            onClick={() => onSelectModel(model.id)}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "oklch(var(--brand))",
              color: "oklch(var(--surface-0))",
            }}
          >
            Use this model
          </button>
        </div>
      )}
    </div>
  );
}
