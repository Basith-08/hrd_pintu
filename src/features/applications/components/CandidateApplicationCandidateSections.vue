<template>
  <CandidateApplicationDataSection v-if="stepKey === 'application-data'" :page="page" />
  <CandidatePersonalDataSection v-else-if="stepKey === 'personal-data'" :page="page" />
  <CandidateContactIdentitySection v-else-if="stepKey === 'contact-identity'" :page="page" />
  <CandidateFamilyEmergencySection v-else-if="stepKey === 'family-emergency'" :page="page" />
  <CandidateEducationTrainingSection v-else-if="stepKey === 'education-training'" :page="page" />
  <CandidateSkillsAbilitiesSection v-else-if="stepKey === 'skill-abilities'" :page="page" />
  <CandidateEmploymentHistorySection v-else-if="stepKey === 'employment-history'" :page="page" />
  <CandidateReferencesSection v-else-if="stepKey === 'reference-data'" :page="page" />
  <CandidateMobilityResidenceSection v-else-if="stepKey === 'mobility-residence'" :page="page" />
  <CandidatePersonalStatementSection v-else-if="stepKey === 'personal-statement'" :page="page" />
</template>

<script setup lang="ts">
import CandidateApplicationDataSection from "@/features/applications/components/CandidateApplicationDataSection.vue"
import CandidatePersonalDataSection from "@/features/applications/components/CandidatePersonalDataSection.vue"
import CandidateContactIdentitySection from "@/features/applications/components/CandidateContactIdentitySection.vue"
import CandidateFamilyEmergencySection from "@/features/applications/components/CandidateFamilyEmergencySection.vue"
import CandidateEducationTrainingSection from "@/features/applications/components/CandidateEducationTrainingSection.vue"
import CandidateSkillsAbilitiesSection from "@/features/applications/components/CandidateSkillsAbilitiesSection.vue"
import CandidateEmploymentHistorySection from "@/features/applications/components/CandidateEmploymentHistorySection.vue"
import CandidateReferencesSection from "@/features/applications/components/CandidateReferencesSection.vue"
import CandidateMobilityResidenceSection from "@/features/applications/components/CandidateMobilityResidenceSection.vue"
import CandidatePersonalStatementSection from "@/features/applications/components/CandidatePersonalStatementSection.vue"

defineProps<{
  page: Record<string, any>
  stepKey: string
}>()
</script>
