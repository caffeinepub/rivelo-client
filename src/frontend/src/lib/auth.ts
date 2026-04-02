// Local multi-profile auth system for Rivelo Client
// All data stored in localStorage

const PROFILES_KEY = "rivelo_profiles";
const CURRENT_PROFILE_KEY = "rivelo_current_profile";

export interface ApiKey {
  id: string;
  label: string;
  key: string;
  isActive: boolean;
}

export interface Profile {
  id: string;
  username: string;
  passwordHash: string;
  apiKeys: ApiKey[];
  universalSystemPrompt: string;
  favoriteModels: string[];
  settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    defaultModel: string;
  };
  createdAt: number;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getAllProfilesRaw(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAllProfiles(profiles: Profile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export async function createProfile(
  username: string,
  password: string,
): Promise<Profile> {
  const profiles = getAllProfilesRaw();
  const exists = profiles.find(
    (p) => p.username.toLowerCase() === username.toLowerCase(),
  );
  if (exists) throw new Error("Username already taken");

  const passwordHash = await hashPassword(password);
  const profile: Profile = {
    id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    username,
    passwordHash,
    apiKeys: [],
    universalSystemPrompt: "",
    favoriteModels: [],
    settings: {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      frequencyPenalty: 0,
      defaultModel: "openai/gpt-4o-mini",
    },
    createdAt: Date.now(),
  };

  profiles.push(profile);
  saveAllProfiles(profiles);
  localStorage.setItem(CURRENT_PROFILE_KEY, profile.id);
  return profile;
}

export async function login(
  username: string,
  password: string,
): Promise<Profile> {
  const profiles = getAllProfilesRaw();
  const profile = profiles.find(
    (p) => p.username.toLowerCase() === username.toLowerCase(),
  );
  if (!profile) throw new Error("Profile not found");

  const hash = await hashPassword(password);
  if (hash !== profile.passwordHash) throw new Error("Incorrect password");

  localStorage.setItem(CURRENT_PROFILE_KEY, profile.id);
  return profile;
}

export function logout(): void {
  localStorage.removeItem(CURRENT_PROFILE_KEY);
}

export function getCurrentProfile(): Profile | null {
  const currentId = localStorage.getItem(CURRENT_PROFILE_KEY);
  if (!currentId) return null;
  const profiles = getAllProfilesRaw();
  return profiles.find((p) => p.id === currentId) || null;
}

export function updateProfile(updates: Partial<Profile>): void {
  const current = getCurrentProfile();
  if (!current) return;
  const profiles = getAllProfilesRaw();
  const idx = profiles.findIndex((p) => p.id === current.id);
  if (idx < 0) return;
  profiles[idx] = { ...profiles[idx], ...updates };
  saveAllProfiles(profiles);
}

export function getAllProfiles(): Profile[] {
  return getAllProfilesRaw().map((p) => ({
    ...p,
    passwordHash: "[hidden]",
  })) as Profile[];
}

export function switchProfile(profileId: string): void {
  localStorage.setItem(CURRENT_PROFILE_KEY, profileId);
}

export function toggleFavoriteModel(modelId: string): boolean {
  const profile = getCurrentProfile();
  if (!profile) return false;
  const favs = profile.favoriteModels || [];
  const isFav = favs.includes(modelId);
  const updated = isFav
    ? favs.filter((id) => id !== modelId)
    : [...favs, modelId];
  updateProfile({ favoriteModels: updated });
  return !isFav;
}

export function isFavoriteModel(modelId: string): boolean {
  const profile = getCurrentProfile();
  if (!profile) return false;
  return (profile.favoriteModels || []).includes(modelId);
}
