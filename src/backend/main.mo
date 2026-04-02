import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Order "mo:core/Order";

actor {
  public type DisplayPreferences = {
    directionality : Text; // "LTR" or "RTL"
    chatColor : Text; // e.g. "blue", "green"
    fontSize : Text; // e.g. "small", "medium", "large"
    timestampFormat : Text; // "12h" or "24h"
    showProfilePics : Bool;
  };

  public type UserProfile = {
    username : Text;
    displayName : Text;
    preferences : DisplayPreferences;
  };

  module UserProfile {
    public func compare(user1 : UserProfile, user2 : UserProfile) : Order.Order {
      Text.compare(user1.username, user2.username);
    };
  };

  let profiles = Map.empty<Principal, UserProfile>();

  public shared ({ caller }) func createProfile(username : Text, displayName : Text, preferences : DisplayPreferences) : async () {
    if (profiles.containsKey(caller)) { Runtime.trap("This user already exists") };
    let profile = {
      username;
      displayName;
      preferences;
    };
    profiles.add(caller, profile);
  };

  public query ({ caller }) func getProfile() : async UserProfile {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) { profile };
    };
  };

  public shared ({ caller }) func updateDisplayName(newDisplayName : Text) : async () {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let updatedProfile = {
          profile with displayName = newDisplayName;
        };
        profiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func updateDisplayPreferences(newPreferences : DisplayPreferences) : async () {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let updatedProfile = {
          profile with preferences = newPreferences;
        };
        profiles.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func isUsernameTaken(username : Text) : async Bool {
    profiles.values().find(func(profile) { profile.username == username }) != null;
  };

  public query ({ caller }) func getAllProfiles() : async [UserProfile] {
    profiles.values().toArray().sort();
  };
};
