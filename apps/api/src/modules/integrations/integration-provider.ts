export enum IntegrationProvider {
  Github = 'github',
  Vercel = 'vercel',
}

export const PROVIDER_LABEL: Record<IntegrationProvider, string> = {
  [IntegrationProvider.Github]: 'GitHub',
  [IntegrationProvider.Vercel]: 'Vercel',
}

export interface IntegrationMetadata {
  accountLogin?: string
  teamId?: string
}
