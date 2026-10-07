import { SignIn } from '@clerk/nextjs';
import Logo from '@/components/ui/Logo';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

// Catch-all route: Clerk's path routing puts its sub-steps (factor-one, sso-callback,
// password reset) under /login/*.
export default function LoginPage() {
  return (
    <div className="flex pt-header" style={{ minHeight: '100vh' }}>
      <AuthBrandPanel
        eyebrow="Welcome Back"
        headline={
          <>
            Light Up
            <br />
            <em className="italic" style={{ color: '#E8A87C' }}>Every Room</em>
          </>
        }
        subtext="Sign in to access your wishlists, track orders, and discover new arrivals curated just for you."
        quote="Every chandelier tells a story of elegance and light."
      />

      <div className="flex-1 flex flex-col" style={{ background: '#EDE8E0' }}>
        <div className="lg:hidden flex items-center justify-center py-7" style={{ background: '#1A1210' }}>
          <Logo light />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-14">
          <SignIn path="/login" signUpUrl="/signup" />
        </div>
      </div>
    </div>
  );
}
