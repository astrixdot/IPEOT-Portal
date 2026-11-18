import type { SessionUser } from "./types";

export function can(user: SessionUser | null | undefined, permission: string) {
  if (!user) return false;
  if (user.roles.some((role) => role.code === "ADMIN")) return true;
  return user.permissions.includes(permission);
}
