import { Navigate, Outlet } from "react-router";
import { useSession } from "./auth";

export function RequireAuth() {
  const session = useSession();
  if (session.isLoading) {
    return <p className="p-8 text-sm text-slate-500">Opening the portal…</p>;
  }
  if (!session.data?.user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
