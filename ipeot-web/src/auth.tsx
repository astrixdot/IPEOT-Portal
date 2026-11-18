import { useQuery } from "@tanstack/react-query";
import { ApiError, api } from "./api";
import type { SessionUser } from "./types";

export function useSession() {
  return useQuery({
    queryKey: ["me"],
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        return await api<{ user: SessionUser }>("/api/auth/me");
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return { user: null };
        throw err;
      }
    },
  });
}
