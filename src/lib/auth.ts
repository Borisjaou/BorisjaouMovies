import "server-only";
import { auth } from "@/auth";
import type { Role } from "@/lib/auth/roles";

export interface Viewer {
  isAdmin: boolean;
  user: { id: string; name: string | null; email: string | null; role: Role } | null;
}

/** Текущий пользователь для серверных компонентов */
export async function getViewer(): Promise<Viewer> {
  const session = await auth();
  const user = session?.user;
  if (!user) return { isAdmin: false, user: null };
  return {
    isAdmin: user.role === "admin",
    user: { id: user.id, name: user.name ?? null, email: user.email ?? null, role: user.role },
  };
}

/** Для серверных действий админки: бросает ошибку, если не admin */
export async function requireAdmin(): Promise<NonNullable<Viewer["user"]>> {
  const viewer = await getViewer();
  if (!viewer.isAdmin || !viewer.user) throw new Error("FORBIDDEN");
  return viewer.user;
}
