<template>
  <main class="login-page">
    <div class="login-page__toolbar">
      <LanguageSwitcher />
    </div>
    <section class="login-card">
      <div class="login-card__hero">
        <p class="eyebrow">{{ text("app.title.candidate") }}</p>
        <h1>{{ text("login.hero.title") }}</h1>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <AppTextField
          v-model="email"
          autocomplete="email"
          placeholder="user@email.com"
          required
          type="email"
          :label="text('common.email')"
        />

        <AppFieldGroup :label="text('login.fields.password')">
          <div class="password-field">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              minlength="6"
              :placeholder="text('login.fields.passwordPlaceholder')"
            />
            <AppButton
              type="button"
              class="password-toggle"
              variant="ghost"
              :aria-label="showPassword ? text('login.actions.hidePassword') : text('login.actions.showPassword')"
              @click="showPassword = !showPassword"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <template v-if="showPassword">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                  <circle cx="12" cy="12" r="3" />
                </template>
                <template v-else>
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.7a3 3 0 0 0 4.2 4.2" />
                  <path d="M9.4 5.2A11.4 11.4 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.2 4.2" />
                  <path d="M6.6 6.7A17.4 17.4 0 0 0 2 12s3.5 7 10 7c1.8 0 3.4-.4 4.8-1" />
                </template>
              </svg>
            </AppButton>
          </div>
        </AppFieldGroup>

        <p v-if="error" class="error-text">{{ error }}</p>

        <AppButton class="submit-button" type="submit" variant="primary" :disabled="isLoading">
          {{ isLoading ? text('common.processing') : text('login.actions.signIn') }}
        </AppButton>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "#imports"

import AppButton from "@/components/AppButton.vue"
import AppFieldGroup from "@/components/AppFieldGroup.vue"
import AppTextField from "@/components/AppTextField.vue"
import { useLocale } from "@/composables/useLocale"
import { getDefaultRoute } from "@/infrastructure/security/defaultRoute"
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel"

const router = useRouter()
const { error, isLoading, login } = useAuthViewModel()
const { text } = useLocale()

const email = ref("")
const password = ref("")
const showPassword = ref(false)

async function handleSubmit() {
  await login({
    email: email.value,
    password: password.value,
  })

  await router.push(getDefaultRoute())
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  position: relative;
}

.login-page__toolbar {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.login-card {
  width: min(920px, 100%);
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface-strong);
  box-shadow: var(--shadow-auth);
}

.login-card__hero {
  padding: 3rem;
  background: var(--brand-hero-gradient), var(--brand-hero-surface);
  color: var(--brand-contrast);
}

.eyebrow {
  margin: 0 0 1rem;
  letter-spacing: var(--tracking-eyebrow-compact);
  text-transform: uppercase;
  font-size: var(--text-pill);
}

h1 {
  margin: 0;
  font-size: var(--text-auth-title);
  line-height: var(--leading-auth-title);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 3rem;
}

.login-form :deep(.field-group) {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.login-form :deep(.field-group > span) {
  font-size: var(--text-label);
  font-weight: 600;
}

.login-form :deep(.field-group > .field) {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
  background: var(--surface-soft);
  padding: 0.95rem 1rem;
  color: var(--text);
}

.password-field {
  position: relative;
}

.password-field input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
  background: var(--surface-soft);
  padding: 0.95rem 1rem;
  color: var(--text);
  padding-right: 3.25rem;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.password-field input:focus,
.password-field input:focus-visible {
  border-color: var(--brand-focus);
  box-shadow: 0 0 0 3px var(--brand-focus-ring);
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 0.7rem;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
  background: var(--surface-strong);
  color: var(--text-icon-muted);
  padding: 0;
  cursor: pointer;
}

.password-toggle svg {
  width: 1rem;
  height: 1rem;
}

.error-text {
  margin: 0;
  border-radius: var(--radius-control);
  background: var(--danger-soft);
  color: var(--danger-text);
  padding: 0.85rem 1rem;
}

.submit-button {
  border-radius: var(--radius-pill);
  padding: 1rem 1.25rem;
}

.submit-button:disabled {
  opacity: 0.55;
  cursor: wait;
}

@media (max-width: 860px) {
  .login-card {
    grid-template-columns: 1fr;
  }

  .login-card__hero,
  .login-form {
    padding: 2rem;
  }
}
</style>
