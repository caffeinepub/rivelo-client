import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DisplayPreferences {
    directionality: string;
    showProfilePics: boolean;
    timestampFormat: string;
    fontSize: string;
    chatColor: string;
}
export interface UserProfile {
    username: string;
    displayName: string;
    preferences: DisplayPreferences;
}
export interface backendInterface {
    createProfile(username: string, displayName: string, preferences: DisplayPreferences): Promise<void>;
    getAllProfiles(): Promise<Array<UserProfile>>;
    getProfile(): Promise<UserProfile>;
    isUsernameTaken(username: string): Promise<boolean>;
    updateDisplayName(newDisplayName: string): Promise<void>;
    updateDisplayPreferences(newPreferences: DisplayPreferences): Promise<void>;
}
