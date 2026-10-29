import Link from 'next/link'

const LEGAL_LINK =
  'text-[#6E655C] no-underline cursor-none transition-colors duration-200 hover:text-[#A8552C] focus-visible:text-[#A8552C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A8552C] rounded-sm'

export default function FooterBottomBar() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:pr-20 text-[12px] text-[#6E655C]">
      <span>© {new Date().getFullYear()} LitMeUp. All rights reserved.</span>
      <div className="flex gap-6">
        <Link href="/privacy" className={LEGAL_LINK}>Privacy Policy</Link>
        <Link href="/terms" className={LEGAL_LINK}>Terms of Use</Link>
      </div>
    </div>
  )
}
