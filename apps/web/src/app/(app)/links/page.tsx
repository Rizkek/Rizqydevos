import { PageHeader } from '@/components/shared/page-header'
import { LinksLibrary } from '@/components/links/links-library'

export const metadata = { title: 'Links' }

export default function LinksPage() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[1100px] flex-col p-[var(--spacing-page-pad)]">
      <PageHeader title="Links" description="Bookmarks with tags, search, import and export." />
      <LinksLibrary />
    </div>
  )
}
