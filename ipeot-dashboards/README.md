# IPEOT Unified Workflow Portal — dashboard prototype

Clickable prototype of three role-based dashboards for the AI-Powered Unified Workflow Portal of the Institute of Production Engineering & Ocean Technology (IPEOT), ONGC, Panvel. All data is mock and generated deterministically in the browser. No backend is needed.

| Route | Dashboard | Persona |
| --- | --- | --- |
| `/` | Management & MIS | HOI, HOD, I/C, PCC (switch with the role control) |
| `/workspace` | Chief Investigator workspace (`/workspace#ai` opens the AI Report Assistant) | Dr. Meenakshi Raghavan, CCSM |
| `/lims` | Laboratory (LIMS) | Dr. Sameer Kulkarni, Lab In-charge |
| `/approvals` | Mobile-first approval queue and proposal tracker | Follows the selected role |
| `/projects` | Searchable project register | Follows the selected role |

## Run

Requires Node.js 20 or later.

```bash
cd ipeot-dashboards
npm install
npm run dev          # http://localhost:5180
```

Other scripts:

```bash
npm run typecheck    # tsc --noEmit
npm run build        # type-check and production build to dist/
npm run preview      # serve dist/ on http://localhost:5180
```

The "current date" is fixed at 19 Nov 2026 (FY 2026-27), so overdue counts and calendars always render the same way.

## What to try

- **MIS**: switch the role between HOI, HOD, I/C and PCC to rescope every number. Filter by department, work centre, category and FY. Click any KPI, pipeline stage, donut segment or department bar to open a drill-down drawer. Use "Send reminder" on an overdue item, "Retry sync" on the SAP error banner, and Export Excel (CSV) or Export PDF (print layout). Pick a filter combination with no matches to see the empty state.
- **CI workspace**: select a project card to drive the schedule, ISO, LIMS and report panels. Open "Request time extension", work through the pending-actions inbox, and submit the report to I/C. In the AI Report Assistant, choose "Draft Section 3 from LIMS results", then Accept, Edit or Discard the draft.
- **LIMS**: Register sample opens a QR label automatically. Also try Assign test and Print QR label. To see the error banner, import an instrument file for UTM-01 (under maintenance). Click lifecycle columns or ID chips to filter the queue, sort the queue columns, approve or return results, and raise a reorder indent.
- **Global**: press ⌘K / Ctrl+K to search projects, WBS numbers and sample IDs. The theme toggle sits in the top bar, the sidebar collapses on desktop and slides in on mobile.

## Structure

```
src/
  data/        org, projects (52), CI workspace, LIMS samples (44), instruments, consumables
  lib/         analytics (KPIs, pipeline, turnaround, workload), role scoping, theme, toasts, hooks, formatting
  components/
    ui/        KPICard, StatusBadge, Stepper, DataTable, ChartCard, Drawer/Modal, primitives
    layout/    AppShell (sidebar, top bar, search, notifications, role menu)
    AIPanel.tsx, ProjectRow.tsx, QrCode.tsx
  pages/       ManagementDashboard, CIWorkspace, LimsDashboard, ApprovalsPage, ProjectsPage, ModulePage
```

## Design notes

- **Palette**: navy base (`#0a2540`) for the sidebar and primary actions, with teal and cyan accents. Amber and orange signal warnings, and red is reserved for critical items such as breaches over 14 days, failed syncs and late milestones. Category colours never change: Scheduled is teal, Unscheduled is indigo, Short-term is amber. Each category badge also carries an icon (calendar, bolt, timer), so colour is never the only cue. Light and dark themes share the same semantic tokens in `src/index.css`. Text and background pairs meet WCAG AA in both themes.
- **Type**: Space Grotesk for headings and KPI numbers, Inter for UI text, JetBrains Mono for WBS numbers, sample IDs and accession numbers. All fonts are self-hosted via Fontsource.
- **Layout**: 12-column grid, cards with 14px radius, and a sticky top bar. Tables hide secondary columns on small screens. Long horizontal strips (pipeline, lifecycle, stepper) scroll with snap on phones.
- **Motion**: staggered card reveals, KPI count-up, 300 ms chart transitions and skeleton loaders. All of it is disabled under `prefers-reduced-motion`.
- **Accessibility**: visible focus rings, skip link, focus-trapped dialogs with Esc to close, `aria-sort` on sortable tables, and radio-group semantics on segmented controls. Status always pairs an icon and a text label with its colour, and deltas carry a screen-reader "improving/worsening" label.
