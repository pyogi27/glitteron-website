import type { Metadata } from 'next'
import { Suspense } from 'react'
import ProfilePageClient from '@/components/profile/ProfilePageClient'

export const metadata: Metadata = {
  title: 'My Profile — LitmeUp',
  description: 'View and update your profile details and track your order history.',
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="pt-[72px] bg-[#EDE8E0] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
      </div>
    }>
      <ProfilePageClient />
    </Suspense>
  )
}
