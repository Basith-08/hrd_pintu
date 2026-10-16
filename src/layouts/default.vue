<template>
  <div class="shell">
    <div class="shell__backdrop" />
    <div class="shell__toolbar">
      <LanguageSwitcher />
    </div>
    <main class="shell__content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  position: relative;
}

.shell__backdrop {
  position: fixed;
  inset: 0;
  background: var(--shell-backdrop);
  z-index: 0;
}

.shell__toolbar {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2;
}

.shell__content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}
</style>
