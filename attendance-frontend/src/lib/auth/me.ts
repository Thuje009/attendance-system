import { api } from "@/src/lib/api";

export type UserRole = "ADMIN" | "TEACHER";

export type CurrentUser = {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
};
export async function getCurrentUser(): Promise<CurrentUser> {
  return api<CurrentUser>("/auth/me");
}