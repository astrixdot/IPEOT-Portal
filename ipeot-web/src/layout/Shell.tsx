import { NavLink, Outlet, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { can } from "../access";
import { useSession } from "../auth";
import type { SessionUser } from "../types";

type NavItem = { to: string; label: string; permission?: string };

const workLinks: NavItem[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/inbox", label: "Inbox", permission: "workflow.act" },
  { to: "/proposals", label: "Proposals", permission: "proposals.read" },
  { to: "/awp", label: "Annual programme", permission: "awp.read" },
  { to: "/projects", label: "Projects", permission: "projects.read" },
];

const adminLinks: NavItem[] = [
  { to: "/admin/masters", label: "Masters", permission: "admin.masters.read" },
  { to: "/admin/users", label: "Users", permission: "admin.users.read" },
  { to: "/admin/workflow", label: "Workflow", permission: "admin.matrix.read" },
  { to: "/admin/audit", label: "Audit", permission: "admin.audit.read" },
];

function visible(user: SessionUser, links: NavItem[]) {
  return links.filter((link) => !link.permission || can(user, link.permission));
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function MenuLink({ to, label, badge }: { to: string; label: string; badge?: number }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-full px-3 py-2 text-sm md:w-full md:shrink ${
          isActive ? "bg-ink text-paper" : "text-mute hover:bg-canvas hover:text-ink"
        }`
      }
    >
      <span>{label}</span>
      {badge ? (
        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-paper">{badge}</span>
      ) : null}
    </NavLink>
  );
}

export function Shell() {
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = session.data?.user;
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<{ data: { myPendingTasks: number } }>("/api/crud/v1/dashboard"),
  });
  if (!user) return null;
  const work = visible(user, workLinks);
  const admin = visible(user, adminLinks);
  const pending = dashboard.data?.data.myPendingTasks || 0;

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-canvas md:flex">
      <aside className="border-b border-line bg-paper md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-5 md:py-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-[11px] font-semibold tracking-wide text-paper">IP</span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-ink">IPEOT</p>
              <p className="text-[11px] text-mute">ONGC workflow</p>
            </div>
          </div>
          <button type="button" className="text-xs text-mute md:hidden" onClick={() => void logout()}>Sign out</button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:flex-1 md:space-y-6 md:overflow-y-auto md:px-3 md:pb-4">
          <div className="flex gap-1 md:block md:space-y-0.5">
            <p className="hidden px-3 pb-2 text-[11px] font-medium tracking-[0.14em] text-mute md:block">WORK</p>
            {work.map((link) => (
              <MenuLink key={link.to} to={link.to} label={link.label} badge={link.to === "/inbox" ? pending : undefined} />
            ))}
          </div>
          {admin.length > 0 ? (
            <div className="flex gap-1 md:block md:space-y-0.5">
              <p className="hidden px-3 pb-2 text-[11px] font-medium tracking-[0.14em] text-mute md:block">ADMIN</p>
              {admin.map((link) => (
                <MenuLink key={link.to} to={link.to} label={link.label} />
              ))}
            </div>
          ) : null}
        </nav>
        <div className="hidden border-t border-line px-4 py-4 md:block">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{initials(user.name)}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{user.name}</p>
              <p className="text-[11px] text-mute">CPF {user.cpf}</p>
            </div>
          </div>
          <button type="button" className="mt-3 text-xs text-mute hover:text-ink" onClick={() => void logout()}>Sign out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}
