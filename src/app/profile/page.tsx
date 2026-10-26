import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/account/ProfileView";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Профиль", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/login?callbackUrl=%2Fprofile");
  return <ProfileView name={viewer.user.name} email={viewer.user.email} isAdmin={viewer.isAdmin} />;
}
