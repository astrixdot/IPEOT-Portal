import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  Bell,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  FilePlus2,
  FileText,
  FlaskConical,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Stamp,
  Sun,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "../../lib/theme";
import { approvalQueue, roleMeta, ROLES, useRole } from "../../lib/role";
import { cx } from "../../lib/format";
import { projects } from "../../data/projects";
import { samples } from "../../data/lims";
import { person } from "../../data/org";
import { useMediaQuery } from "../../lib/hooks";
import { Avatar, IdChip } from "../ui/primitives";

type NavItem = { to: string; label: string; icon: LucideIcon; badge?: number; end?: boolean };

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cx("flex h-16 items-center gap-3", collapsed ? "justify-center px-0" : "px-5")}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal to-cyan shadow-[0_6px_18px_-6px_var(--teal)]">
        <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
          <path d="M6 19c3.2-6.5 6.6-6.5 10 0s6.8 6.5 10 0" stroke="#04202a" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M6 12.5c3.2-6.5 6.6-6.5 10 0s6.8 6.5 10 0" stroke="#04202a" strokeOpacity=".45" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </svg>
      </span>
      {!collapsed ? (
        <div className="min-w-0 leading-tight">
          <p className="font-display text-[15px] font-semibold tracking-tight text-white">IPEOT Portal</p>
          <p className="truncate text-[11px] text-navy-mute">ONGC · Panvel</p>
        </div>
      ) : null}
    </div>
  );
}

function NavGroup({ title, items, collapsed, onNavigate }: { title: string; items: NavItem[]; collapsed: boolean; onNavigate?: () => void }) {
  const { hash } = useLocation();
  const hashMatches = (item: NavItem, isActive: boolean) => {
    const [, itemHash] = item.to.split("#");
    return isActive && (itemHash ? hash === `#${itemHash}` : !(item.to === "/workspace" && hash === "#ai"));
  };
  return (
    <div>
      {!collapsed ? <p className="px-5 pb-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-navy-mute uppercase">{title}</p> : <div className="mx-auto mb-2 h-px w-6 bg-white/10" />}
      <ul className="space-y-0.5 px-3">
        {items.map((item) => (
          <li key={item.label}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cx(
                  "group relative flex h-10 items-center gap-3 rounded-lg text-[13.5px] font-medium transition-colors duration-150",
                  collapsed ? "justify-center px-0" : "px-3",
                  hashMatches(item, isActive) ? "bg-white/[0.08] text-white" : "text-navy-ink/75 hover:bg-white/[0.05] hover:text-white",
                )
              }
            >
              {({ isActive: routeActive }) => {
                const isActive = hashMatches(item, routeActive);
                return (
                <>
                  {isActive ? <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-teal" aria-hidden /> : null}
                  <item.icon className={cx("size-[18px] shrink-0", isActive ? "text-teal" : "text-navy-mute group-hover:text-navy-ink")} aria-hidden />
                  {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                  {item.badge ? (
                    <span
                      className={cx(
                        "grid h-5 min-w-5 place-items-center rounded-full bg-orange px-1.5 text-[11px] font-bold text-white tabular dark:text-navy",
                        collapsed ? "absolute top-1 right-1 h-4 min-w-4 px-1 text-[10px]" : "ml-auto",
                      )}
                    >
                      {item.badge}
                      <span className="sr-only"> pending</span>
                    </span>
                  ) : null}
                </>
                );
              }}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Sidebar({ collapsed, onToggle, mobile, onClose }: { collapsed: boolean; onToggle: () => void; mobile?: boolean; onClose?: () => void }) {
  const { role } = useRole();
  const pending = approvalQueue(role, projects).length;
  const dashboards: NavItem[] = [
    { to: "/", label: "MIS Dashboard", icon: LayoutDashboard, end: true },
    { to: "/workspace", label: "CI Workspace", icon: FolderKanban },
    { to: "/lims", label: "LIMS", icon: FlaskConical },
  ];
  const modules: NavItem[] = [
    { to: "/proposals", label: "Proposals", icon: FilePlus2 },
    { to: "/approvals", label: "Approvals", icon: Stamp, badge: pending },
    { to: "/projects", label: "Projects", icon: FolderKanban },
    { to: "/reports", label: "Reports", icon: FileText },
    { to: "/knowledge", label: "Knowledge Base", icon: BookOpen },
    { to: "/workspace#ai", label: "AI Assistant", icon: Sparkles },
    { to: "/admin", label: "Admin", icon: Settings },
  ];
  return (
    <nav
      aria-label="Main"
      className={cx(
        "flex h-full flex-col bg-navy transition-[width] duration-200 ease-out",
        mobile ? "w-72" : collapsed ? "w-[76px]" : "w-64",
      )}
      style={{ backgroundImage: "radial-gradient(120% 60% at 0% 0%, rgb(45 212 191 / 0.10), transparent 60%)" }}
    >
      <div className="flex items-center justify-between">
        <Brand collapsed={collapsed && !mobile} />
        {mobile ? (
          <button type="button" onClick={onClose} className="mr-3 rounded-lg p-2 text-navy-mute hover:bg-white/5 hover:text-white" aria-label="Close navigation">
            <X className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto py-4 scroll-thin">
        <NavGroup title="Dashboards" items={dashboards} collapsed={collapsed && !mobile} onNavigate={onClose} />
        <NavGroup title="Modules" items={modules} collapsed={collapsed && !mobile} onNavigate={onClose} />
      </div>
      {!mobile ? (
        <button
          type="button"
          onClick={onToggle}
          className={cx("m-3 flex h-10 items-center gap-2 rounded-lg text-[13px] text-navy-mute transition-colors hover:bg-white/5 hover:text-white", collapsed ? "justify-center" : "px-3")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronsRight className="size-4" aria-hidden /> : <ChevronsLeft className="size-4" aria-hidden />}
          {!collapsed ? "Collapse" : null}
        </button>
      ) : null}
    </nav>
  );
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const { open, setOpen, ref } = usePopover();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const projectHits = projects
      .filter((p) => [p.title, p.wbs ?? "", p.proposalNo, p.workCentre, p.accession ?? ""].some((field) => field.toLowerCase().includes(q)))
      .slice(0, 5)
      .map((p) => ({ id: p.id, label: p.title, code: p.wbs ?? p.proposalNo, meta: p.workCentre, to: `/projects?q=${encodeURIComponent(p.wbs ?? p.proposalNo)}` }));
    const sampleHits = samples
      .filter((s) => [s.id, s.test, s.standard].some((field) => field.toLowerCase().includes(q)))
      .slice(0, 3)
      .map((s) => ({ id: s.id, label: s.test, code: s.id, meta: s.standard, to: `/lims?q=${encodeURIComponent(s.id)}` }));
    return [...projectHits, ...sampleHits];
  }, [query]);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <label className="relative block">
        <span className="sr-only">Search projects, WBS numbers, and samples</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search projects, WBS, samples…"
          className="h-10 w-full rounded-xl border border-line bg-surface-2 pr-14 pl-9 text-sm text-ink placeholder:text-ink-3 transition-colors hover:border-line-strong focus-visible:border-cyan focus-visible:bg-surface"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="global-search-results"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 font-mono text-[10.5px] text-ink-3 sm:block">⌘K</kbd>
      </label>
      {open && query.trim().length >= 2 ? (
        <div id="global-search-results" role="listbox" className="pop absolute top-12 right-0 left-0 z-50 overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-3">No project or sample matches “{query}”.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1.5 scroll-thin">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-2"
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                      navigate(result.to);
                    }}
                  >
                    <IdChip className="shrink-0">{result.code}</IdChip>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{result.label}</span>
                      <span className="block truncate text-xs text-ink-3">{result.meta}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

const notifications = [
  { id: 1, title: "TAC meeting scheduled for 14 Dec 2026", detail: "5 scheduled proposals on the agenda.", time: "35 min", unread: true, tone: "bg-teal" },
  { id: 2, title: "Hydraulic fracturing proposal overdue at TAC", detail: "34 days past the 21-day target.", time: "2 h", unread: true, tone: "bg-red" },
  { id: 3, title: "WBS released in SAP PS", detail: "Offshore wind resource assessment, Gulf of Khambhat, is initiated.", time: "4 h", unread: true, tone: "bg-cyan" },
  { id: 4, title: "Report published: Matrix acidising review", detail: "Accession IPEOT/ACC/2026/0064 sent to Bassein & Satellite Asset.", time: "1 d", unread: false, tone: "bg-green" },
  { id: 5, title: "Calibration due: Ion Chromatograph IC-01", detail: "Due 21 Nov 2026.", time: "1 d", unread: false, tone: "bg-amber" },
];

function Notifications() {
  const { open, setOpen, ref } = usePopover();
  const [read, setRead] = useState(false);
  const unread = read ? 0 : notifications.filter((item) => item.unread).length;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative grid size-10 place-items-center rounded-xl text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
      >
        <Bell className="size-5" aria-hidden />
        {unread ? <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-orange px-1 text-[10px] font-bold text-white ring-2 ring-surface dark:text-navy">{unread}</span> : null}
      </button>
      {open ? (
        <div className="pop absolute top-12 right-0 z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-display text-sm font-semibold text-ink">Notifications</p>
            <button type="button" className="text-xs font-medium text-cyan-ink hover:underline" onClick={() => setRead(true)}>
              Mark all read
            </button>
          </div>
          <ul className="max-h-96 overflow-y-auto scroll-thin">
            {notifications.map((item) => (
              <li key={item.id} className="flex gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-surface-2">
                <span className={cx("mt-1.5 size-2 shrink-0 rounded-full", item.unread && !read ? item.tone : "bg-surface-3")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-0.5 text-xs text-ink-3">{item.detail}</p>
                </div>
                <span className="shrink-0 text-[11px] text-ink-3">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function UserMenu() {
  const { pathname } = useLocation();
  const { role, setRole } = useRole();
  const { open, setOpen, ref } = usePopover();
  const persona = pathname.startsWith("/workspace")
    ? { user: person("ci1")!, label: "Chief Investigator" }
    : pathname.startsWith("/lims")
      ? { user: person("lab1")!, label: "Lab In-charge" }
      : { user: roleMeta(role).user, label: roleMeta(role).label };
  const scoped = !pathname.startsWith("/workspace") && !pathname.startsWith("/lims");
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2.5 rounded-xl py-1 pr-2 pl-1 transition-colors hover:bg-surface-2" aria-expanded={open} aria-label={`Account: ${persona.user.name}, ${persona.label}`}>
        <Avatar name={persona.user.name} />
        <span className="hidden min-w-0 text-left leading-tight md:block">
          <span className="block max-w-40 truncate text-[13px] font-semibold text-ink">{persona.user.name}</span>
          <span className="block text-[11.5px] text-ink-3">{persona.label}</span>
        </span>
      </button>
      {open ? (
        <div className="pop absolute top-12 right-0 z-50 w-72 overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Avatar name={persona.user.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{persona.user.name}</p>
              <p className="truncate text-xs text-ink-3">{persona.user.designation}</p>
              <p className="mt-0.5 font-mono text-[11px] text-ink-3">CPF {persona.user.cpf}</p>
            </div>
          </div>
          {scoped ? (
            <div className="px-2 py-2">
              <p className="px-2 pb-1 text-[11px] font-semibold tracking-[0.08em] text-ink-3 uppercase">View as</p>
              {ROLES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setRole(item.key);
                    setOpen(false);
                  }}
                  className={cx("flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-2", role === item.key ? "text-ink" : "text-ink-2")}
                >
                  <UserRound className={cx("size-4", role === item.key ? "text-teal" : "text-ink-3")} aria-hidden />
                  <span className="font-medium">{item.label}</span>
                  <span className="ml-auto truncate text-xs text-ink-3">{person(item.person)?.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-4 py-3 text-xs text-ink-3">This workspace is personal to the signed-in {persona.label.toLowerCase()}.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AppShell() {
  const { theme, toggle } = useTheme();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 1024px) and (max-width: 1279px)");
  const [collapsed, setCollapsed] = useState(isTablet);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => setCollapsed(isTablet), [isTablet]);
  useEffect(() => {
    if (hash) {
      window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [pathname, hash]);

  return (
    <div className="flex min-h-screen">
      <a href="#main" className="sr-only z-[80] rounded-lg bg-surface px-3 py-2 text-sm font-semibold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      {isDesktop ? (
        <div className="no-print sticky top-0 h-screen shrink-0">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>
      ) : mobileOpen ? (
        <div className="no-print fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-navy/50 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="slide-in absolute inset-y-0 left-0">
            <Sidebar collapsed={false} onToggle={() => {}} mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-line bg-surface/85 px-3 backdrop-blur-md sm:gap-3 sm:px-6">
          {!isDesktop ? (
            <button type="button" onClick={() => setMobileOpen(true)} className="grid size-10 shrink-0 place-items-center rounded-xl text-ink-2 hover:bg-surface-2" aria-label="Open navigation">
              <Menu className="size-5" aria-hidden />
            </button>
          ) : null}
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggle}
              className="grid size-10 place-items-center rounded-xl text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
            </button>
            <Notifications />
            <div className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
            <UserMenu />
          </div>
        </header>
        <main id="main" className="print-full mx-auto w-full max-w-[1520px] flex-1 px-3 py-5 sm:px-6 sm:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
