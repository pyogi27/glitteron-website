import { SignUp } from '@clerk/nextjs';

// Catch-all route: Clerk's path routing puts its sub-steps (verify-email-address,
// sso-callback) under /signup/*. Styling lives in CLERK_APPEARANCE (app/layout.tsx).
export default function SignupPage() {
  return (
    <div className="pt-header flex justify-center px-4 sm:px-6" style={{ minHeight: '100vh' }}>
      <div className="w-full max-w-[400px] pt-[10vh] pb-20">
        <SignUp path="/signup" signInUrl="/login" />
      </div>
    </div>
  );
}
