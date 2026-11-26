import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { BookOpen, FilePlus2, FileText, Settings, Compass } from "lucide-react";
import { ThemeProvider } from "./lib/theme";
import { ToastProvider } from "./lib/toast";
import { RoleProvider } from "./lib/role";
import { AppShell } from "./components/layout/AppShell";
import { ModulePage } from "./pages/ModulePage";
import { Skeleton } from "./components/ui/primitives";

const ManagementDashboard = lazy(() => import("./pages/ManagementDashboard").then((m) => ({ default: m.ManagementDashboard })));
const CIWorkspace = lazy(() => import("./pages/CIWorkspace").then((m) => ({ default: m.CIWorkspace })));
const LimsDashboard = lazy(() => import("./pages/LimsDashboard").then((m) => ({ default: m.LimsDashboard })));
const ApprovalsPage = lazy(() => import("./pages/ApprovalsPage").then((m) => ({ default: m.ApprovalsPage })));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage").then((m) => ({ default: m.ProjectsPage })));

function PageFallback() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading page">
      <Skeleton className="h-16 w-80 max-w-full" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <Skeleton key={key} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

const page = (node: ReactNode) => <Suspense fallback={<PageFallback />}>{node}</Suspense>;

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <RoleProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={page(<ManagementDashboard />)} />
                <Route path="workspace" element={page(<CIWorkspace />)} />
                <Route path="lims" element={page(<LimsDashboard />)} />
                <Route path="approvals" element={page(<ApprovalsPage />)} />
                <Route path="projects" element={page(<ProjectsPage />)} />
                <Route
                  path="proposals"
                  element={
                    <ModulePage
                      eyebrow="Proposals"
                      title="Proposals"
                      description="Create and track scheduled, unscheduled and short-term proposals."
                      icon={FilePlus2}
                      emptyTitle="Proposal forms live in the main portal"
                      emptyText="This prototype covers the three dashboards. Proposal entry, routing and attachments are handled by the IPEOT portal workflow."
                    />
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ModulePage
                      eyebrow="Reports"
                      title="Reports"
                      description="Technical reports through I/C, HOD and HOI approval to publication."
                      icon={FileText}
                      emptyTitle="Report authoring is not part of this prototype"
                      emptyText="Report approval status is shown in the CI workspace and the MIS pipeline."
                    />
                  }
                />
                <Route
                  path="knowledge"
                  element={
                    <ModulePage
                      eyebrow="Knowledge Base"
                      title="Knowledge Base"
                      description="Published IPEOT reports, searchable by accession number, department and keyword."
                      icon={BookOpen}
                      emptyTitle="Knowledge Base search is coming in Phase 2"
                      emptyText="Similar past projects already appear in the AI Report Assistant inside the CI workspace."
                    />
                  }
                />
                <Route
                  path="admin"
                  element={
                    <ModulePage
                      eyebrow="Admin"
                      title="Administration"
                      description="Users, roles, departments, work centres and routing rules."
                      icon={Settings}
                      emptyTitle="Admin masters are managed in the main portal"
                      emptyText="Stakeholders, routing rules and role assignments are maintained in the IPEOT portal’s masters screens."
                    />
                  }
                />
                <Route
                  path="*"
                  element={<ModulePage eyebrow="Not found" title="Page not found" description="The address you opened doesn’t match a page in this portal." icon={Compass} emptyTitle="Nothing at this address" emptyText="Use the sidebar or global search to find a project, sample or dashboard." />}
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </RoleProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
