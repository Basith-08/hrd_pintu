import { computed } from "vue"
import { useRouter } from "#imports"

import { useLocale } from "@/composables/useLocale"
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel"

type DashboardFact = {
  label: string
  value: string
}

type DashboardApplicationCard = {
  id: string
  href: string
  erfLabel: string
  title: string
  formStatus: string
  formStatusLabel: string
  applicationStatus: string
  applicationStatusLabel: string
  actionLabel: string
  updatedLabel: string
  submittedLabel: string | null
}

export function useDashboardPage() {
  const router = useRouter()
  const { logout, user } = useAuthViewModel()
  const { formatDateTime, text } = useLocale()

  const applications = computed(() => user.value?.applications ?? [])
  const isEmployeeWorkspace = computed(() => user.value?.role === "employee")
  const workspaceEyebrow = computed(() =>
    isEmployeeWorkspace.value
      ? text("dashboard.workspace.employee")
      : text("dashboard.workspace.candidate"),
  )
  const workspaceDescription = computed(() =>
    isEmployeeWorkspace.value
      ? text("dashboard.workspace.employeeDescription")
      : text("dashboard.workspace.candidateDescription"),
  )
  const greetingTitle = computed(() => {
    const fullName = displayValue(user.value?.full_name, "")

    if (fullName) {
      return text("dashboard.greeting.named", { name: fullName })
    }

    return isEmployeeWorkspace.value
      ? text("dashboard.greeting.employee")
      : text("dashboard.greeting.candidate")
  })
  const summaryTitle = computed(() =>
    isEmployeeWorkspace.value
      ? text("dashboard.profile.employeeSummary")
      : text("dashboard.profile.candidateSummary"),
  )
  const normalizedStatus = computed(() => normalizeStatus(user.value?.status, "active"))
  const statusLabel = computed(() => getAccountStatusLabel(normalizedStatus.value, text))
  const summaryFacts = computed<DashboardFact[]>(() => [
    {
      label: text("common.email"),
      value: displayValue(user.value?.email),
    },
    {
      label: text("common.name"),
      value: displayValue(user.value?.full_name),
    },
    {
      label: text("common.phone"),
      value: displayValue(user.value?.phone),
    },
    {
      label: text("dashboard.profile.lastLogin"),
      value: formatDate(user.value?.last_login_at, formatDateTime),
    },
  ])
  const applicationCards = computed<DashboardApplicationCard[]>(() =>
    applications.value.map((application) => {
      const formStatus = normalizeStatus(application.form_completion_status, "in_progress")
      const applicationStatus = isEmployeeWorkspace.value
        ? application.form_submitted_at
          ? "submitted"
          : "draft"
        : normalizeStatus(application.status, "draft")
      const submittedAt = isEmployeeWorkspace.value
        ? application.form_submitted_at
        : application.submitted_at

      return {
        id: application.id,
        href: `/applications/${application.id}/form`,
        erfLabel: `ERF ${application.erf_id}`,
        title: readJobLabel(application.job_snapshot, "main_position"),
        formStatus,
        formStatusLabel: getFormStatusLabel(formStatus, text),
        applicationStatus,
        applicationStatusLabel: getApplicationStatusLabel(applicationStatus, text),
        actionLabel:
          applicationStatus === "submitted"
            ? text("dashboard.applications.actions.viewForm")
            : isEmployeeWorkspace.value
              ? text("dashboard.applications.actions.continueEmployeeForm")
              : text("dashboard.applications.actions.continueCandidateForm"),
        updatedLabel: `${text("common.updated")} ${formatDate(
          application.form_updated_at || application.created_at,
          formatDateTime,
        )}`,
        submittedLabel: submittedAt
          ? `${text("status.submitted")} ${formatDate(submittedAt, formatDateTime)}`
          : null,
      }
    }),
  )

  async function handleLogout() {
    await logout()
    await router.push("/login")
  }

  return {
    applicationCards,
    applications,
    greetingTitle,
    handleLogout,
    normalizedStatus,
    statusLabel,
    summaryFacts,
    summaryTitle,
    workspaceDescription,
    workspaceEyebrow,
  }
}

function normalizeStatus(value: unknown, fallback: string) {
  return String(value ?? fallback).trim().toLowerCase() || fallback
}

function getAccountStatusLabel(
  normalizedStatus: string,
  text: (key: string, replacements?: Record<string, string | number>) => string,
) {
  if (normalizedStatus === "inactive") {
    return text("status.inactive")
  }

  if (normalizedStatus === "revoked") {
    return text("status.revoked")
  }

  return text("status.active")
}

function getFormStatusLabel(
  normalizedStatus: string,
  text: (key: string, replacements?: Record<string, string | number>) => string,
) {
  return normalizedStatus === "completed" || normalizedStatus === "employee_draf_contract"
    ? text("status.completed")
    : text("status.inProgress")
}

function getApplicationStatusLabel(
  normalizedStatus: string,
  text: (key: string, replacements?: Record<string, string | number>) => string,
) {
  return normalizedStatus === "submitted"
    ? text("status.submitted")
    : text("status.draft")
}

function readJobLabel(snapshot: Record<string, unknown> | null | undefined, key: string) {
  const value = snapshot?.[key]
  return typeof value === "string" && value.trim() ? value : "-"
}

function formatDate(
  value: string | null | undefined,
  formatDateTime: (value: string | null | undefined) => string,
) {
  return formatDateTime(value)
}

function displayValue(value: unknown, fallback = "-") {
  return String(value ?? "").trim() || fallback
}
