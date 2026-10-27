import { SignIn } from '@clerk/nextjs';

// Catch-all route: Clerk's path routing puts its sub-steps (factor-one, sso-callback,
// password reset) under /login/*. Styling lives in CLERK_APPEARANCE (app/layout.tsx).
export default function LoginPage() {
  return (
    <div className="pt-header flex justify-center px-4 sm:px-6" style={{ minHeight: '100vh' }}>
      {/* Top-aligned, not centred: sub-steps differ in height and would jump. */}
      <div className="w-full max-w-[400px] pt-[10vh] pb-20">
        <SignIn path="/login" signUpUrl="/signup" />
      </div>
    </div>
  );
}
