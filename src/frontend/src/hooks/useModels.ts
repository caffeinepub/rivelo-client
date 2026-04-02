import { useCallback, useEffect, useState } from "react";
import { getActiveApiKey } from "../lib/apiKeys";
import type { OpenRouterModel } from "../lib/openrouter";
import { fetchModels } from "../lib/openrouter";

const SESSION_CACHE_KEY = "rivelo_models_cache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface ModelCache {
  models: OpenRouterModel[];
  timestamp: number;
}

function loadFromCache(): OpenRouterModel[] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as ModelCache;
    if (Date.now() - cache.timestamp > CACHE_TTL) return null;
    return cache.models;
  } catch {
    return null;
  }
}

function saveToCache(models: OpenRouterModel[]) {
  try {
    const cache: ModelCache = { models, timestamp: Date.now() };
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
}

export function useModels() {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    // Try cache first
    const cached = loadFromCache();
    if (cached && cached.length > 0) {
      setModels(cached);
      return;
    }

    const apiKey = getActiveApiKey();
    if (!apiKey) {
      setError("No API key configured. Add one in Settings to browse models.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchModels(apiKey);
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      setModels(sorted);
      saveToCache(sorted);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
    await loadModels();
  }, [loadModels]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return { models, loading, error, refetch, loadModels };
}
