import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!["admin", "customer_service"].includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div data-theme="light" className="min-h-screen flex bg-brand-bg">
      <AdminSidebar />
      <main className="flex-1 h-screen overflow-auto">{children}</main>
    </div>
  );
}
