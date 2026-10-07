import { SignUp } from '@clerk/nextjs';
import Logo from '@/components/ui/Logo';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

const MEMBER_PERKS = [
  'Free shipping on orders over $200',
  'Exclusive member-only collections',
  'Early access to new arrivals',
];

// Catch-all route: Clerk's path routing puts its sub-steps (verify-email-address,
// sso-callback) under /signup/*.
export default function SignupPage() {
  return (
    <div className="flex pt-header" style={{ minHeight: '100vh' }}>
      <AuthBrandPanel
        eyebrow="Join Us"
        headline={
          <>
            Begin Your
            <br />
            <em className="italic" style={{ color: '#E8A87C' }}>Luminous</em>
            <br />
            Journey
          </>
        }
        subtext="Create an account and enjoy exclusive early access, curated recommendations, and a seamless shopping experience."
        quote="Crafted for those who believe home is a work of art."
      >
        <ul className="mt-8 space-y-3">
          {MEMBER_PERKS.map(perk => (
            <li key={perk} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#C4714A' }} />
              <span className="font-sans text-[12px] font-light" style={{ color: 'rgba(237,232,224,0.5)' }}>
                {perk}
              </span>
            </li>
          ))}
        </ul>
      </AuthBrandPanel>

      <div className="flex-1 flex flex-col" style={{ background: '#EDE8E0' }}>
        <div className="lg:hidden flex items-center justify-center py-7" style={{ background: '#1A1210' }}>
          <Logo light />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-14">
          <SignUp path="/signup" signInUrl="/login" />
        </div>
      </div>
    </div>
  );
}
