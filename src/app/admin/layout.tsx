import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#20211f] text-white md:flex">
      <AdminSidebar name={profile?.full_name || "Admin"} email={user.email ?? ""} />
      <div className="min-w-0 flex-1 bg-[#20211f]">{children}</div>
    </div>
  );
}
