import type { Role } from "@/lib/auth/roles";

export type AuthProvider = "credentials" | "google";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  /** null — аккаунт без пароля (вход только через Google) */
  passwordHash: string | null;
  role: Role;
  providers: AuthProvider[];
  createdAt: string;
}

/** Хранилище пользователей. Сейчас — JSON-файл, потом — база; остальной код не меняется. */
export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(data: Omit<UserRecord, "id" | "createdAt">): Promise<UserRecord>;
  update(id: string, patch: Partial<Omit<UserRecord, "id" | "createdAt">>): Promise<UserRecord>;
}
