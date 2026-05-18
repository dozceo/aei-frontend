"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  loadUserProfileSettings,
  saveUserProfileSettings,
  loadUserPreferenceSettings,
  saveUserPreferenceSettings,
  getProfileDefaults,
  getPreferenceDefaults,
  type UserProfileSettings,
  type UserPreferenceSettings,
} from "@/lib/user-settings-db";

/* ─── Profile ─── */

export function useUserProfileQuery(uid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.userProfile(uid ?? ""),
    queryFn: () => loadUserProfileSettings(uid!),
    enabled: !!uid,
    staleTime: 1000 * 60 * 5,
    placeholderData: getProfileDefaults,
  });
}

export function useSaveUserProfileMutation(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserProfileSettings) => {
      if (!uid) throw new Error("User not authenticated.");
      return saveUserProfileSettings(uid, payload);
    },
    onSuccess: (_data, payload) => {
      // Optimistically update the cache with the saved payload
      if (uid) {
        queryClient.setQueryData(queryKeys.userProfile(uid), payload);
      }
    },
  });
}

/* ─── Preferences ─── */

export function useUserPreferencesQuery(uid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.userPreferences(uid ?? ""),
    queryFn: () => loadUserPreferenceSettings(uid!),
    enabled: !!uid,
    staleTime: 1000 * 60 * 5,
    placeholderData: getPreferenceDefaults,
  });
}

export function useSaveUserPreferencesMutation(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserPreferenceSettings) => {
      if (!uid) throw new Error("User not authenticated.");
      return saveUserPreferenceSettings(uid, payload);
    },
    onSuccess: (_data, payload) => {
      if (uid) {
        queryClient.setQueryData(queryKeys.userPreferences(uid), payload);
      }
    },
  });
}
