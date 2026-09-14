import { Suspense } from "react";
import { AdminDataBoundary, AdminDataLoading } from "../../../../components/admin/admin-data-panel";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@website-signal-risk-scanner/ui";
import { MembershipRoleForm, type MembershipRole } from "../../../../components/admin/membership-role-form";
import { OrganizationPlanForm } from "../../../../components/admin/organization-plan-form";
import { PaginationControls, normalizePage, normalizePageSize } from "../../../../components/ui/pagination-controls";
import { formatAdminCompactDateTime } from "../../../../lib/admin/date-time";
import { getAdminMcpActivationFunnel, listAdminUsersPage } from "../../../../server/admin/list-admin-users";
import { normalizeAdminUsersSortDirection, normalizeAdminUsersSortKey } from "../../../../server/admin/admin-users-sort";
import { withServerTiming } from "../../../../server/performance/log-server-timing";
import { updateMembershipRoleFormAction } from "../../../../server/admin/update-membership-role";
import { updateOrganizationPlanFormAction } from "../../../../server/admin/update-organization-plan";
import { deleteAdminUserFormAction } from "../../../../server/admin/delete-user";
import { assignUserWorkspaceFormAction } from "../../../../server/admin/assign-user-workspace";
import { sendUserPasswordResetFormAction } from "../../../../server/admin/send-user-password-reset";
import { createAdminUserFormAction } from "../../../../server/admin/create-user";
import { listCompanies } from "../../../../server/company/repository";
import { DeleteUserButton } from "../../../../components/admin/delete-user-button";
import { AdminSubmitButton } from "../../../../components/admin/admin-submit-button";
import {
  ADMIN_PLAN_LABELS,
  ADMIN_PLAN_STATUSES,
  PLAN_CODES
} from "../../../../lib/admin/plan-options";
import { ASSIGNABLE_MEMBERSHIP_ROLES } from "../../../../lib/auth/membership-role-policy";
import { PendingLink } from "../../../../components/ui/pending-link";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    dir?: string;
    message?: string;
    page?: string;
    perPage?: string;
    sort?: string;
  }>;
};

const SORT_LABELS = {
  access: "Access level",
  activity: "Activity",
  assign: "Assign",
  lastLogin: "Last login",
  lastScan: "Last scan",
  plan: "Plan",
  user: "User"
} as const;

function sortHref(sortKey: keyof typeof SORT_LABELS, currentSort: keyof typeof SORT_LABELS, currentDirection: "asc" | "desc") {
  const defaultDirection = sortKey === "activity" || sortKey === "lastLogin" || sortKey === "lastScan" ? "desc" : "asc";
  const direction = sortKey === currentSort
    ? currentDirection === "asc" ? "desc" : "asc"
    : defaultDirection;
  return `/app/admin/users?${new URLSearchParams({ dir: direction, sort: sortKey }).toString()}`;
}

function occurredAtOrAfter(value: string | null, boundary: string | null) {
  if (!value || !boundary) return false;
  return Date.parse(value) >= Date.parse(boundary);
}

function activationRate(value: number, total: number) {
  return total > 0 ? `${Math.round((value / total) * 100)}%` : "—";
}

function formatActivityLabel(value: string | null) {
  if (!value) return "Activity recorded";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function activityAge(value: string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1_000));
  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
  if (elapsedSeconds < 3_600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86_400) return `${Math.floor(elapsedSeconds / 3_600)}h ago`;
  return `${Math.floor(elapsedSeconds / 86_400)}d ago`;
}

function SortHeader({
  currentDirection,
  currentSort,
  sortKey
}: {
  currentDirection: "asc" | "desc";
  currentSort: keyof typeof SORT_LABELS;
  sortKey: keyof typeof SORT_LABELS;
}) {
  const active = currentSort === sortKey;
  const direction = active ? currentDirection : null;
  const idleContent = (
    <>
      <span>{SORT_LABELS[sortKey]}</span>
      <span aria-hidden="true" className={active ? "text-sky-600" : "text-slate-400"}>{direction === "asc" ? "↑" : direction === "desc" ? "↓" : "↕"}</span>
    </>
  );
  return (
    <PendingLink
      aria-label={`Sort by ${SORT_LABELS[sortKey]}`}
      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
      className="inline-flex items-center gap-1 rounded px-0.5 py-0.5 hover:bg-slate-200/70 hover:text-slate-700"
      href={sortHref(sortKey, currentSort, currentDirection)}
      idleContent={idleContent}
      pendingClassName="cursor-wait opacity-60"
      pendingContent={
        <>
          <span>{SORT_LABELS[sortKey]}</span>
          <span aria-hidden="true" className="animate-pulse text-sky-600">…</span>
        </>
      }
      title={direction ? `${SORT_LABELS[sortKey]}: ${direction === "asc" ? "ascending" : "descending"}` : `Sort by ${SORT_LABELS[sortKey]}`}
    />
  );
}

async function AdminUsersContent({ searchParams }: AdminUsersPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const pageSize = normalizePageSize(resolved.perPage);
  const requestedPage = normalizePage(resolved.page);
  const sortKey = normalizeAdminUsersSortKey(resolved.sort);
  const direction = normalizeAdminUsersSortDirection(resolved.dir);
  const [requestedUserPage, workspaces] = await Promise.all([
    withServerTiming(
      "app.admin.users.list",
      () => listAdminUsersPage(pageSize, (requestedPage - 1) * pageSize, sortKey, direction)
    ),
    withServerTiming("app.admin.users.workspaces", () => listCompanies())
  ]);
  const pageCount = Math.max(1, Math.ceil(requestedUserPage.totalCount / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const userPage = page === requestedPage
    ? requestedUserPage
    : await withServerTiming(
        "app.admin.users.list.normalized",
        () => listAdminUsersPage(pageSize, (page - 1) * pageSize, sortKey, direction)
      );
  const users = userPage.items;
  const passwordResetSent = resolved.message === "password_reset_sent";
  const existingUserWorkspaceCreated = resolved.message === "existing_user_workspace_created";
  const userCreated = resolved.message === "user_created";
  const userAlreadyExists = resolved.message === "user_exists";

  return (
    <div className="space-y-4">
      {passwordResetSent ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">Password reset email sent. The user can use the secure link to choose a new password.</div> : null}
      {userCreated ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">User and workspace created successfully. A welcome email with a secure password setup link was sent.</div> : null}
      {existingUserWorkspaceCreated ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">That account already existed without a workspace. A new workspace was created and a fresh password setup link was sent.</div> : null}
      {userAlreadyExists ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">That user already exists and is assigned to a workspace. Use the existing user row to manage their workspace.</div> : null}

      <Card className="border-slate-200 bg-white">
        <CardHeader><CardTitle>Create user</CardTitle><p className="text-sm text-slate-600">Create a user, automatically assign them a new workspace, and send a secure link to set their password.</p></CardHeader>
        <CardContent>
          <form action={createAdminUserFormAction} className="flex flex-col gap-3 lg:flex-row lg:items-end"><label className="min-w-0 flex-1 text-sm font-medium text-slate-700">Email<input aria-label="Email address" className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" name="email" required type="email" /></label><AdminSubmitButton className="app-raised-button app-raised-button-dark h-10 shrink-0 rounded-lg px-4 text-sm font-semibold text-white" idleContent="Create user and send invite" pendingContent="Creating…" /></form>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle>User And Workspace Admin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 overflow-visible">
        <PaginationControls
          basePath="/app/admin/users"
          itemLabel="users"
          page={page}
          pageCount={pageCount}
          pageSize={pageSize}
          searchParams={{ dir: direction, sort: sortKey }}
          totalCount={userPage.totalCount}
          visibleCount={users.length}
        />
        <div className="overflow-x-auto overflow-y-visible">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap pb-2 pr-4"><SortHeader currentDirection={direction} currentSort={sortKey} sortKey="user" /></th>
                <th className="whitespace-nowrap pb-2 pr-4"><SortHeader currentDirection={direction} currentSort={sortKey} sortKey="lastLogin" /></th>
                <th className="whitespace-nowrap pb-2 pr-4"><SortHeader currentDirection={direction} currentSort={sortKey} sortKey="lastScan" /></th>
                <th className="whitespace-nowrap pb-2 pr-4"><SortHeader currentDirection={direction} currentSort={sortKey} sortKey="activity" /></th>
                <th className="whitespace-nowrap pb-2 pr-4"><SortHeader currentDirection={direction} currentSort={sortKey} sortKey="access" /></th>
                <th className="whitespace-nowrap pb-2 pr-4"><SortHeader currentDirection={direction} currentSort={sortKey} sortKey="assign" /></th>
                <th className="whitespace-nowrap pb-2 pr-4"><SortHeader currentDirection={direction} currentSort={sortKey} sortKey="plan" /></th>
                <th className="whitespace-nowrap pb-2 pl-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 [&_td]:align-top">
              {users.map((user) => {
                const assignmentFormId = `assign-user-${user.id}`;
                const oauthAuthorizedAt = user.lastMcpOAuthAuthorizedAt ?? user.lastMcpConnectorAt;
                const initializedAfterAuthorization = occurredAtOrAfter(user.lastMcpInitializedAt, user.lastMcpOAuthAuthorizedAt);
                const toolsListedAfterAuthorization = occurredAtOrAfter(user.lastMcpToolsListedAt, user.lastMcpOAuthAuthorizedAt);
                const connectorTitle = user.mcpConnectorNames.join(", ");
                const mcpReady = initializedAfterAuthorization && toolsListedAfterAuthorization;
                return (
                  <tr key={user.id}>
                  <td className="py-2.5 pr-4 align-top">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="max-w-[260px] truncate font-medium text-slate-900" title={user.email}>{user.email}</p>
                          <Link
                            aria-label={`View activity for ${user.email}`}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 shadow-[0_2px_0_0_rgb(186,230,253)] transition hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-100 hover:text-sky-800 hover:shadow-[0_3px_0_0_rgb(125,211,252)] active:translate-y-0.5 active:shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                            href={`/app/admin/users/${user.id}/activity`}
                            title="View user activity"
                          >
                            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5V14m5 5.5V9m5 10.5V4m5 15.5V12" />
                            </svg>
                          </Link>
                        </div>
                        <p className="truncate text-xs text-slate-500">{user.organizationName ?? "Unassigned"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-4 align-top text-sm text-slate-600">
                    {formatAdminCompactDateTime(user.lastLoginAt)}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-4 align-top text-sm text-slate-600">
                    {formatAdminCompactDateTime(user.lastScanAt)}
                  </td>
                  <td className="w-[22rem] min-w-[18rem] max-w-[22rem] py-2.5 pr-4 align-top text-sm text-slate-600">
                    <p className="truncate">{user.domainCount} domains <span className="text-slate-300">·</span> {user.totalScans} scans</p>
                    {user.lastProductEventAt ? (
                      <p
                        className="mt-1 truncate text-xs"
                        title={`${formatActivityLabel(user.lastProductEventName)} · ${formatActivityLabel(user.lastProductEventFeature)} · ${formatActivityLabel(user.lastProductEventOutcome)} · ${formatAdminCompactDateTime(user.lastProductEventAt)}`}
                      >
                        <Link className="font-medium text-sky-700 hover:text-sky-900" href={`/app/admin/users/${user.id}/activity`}>
                          Latest: {formatActivityLabel(user.lastProductEventName)}
                        </Link>
                        {user.lastProductEventFeature ? <> <span className="text-slate-300">·</span> {formatActivityLabel(user.lastProductEventFeature)}</> : null}
                        <span className="text-slate-300"> ·</span> {activityAge(user.lastProductEventAt)}
                      </p>
                    ) : null}
                    {oauthAuthorizedAt ? (
                      <p
                        className="mt-0.5 truncate text-xs text-violet-700"
                        title={`${connectorTitle || "MCP"} · OAuth ${formatAdminCompactDateTime(oauthAuthorizedAt)} · ${mcpReady ? "Ready" : "Setup incomplete"}`}
                      >
                        MCP: {user.activeMcpConnectorCount} active {user.activeMcpConnectorCount === 1 ? "connection" : "connections"} <span className="text-violet-300">·</span> {mcpReady ? "ready" : "setup incomplete"} <span className="text-violet-300">·</span> {user.mcpToolInvocationCount === null
                            ? "unavailable"
                            : `${user.mcpToolInvocationCount} ${user.mcpToolInvocationCount === 1 ? "call" : "calls"} / 90d`}
                        {user.lastMcpToolInvocationAt ? <> <span className="text-violet-300">·</span> last {formatAdminCompactDateTime(user.lastMcpToolInvocationAt)}</> : null}
                      </p>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-4 align-top text-slate-600">
                    {user.organizationId ? (
                      <MembershipRoleForm
                        action={updateMembershipRoleFormAction}
                        defaultRole={(user.membershipRole ?? "user") as MembershipRole}
                        organizationId={user.organizationId}
                        userId={user.id}
                      />
                    ) : (
                      <select
                        aria-label={`Access level for ${user.email}`}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900"
                        defaultValue="user"
                        form={assignmentFormId}
                        name="role"
                      >
                        {ASSIGNABLE_MEMBERSHIP_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-4 align-top text-slate-600">
                    {user.organizationId ? (
                      <span className="text-slate-700">{user.organizationName}</span>
                    ) : workspaces.length > 0 ? (
                      <form action={assignUserWorkspaceFormAction} className="flex min-w-56 items-center gap-2" id={assignmentFormId}>
                        <input name="userId" type="hidden" value={user.id} />
                        <label className="sr-only" htmlFor={`workspace-${user.id}`}>Assign workspace for {user.email}</label>
                        <select
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900"
                          defaultValue=""
                          id={`workspace-${user.id}`}
                          name="organizationId"
                          required
                        >
                          <option disabled value="">Assign workspace</option>
                          {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
                        </select>
                        <AdminSubmitButton className="app-raised-button app-raised-button-dark rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white" idleContent="Assign" pendingContent="Assigning…" />
                      </form>
                    ) : <span className="text-slate-500">No workspaces</span>}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-4 align-top">
                    {user.organizationId ? (
                      <OrganizationPlanForm
                        action={updateOrganizationPlanFormAction}
                        defaultPlan={(user.plan ?? "free") as "free" | "individual" | "pro" | "team"}
                        defaultPlanStatus={(user.planStatus ?? "active") as "active" | "trialing" | "past_due" | "paused"}
                        organizationId={user.organizationId}
                      />
                    ) : (
                      <div className="grid items-start gap-1.5 md:grid-cols-[126px_110px]">
                        <label className="sr-only" htmlFor={`plan-${user.id}`}>Plan for the assigned workspace</label>
                        <select
                          className="w-[126px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900"
                          defaultValue=""
                          form={assignmentFormId}
                          id={`plan-${user.id}`}
                          name="plan"
                        >
                          <option value="">Keep workspace plan</option>
                          {PLAN_CODES.map((plan) => <option key={plan} value={plan}>{ADMIN_PLAN_LABELS[plan]}</option>)}
                        </select>
                        <label className="sr-only" htmlFor={`plan-status-${user.id}`}>Plan status for the assigned workspace</label>
                        <select
                          className="w-[110px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900"
                          defaultValue="active"
                          form={assignmentFormId}
                          id={`plan-status-${user.id}`}
                          name="planStatus"
                        >
                          {ADMIN_PLAN_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pl-2 align-top">
                    <div className="flex flex-col items-start gap-3">
                      <form action={sendUserPasswordResetFormAction}>
                        <input name="userId" type="hidden" value={user.id} />
                        <AdminSubmitButton className="text-sm font-medium text-sky-700 underline decoration-sky-200 underline-offset-4 hover:text-sky-900" idleContent="Send reset link" pendingContent="Sending…" />
                      </form>
                      <DeleteUserButton action={deleteAdminUserFormAction} email={user.email} userId={user.id} />
                    </div>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
      </Card>
    </div>
  );
}

async function ActivationFunnel() {
  const mcpActivationFunnel = await withServerTiming("app.admin.users.mcp_activation", () => getAdminMcpActivationFunnel());
  return <Card className="border-violet-200 bg-violet-50/40">
        <CardHeader>
          <CardTitle>Claude activation funnel</CardTitle>
          <p className="text-sm text-slate-600">External users authorized during the last 90 days. Conversion is measured from each user&apos;s first retained authorization.</p>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { baseline: true, label: "OAuth approved", oneHour: mcpActivationFunnel.authorizedUsers, twentyFourHours: mcpActivationFunnel.authorizedUsers },
            { label: "MCP initialized", oneHour: mcpActivationFunnel.initialized1h, twentyFourHours: mcpActivationFunnel.initialized24h },
            { label: "Tools listed", oneHour: mcpActivationFunnel.toolsListed1h, twentyFourHours: mcpActivationFunnel.toolsListed24h },
            { label: "First tool", oneHour: mcpActivationFunnel.firstTool1h, twentyFourHours: mcpActivationFunnel.firstTool24h },
            { label: "Scan requested", oneHour: mcpActivationFunnel.scanRequested1h, twentyFourHours: mcpActivationFunnel.scanRequested24h }
          ].map((stage) => (
            <div className="rounded-lg border border-violet-100 bg-white px-3 py-2" key={stage.label}>
              <p className="text-xs font-semibold text-slate-700">{stage.label}</p>
              {stage.baseline ? (
                <><p className="mt-1 text-lg font-semibold text-slate-950">{stage.twentyFourHours}</p><p className="text-xs text-slate-500">retained cohort</p></>
              ) : (
                <><p className="mt-1 text-lg font-semibold text-slate-950">{stage.twentyFourHours} <span className="text-xs font-medium text-slate-500">{activationRate(stage.twentyFourHours, mcpActivationFunnel.authorizedUsers)} within 24h</span></p><p className="text-xs text-slate-500">{stage.oneHour} within 1h</p></>
              )}
            </div>
          ))}
        </CardContent>
      </Card>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const resolved = searchParams ? await searchParams : {};
  return <div className="space-y-4">
    <AdminDataBoundary key={JSON.stringify(resolved)} label="Users"><Suspense fallback={<AdminDataLoading label="Users" />}>
      <AdminUsersContent searchParams={Promise.resolve(resolved)} />
    </Suspense></AdminDataBoundary>
    <details className="rounded-xl border bg-white p-4"><summary className="cursor-pointer font-semibold">Claude activation funnel</summary>
      <AdminDataBoundary label="Claude activation funnel"><Suspense fallback={<AdminDataLoading label="Claude activation funnel" />}><ActivationFunnel /></Suspense></AdminDataBoundary>
    </details>
  </div>;
}
