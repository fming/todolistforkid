import AdminNav from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-8">
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Summer Learning Admin
            </h1>
            <p className="mt-2 text-slate-600">
              Manage daily plans, templates and history.
            </p>
          </div>
          <a
            href="/"
            className="text-sm text-slate-500 underline hover:text-slate-800"
          >
            Kid view →
          </a>
        </div>

        <AdminNav />

        {children}
      </div>
    </main>
  );
}
