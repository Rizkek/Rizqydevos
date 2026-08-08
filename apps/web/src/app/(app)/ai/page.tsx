import { ModulePlaceholder } from '@/components/shared/module-placeholder'
import { Bot } from 'lucide-react'

export const metadata = { title: 'AI Assistant' }

export default function AiPage() {
  return (
    <ModulePlaceholder
      title="AI Assistant"
      description="Chat with AI, manage prompt library, run code generations, and automate DevOS workflows using LLMs."
      icon={Bot}
      phase="Phase 4"
    />
  )
}