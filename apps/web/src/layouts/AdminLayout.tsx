import { Sidebar } from "@/components/admin/Sidebar";
import { IdleSessionGuard } from "@/components/admin/IdleSessionGuard";
import { CommonCodeProvider } from "@/providers/CommonCodeProvider";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <CommonCodeProvider>
      <div className="flex h-screen overflow-hidden">
        <IdleSessionGuard />
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </CommonCodeProvider>
  );
}
