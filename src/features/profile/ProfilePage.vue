<template>
  <section class="profile-page">
    <transition name="toast">
      <div v-if="successMessage" class="toast-notification toast-notification--success" role="status" aria-live="polite">
        <div class="toast-notification__body">
          <span class="toast-notification__icon" aria-hidden="true">✓</span>
          <p class="toast-notification__message">{{ successMessage }}</p>
        </div>
        <button
          type="button"
          class="toast-notification__close"
          :aria-label="text('common.actions.close')"
          @click="dismissSuccessMessage()"
        >
          ×
        </button>
      </div>
    </transition>

    <header class="profile-hero">
      <div class="profile-hero__heading">
        <NuxtLink class="ghost-button profile-back" to="/dashboard">
          {{ text("profile.actions.backToDashboard") }}
        </NuxtLink>
        <div>
          <p class="profile-eyebrow">{{ profileEyebrow }}</p>
          <h1>{{ profileTitle }}</h1>
          <p class="profile-summary">{{ profileSummary }}</p>
        </div>
      </div>
    </header>

    <section class="profile-panel">
      <div class="section-header">
        <div class="section-header__copy">
          <h3>{{ text("profile.sections.account") }}</h3>
        </div>
      </div>

      <dl class="profile-facts">
        <div>
          <dt>{{ text("profile.fields.fullName") }}</dt>
          <dd>{{ displayValue(user?.full_name) }}</dd>
        </div>
        <div>
          <dt>{{ text("common.email") }}</dt>
          <dd>{{ displayValue(user?.email) }}</dd>
        </div>
        <div>
          <dt>{{ text("profile.fields.phoneNumber") }}</dt>
          <dd>{{ displayValue(user?.phone) }}</dd>
        </div>
        <div>
          <dt>{{ text("profile.fields.accountStatus") }}</dt>
          <dd>{{ statusLabel }}</dd>
        </div>
      </dl>
    </section>

    <section class="profile-panel">
      <div class="section-header">
        <div class="section-header__copy">
          <h3>{{ text("profile.sections.password") }}</h3>
          <p class="section-header__description">{{ text("profile.password.description") }}</p>
          <p class="section-header__note">{{ text("profile.password.note") }}</p>
        </div>
      </div>

      <form class="profile-form" @submit.prevent="handleSubmit">
        <AppFieldGroup :label="text('profile.fields.currentPassword')">
          <input
            v-model="currentPassword"
            class="field"
            type="password"
            autocomplete="current-password"
            required
            minlength="6"
            :placeholder="text('profile.fields.currentPasswordPlaceholder')"
          />
        </AppFieldGroup>

        <AppFieldGroup :label="text('profile.fields.newPassword')">
          <input
            v-model="newPassword"
            class="field"
            type="password"
            autocomplete="new-password"
            required
            minlength="6"
            :placeholder="text('profile.fields.newPasswordPlaceholder')"
          />
        </AppFieldGroup>

        <AppFieldGroup :label="text('profile.fields.confirmNewPassword')">
          <input
            v-model="confirmNewPassword"
            class="field"
            type="password"
            autocomplete="new-password"
            required
            minlength="6"
            :placeholder="text('profile.fields.confirmNewPasswordPlaceholder')"
          />
        </AppFieldGroup>

        <p v-if="error" class="feedback feedback--error">{{ error }}</p>

        <div class="form-actions">
          <AppButton type="submit" variant="primary" :disabled="isChangingPassword">
            {{ isChangingPassword ? text("profile.actions.updatingPassword") : text("profile.actions.updatePassword") }}
          </AppButton>
        </div>
      </form>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue"

import AppButton from "@/components/AppButton.vue"
import AppFieldGroup from "@/components/AppFieldGroup.vue"
import { useLocale } from "@/composables/useLocale"
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel"

const { text } = useLocale()
const { changePassword, error, isChangingPassword, user } = useAuthViewModel()

const currentPassword = ref("")
const newPassword = ref("")
const confirmNewPassword = ref("")
const successMessage = ref("")
let successMessageTimer: number | null = null

const profileEyebrow = computed(() =>
  user.value?.role === "employee" ? text("profile.eyebrow.employee") : text("profile.eyebrow.candidate"),
)
const profileTitle = computed(() =>
  user.value?.role === "employee" ? text("profile.title.employee") : text("profile.title.candidate"),
)
const profileSummary = computed(() =>
  user.value?.role === "employee" ? text("profile.summary.employee") : text("profile.summary.candidate"),
)
const statusLabel = computed(() => {
  const normalizedStatus = String(user.value?.status ?? "active").trim().toLowerCase()

  if (normalizedStatus === "inactive") {
    return text("status.inactive")
  }

  if (normalizedStatus === "revoked") {
    return text("status.revoked")
  }

  return text("status.active")
})

async function handleSubmit() {
  dismissSuccessMessage()

  try {
    await changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      confirmNewPassword: confirmNewPassword.value,
    })

    currentPassword.value = ""
    newPassword.value = ""
    confirmNewPassword.value = ""
    showSuccessMessage(text("auth.messages.passwordChanged"))
  } catch {
    return
  }
}

function dismissSuccessMessage() {
  successMessage.value = ""

  if (successMessageTimer) {
    clearTimeout(successMessageTimer)
    successMessageTimer = null
  }
}

function showSuccessMessage(message: string) {
  dismissSuccessMessage()
  successMessage.value = message

  if (typeof window === "undefined") {
    return
  }

  successMessageTimer = window.setTimeout(() => {
    successMessage.value = ""
    successMessageTimer = null
  }, 3600)
}

function displayValue(value: unknown) {
  return String(value ?? "").trim() || "-"
}

onBeforeUnmount(() => {
  dismissSuccessMessage()
})
</script>

<style scoped>
.profile-page {
  max-width: 76rem;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.profile-hero,
.profile-panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--panel-gradient), var(--surface);
  box-shadow: var(--shadow-panel);
}

.profile-hero {
  padding: 1.75rem;
}

.profile-hero__heading {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-back {
  width: fit-content;
}

.profile-eyebrow {
  margin: 0;
  color: var(--brand-dark);
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
  font-size: var(--text-caption);
}

.profile-hero h1 {
  margin: 0.35rem 0 0;
  font-size: var(--text-page-title);
  line-height: var(--leading-page-title);
}

.profile-summary {
  margin: 0.75rem 0 0;
  max-width: 58ch;
  color: var(--muted);
  line-height: var(--leading-summary);
}

.profile-panel {
  padding: 1.5rem;
}

.profile-facts {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.profile-facts div {
  border-radius: var(--radius-card);
  border: 1px solid var(--line-softer);
  background: var(--surface-overlay);
  padding: 1rem;
}

.profile-facts dt {
  color: var(--muted);
  font-size: var(--text-caption);
}

.profile-facts dd {
  margin: 0.45rem 0 0;
  font-weight: 700;
}

.profile-form {
  display: grid;
  gap: 1rem;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 1rem;
  }

  .profile-facts {
    grid-template-columns: 1fr;
  }
}
</style>
