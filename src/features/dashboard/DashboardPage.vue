<template>
  <section class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">{{ workspaceEyebrow }}</p>
        <h1>{{ greetingTitle }}</h1>
        <p class="summary">{{ workspaceDescription }}</p>
      </div>
      <div class="hero__actions">
        <NuxtLink class="secondary-button hero-link" to="/profile">
          {{ text("profile.actions.openAccount") }}
        </NuxtLink>
        <AppButton class="logout-button" type="button" variant="primary" @click="handleLogout">
          {{ text("common.actions.logout") }}
        </AppButton>
      </div>
    </header>

    <section class="panel panel--tip">
      <span class="tip-icon" aria-hidden="true">i</span>
      <div class="tip-content">
        <p class="tip-title">{{ text("dashboard.tip.title") }}</p>
        <p class="tip-message">{{ text("dashboard.tip.message") }}</p>
      </div>
    </section>

    <section class="panel panel--summary">
      <div class="panel__header">
        <div>
          <h2>{{ summaryTitle }}</h2>
        </div>
        <span class="status-pill" :data-status="normalizedStatus">{{ statusLabel }}</span>
      </div>

      <dl class="facts">
        <div v-for="fact in summaryFacts" :key="fact.label">
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </div>
      </dl>
    </section>

    <section class="panel panel--applications">
      <div class="panel__header">
        <div>
          <p class="panel__eyebrow">{{ text("dashboard.applications.eyebrow") }}</p>
          <h2>{{ text("dashboard.applications.title") }}</h2>
        </div>
        <span class="count-pill">{{ applications.length }} {{ text("dashboard.applications.countLabel") }}</span>
      </div>

      <div v-if="applications.length === 0" class="empty-state">
        {{ text("dashboard.applications.empty") }}
      </div>

      <div v-else class="application-grid">
        <article v-for="application in applicationCards" :key="application.id" class="application-card">
          <!-- <p class="application-card__eyebrow">{{ application.erfLabel }}</p> -->
          <h3>{{ application.title }}</h3>
          <div class="application-card__progress">
            <span class="status-pill" :data-status="application.formStatus">
              {{ application.formStatusLabel }}
            </span>
          </div>
          <div class="application-card__footer">
            <span class="status-pill" :data-status="application.applicationStatus">
              {{ application.applicationStatusLabel }}
            </span>
            <NuxtLink class="application-link" :to="application.href">{{ application.actionLabel }}</NuxtLink>
          </div>
          <div class="application-card__meta">
            <span>{{ application.updatedLabel }}</span>
            <span v-if="application.submittedLabel">{{ application.submittedLabel }}</span>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import AppButton from "@/components/AppButton.vue"
import { useLocale } from "@/composables/useLocale"
import { useDashboardPage } from "@/features/dashboard/useDashboardPage"

const { text } = useLocale()
const {
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
} = useDashboardPage()
</script>

<style scoped>
.page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero,
.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--panel-gradient), var(--surface);
  backdrop-filter: blur(14px);
  box-shadow: var(--shadow-panel);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 2rem;
  align-items: flex-end;
}

.eyebrow,
.panel__eyebrow,
.application-card__eyebrow {
  margin: 0 0 0.4rem;
  color: var(--brand-dark);
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow-soft);
  font-size: var(--text-pill);
}

.hero h1,
.panel h2,
.application-card h3 {
  margin: 0;
}

.summary {
  margin: 1rem 0 0;
  max-width: 54ch;
  color: var(--muted);
  line-height: var(--leading-summary-compact);
}

.hero__actions {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hero-link {
  border-radius: var(--radius-pill);
  padding: 0.85rem 1.15rem;
  font-weight: 600;
}

.logout-button {
  border-radius: var(--radius-pill);
  padding: 0.85rem 1.15rem;
  font-weight: 600;
}

.panel {
  padding: 1.5rem;
}

.panel--tip {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1.1rem 1.5rem;
  border-color: var(--warning-border-soft);
  overflow: hidden;
}

.panel--tip::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--warning);
}

.tip-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--warning-soft);
  color: var(--warning-text);
  font-weight: 700;
  font-style: italic;
  font-size: var(--text-body-sm);
}

.tip-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.tip-title {
  margin: 0;
  font-weight: 700;
  color: var(--warning-text);
  font-size: var(--text-body-sm);
}

.tip-message {
  margin: 0;
  color: var(--muted);
  line-height: var(--leading-summary-compact);
}

.panel--applications {
  padding-top: 1.35rem;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.facts {
  margin: 1.5rem 0 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.facts div,
.application-card {
  border-radius: var(--radius-card);
  border: 1px solid var(--line-softer);
  background: var(--surface-overlay);
  padding: 1rem;
}

.facts div {
  position: relative;
  overflow: hidden;
}

.facts div::before,
.application-card::before {
  content: "";
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 3px;
  background: var(--progress-gradient);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}

.application-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-height: 13rem;
  padding: 1.35rem;
  box-shadow: 0 2px 10px rgb(18 63 70 / 0.05);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.application-card:hover {
  transform: translateY(-3px);
  border-color: var(--brand-border);
  box-shadow: var(--shadow-panel-hover-strong);
}

.application-card h3 {
  font-size: var(--text-heading-sm);
  font-weight: 700;
  color: var(--text-strong);
  line-height: var(--leading-comfortable);
}

.facts dt {
  color: var(--muted);
  font-size: var(--text-caption);
}

.facts dd {
  margin: 0.45rem 0 0;
  font-weight: 700;
}

.application-grid {
  margin-top: 1.25rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.application-card p {
  margin: 0.35rem 0 0;
  color: var(--muted);
}

.application-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  font-size: var(--text-body-sm);
}

.application-card__progress,
.application-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.application-card__meta {
  margin-top: auto;
  padding-top: 0.65rem;
  border-top: 1px dashed var(--line-softer);
  color: var(--muted);
  font-size: var(--text-caption);
}

.application-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: var(--radius-pill);
  background: var(--brand-soft);
  color: var(--brand-dark);
  padding: 0.65rem 1rem;
  font-weight: 700;
  white-space: nowrap;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.application-link::after {
  content: "\2192";
  font-weight: 700;
  transition: transform 0.18s ease;
}

.application-link:hover {
  background: var(--brand-hover);
}

.application-link:hover::after {
  transform: translateX(2px);
}

.status-pill[data-status="in_progress"] {
  background: var(--brand-soft);
  color: var(--brand-dark);
}

.status-pill[data-status="draft"] {
  background: var(--neutral-soft);
  color: var(--muted);
}

.status-pill[data-status="submitted"],
.status-pill[data-status="completed"] {
  background: var(--success-soft);
  color: var(--success-text);
}

.status-pill,
.count-pill {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-pill);
  padding: 0.4rem 0.75rem;
  font-size: var(--text-caption);
  font-weight: 700;
}

.status-pill[data-status="active"] {
  background: var(--status-active-soft);
  color: var(--status-active-text);
}

.status-pill[data-status="inactive"] {
  background: var(--status-inactive-soft);
  color: var(--status-inactive-text);
}

.status-pill[data-status="revoked"] {
  background: var(--status-revoked-soft);
  color: var(--status-revoked-text);
}

.count-pill {
  background: var(--neutral-soft);
  color: var(--muted);
}

.empty-state {
  margin-top: 1.25rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--surface-overlay-muted);
  color: var(--muted);
}

@media (max-width: 980px) {

  .facts,
  .application-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .page {
    padding: 1rem;
  }

  .hero,
  .panel__header {
    flex-direction: column;
  }

  .facts,
  .application-grid {
    grid-template-columns: 1fr;
  }
}
</style>
