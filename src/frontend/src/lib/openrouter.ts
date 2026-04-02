// OpenRouter API client for Rivelo

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request?: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string;
  };
  per_request_limits?: Record<string, unknown>;
  // Additional fields from OpenRouter
  created?: number;
  owned_by?: string;
  hugging_face_id?: string;
  warning?: string;
  supported_parameters?: string[];
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export async function fetchModels(apiKey: string): Promise<OpenRouterModel[]> {
  const res = await fetch(`${OPENROUTER_BASE}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "Rivelo Client",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.data as OpenRouterModel[];
}

export async function streamChat(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  params: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
  },
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (status: number, message: string) => void,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Rivelo Client",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens ?? 4096,
        top_p: params.top_p ?? 1,
        frequency_penalty: params.frequency_penalty ?? 0,
      }),
    });
  } catch (err) {
    onError(0, String(err));
    return;
  }

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData?.error?.message || errMsg;
    } catch {
      // ignore
    }
    onError(res.status, errMsg);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError(0, "No response body");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const jsonStr = trimmed.slice(6);
        if (jsonStr === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) onChunk(delta);
        } catch {
          // ignore parse errors
        }
      }
    }
  } catch (err) {
    onError(0, String(err));
    return;
  } finally {
    reader.releaseLock();
  }

  onDone();
}

export function formatPrice(priceStr: string): string {
  const price = Number.parseFloat(priceStr);
  if (Number.isNaN(price) || price === 0) return "Free";
  // OpenRouter prices are per token, convert to per million
  const perMillion = price * 1_000_000;
  if (perMillion < 0.01) return `$${(perMillion * 1000).toFixed(3)}/B`;
  return `$${perMillion.toFixed(3)}/M`;
}

export function getProviderFromModelId(modelId: string): string {
  return modelId.split("/")[0] || "unknown";
}

export function parseCapabilities(model: OpenRouterModel): string[] {
  const caps: string[] = [];
  const modality = model.architecture?.modality?.toLowerCase() || "";
  const desc = (model.description || "").toLowerCase();
  const id = model.id.toLowerCase();

  if (
    modality.includes("image") ||
    modality.includes("vision") ||
    desc.includes("vision") ||
    desc.includes("image")
  ) {
    caps.push("Vision");
  }
  if (
    desc.includes("function") ||
    desc.includes("tool") ||
    id.includes("tool")
  ) {
    caps.push("Tool Use");
  }
  if (
    desc.includes("code") ||
    id.includes("code") ||
    id.includes("coder") ||
    id.includes("codestral")
  ) {
    caps.push("Code");
  }
  if (modality.includes("audio") || desc.includes("audio")) {
    caps.push("Audio");
  }
  if (
    desc.includes("reasoning") ||
    id.includes("think") ||
    id.includes("reason") ||
    id.includes("r1") ||
    id.includes("o1") ||
    id.includes("o3")
  ) {
    caps.push("Reasoning");
  }
  if (desc.includes("multilingual") || desc.includes("multi-lingual")) {
    caps.push("Multilingual");
  }
  if (modality.includes("text")) {
    caps.push("Text");
  }
  return caps.filter((v, i, a) => a.indexOf(v) === i);
}
