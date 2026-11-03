// Offered by "Add recommended items". repeatDays is how often the item should be checked again.
export interface ChecklistTemplate {
  title: string
  repeatDays: number | null
}

export const CHECKLIST_TEMPLATES: readonly ChecklistTemplate[] = [
  { title: 'Two-factor sign-in is on for the hosting and repository accounts', repeatDays: 180 },
  { title: 'API keys and tokens are rotated', repeatDays: 90 },
  { title: 'Secrets live in the vault and not in the repository', repeatDays: null },
  { title: 'A database backup exists and a restore was tried', repeatDays: 90 },
  { title: 'Dependencies are checked for known vulnerabilities', repeatDays: 30 },
  { title: 'Domain renewal date is noted', repeatDays: null },
]
