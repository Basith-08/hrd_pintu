<template>
  <section class="form-section">
    <div class="section-header">
      <div class="section-header__copy">
        <h3>{{ title }}</h3>
        <p v-if="description" class="section-header__description">{{ description }}</p>
        <p v-if="note" class="section-header__note">{{ note }}</p>
      </div>
      <slot name="actions"></slot>
    </div>
    <slot></slot>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  note?: string
}>()
</script>
