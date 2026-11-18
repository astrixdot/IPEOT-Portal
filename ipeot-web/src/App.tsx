import { Navigate, RouterProvider, createBrowserRouter } from "react-router";
import { RequireAuth } from "./RequireAuth";
import { Shell } from "./layout/Shell";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AwpPage, InboxPage, ProjectsPage } from "./pages/Lists";
import { AdminMastersPage } from "./pages/AdminMastersPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { MatrixPage } from "./pages/MatrixPage";
import { AuditPage } from "./pages/AuditPage";
import { ProposalsPage } from "./pages/ProposalsPage";
import { NewProposalPage } from "./pages/NewProposalPage";
import { ProposalDetailPage } from "./pages/ProposalDetailPage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <RequireAuth />,
    children: [
      {
        element: <Shell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "awp", element: <AwpPage /> },
          { path: "inbox", element: <InboxPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "proposals", element: <ProposalsPage /> },
          { path: "proposals/new", element: <NewProposalPage /> },
          { path: "proposals/:id", element: <ProposalDetailPage /> },
          { path: "admin/masters", element: <AdminMastersPage /> },
          { path: "admin/users", element: <AdminUsersPage /> },
          { path: "admin/workflow", element: <MatrixPage /> },
          { path: "admin/audit", element: <AuditPage /> },
        ],
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
