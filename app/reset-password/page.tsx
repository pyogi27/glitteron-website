'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import { resetPassword } from '@/lib/auth/api';
import type { ApiError } from '@/lib/auth/types';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-redirect to login after success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => router.replace('/login'), 3000);
    return () => clearTimeout(t);
  }, [success, router]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (password !== confirm) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await resetPassword('', token, password);
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as ApiError;
      if (e.status === 400 || e.status === 401) {
        setErrors({ form: 'This reset link is invalid or has expired.' });
      } else {
        setErrors({ form: e.message ?? 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  }, [token, password, confirm]);

  // ── Invalid / missing token ───────────────────────────────────────────────
  if (!token) {
    return (
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-7"
          style={{ background: 'rgba(196,113,74,0.1)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C4714A"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="font-sans text-[9px] tracking-[0.22em] uppercase mb-3" style={{ color: '#A09488' }}>
          Invalid Link
        </p>
        <h1 className="font-serif font-light mb-4" style={{ fontSize: '36px', color: '#1A1210', lineHeight: 1.05 }}>
          Link Expired
        </h1>
        <p className="font-sans text-[13px] font-light leading-[1.75] mb-8" style={{ color: '#A09488' }}>
          This reset link is invalid or has already been used.
          <br />
          Request a new one below.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center no-underline rounded-3xl py-3 px-7 font-sans text-[12px] font-medium uppercase tracking-[0.12em] transition-all duration-200 hover:brightness-110"
          style={{ background: '#C4714A', color: '#EDE8E0' }}
        >
          Request New Link
        </Link>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-7"
          style={{ background: 'rgba(34,197,94,0.1)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803D"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="font-sans text-[9px] tracking-[0.22em] uppercase mb-3" style={{ color: '#A09488' }}>
          All Done
        </p>
        <h1 className="font-serif font-light mb-4" style={{ fontSize: '38px', color: '#1A1210', lineHeight: 1.05 }}>
          Password Updated
        </h1>
        <p className="font-sans text-[13px] font-light leading-[1.75] mb-2" style={{ color: '#A09488' }}>
          Your password has been reset successfully.
        </p>
        <p className="font-sans text-[12px] font-light mb-8" style={{ color: '#A09488' }}>
          Redirecting you to sign in…
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center no-underline rounded-3xl py-3 px-8 font-sans text-[12px] font-medium uppercase tracking-[0.12em] transition-all duration-200 hover:brightness-110"
          style={{ background: '#2C2825', color: '#EDE8E0' }}
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  // ── Reset form ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="mb-9">
        <p className="font-sans text-[9px] tracking-[0.22em] uppercase mb-3" style={{ color: '#A09488' }}>
          New Password
        </p>
        <h1 className="font-serif font-light" style={{ fontSize: '42px', color: '#1A1210', lineHeight: 1.05 }}>
          Set Password
        </h1>
        <p className="mt-3 font-sans text-[13px] font-light leading-[1.7]" style={{ color: '#A09488' }}>
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* New password */}
        <div>
          <label
            htmlFor="rp-password"
            className="block font-sans text-[10px] font-medium tracking-[0.12em] uppercase mb-2"
            style={{ color: '#2C2825' }}
          >
            New Password
          </label>
          <div className="relative">
            <input
              id="rp-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined, form: undefined })); }}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className="w-full rounded-lg px-4 py-3 pr-11 font-sans text-[13px] font-light outline-none transition-all duration-200"
              style={{
                background: 'rgba(44,40,37,0.06)',
                border: `1px solid ${errors.password ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'}`,
                color: '#2C2825',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,113,74,0.65)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.password ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'; }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: '#A09488' }}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 font-sans text-[11px] font-light" style={{ color: '#C4714A' }}>
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="rp-confirm"
            className="block font-sans text-[10px] font-medium tracking-[0.12em] uppercase mb-2"
            style={{ color: '#2C2825' }}
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="rp-confirm"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: undefined })); }}
              placeholder="Repeat your password"
              autoComplete="new-password"
              className="w-full rounded-lg px-4 py-3 pr-11 font-sans text-[13px] font-light outline-none transition-all duration-200"
              style={{
                background: 'rgba(44,40,37,0.06)',
                border: `1px solid ${errors.confirm ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'}`,
                color: '#2C2825',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,113,74,0.65)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.confirm ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'; }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: '#A09488' }}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          {errors.confirm && (
            <p className="mt-1.5 font-sans text-[11px] font-light" style={{ color: '#C4714A' }}>
              {errors.confirm}
            </p>
          )}
        </div>

        {/* Form-level error */}
        {errors.form && (
          <p className="font-sans text-[12px] font-light text-center py-2 px-3 rounded-lg"
            style={{ background: 'rgba(196,113,74,0.08)', color: '#C4714A' }}>
            {errors.form}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-3xl py-[14px] font-sans text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          style={{ background: '#C4714A', color: '#EDE8E0' }}
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>

      <p className="mt-7 text-center font-sans font-light" style={{ fontSize: '12.5px', color: '#A09488' }}>
        <Link href="/login" className="font-medium" style={{ color: '#C4714A' }}>Back to Sign In</Link>
      </p>
    </>
  );
}

// ─── Page (wraps in Suspense for useSearchParams) ─────────────────────────────

export default function ResetPasswordPage() {
  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <AuthBrandPanel
        eyebrow="Account Recovery"
        headline={
          <>
            New
            <br />
            <em className="italic" style={{ color: '#E8A87C' }}>Password</em>
          </>
        }
        subtext="Choose a strong password to keep your LitMeUp account secure."
        quote="Every chandelier tells a story of elegance and light."
      />

      <div className="flex-1 flex flex-col" style={{ background: '#EDE8E0' }}>
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-center py-7" style={{ background: '#1A1210' }}>
          <Logo light />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-14">
          <div className="w-full max-w-[420px]">
            <Suspense>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
