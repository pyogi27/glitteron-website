'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import OtpInput from '@/components/auth/OtpInput';
import { login, loginVerifyOtp } from '@/lib/auth/api';
import { useAuthStore } from '@/lib/stores/authStore';
import type { ApiError } from '@/lib/auth/types';

// ─── Eye icon ─────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** +91 XXXXX 43210 */
function maskPhone(phone: string) {
  return `+91 XXXXX ${phone.slice(-5)}`;
}

type Step = 'credentials' | 'otp';

interface CredentialErrors {
  phone?: string;
  password?: string;
  form?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore(s => s.setAuth);

  // Step 1 — credentials
  const [phone, setPhone] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [credErrors, setCredErrors] = useState<CredentialErrors>({});
  const [credLoading, setCredLoading] = useState(false);

  // Step 2 — OTP
  const [step, setStep] = useState<Step>('credentials');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [step, countdown]);

  // ── Step 1: submit phone + password ───────────────────────────────────────

  const handleCredSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errors: CredentialErrors = {};
      if (!/^\d{10}$/.test(phone)) errors.phone = 'Enter a valid 10-digit number';
      if (!password) errors.password = 'Password is required';
      setCredErrors(errors);
      if (Object.keys(errors).length > 0) return;

      setCredLoading(true);
      try {
        await login(phone, password);
        setStep('otp');
        setCountdown(60);
        setOtp('');
        setOtpError('');
      } catch (err: unknown) {
        const e = err as ApiError;
        if (e.status === 401) {
          setCredErrors({ form: 'Invalid phone number or password.' });
        } else if (e.status === 429) {
          setCredErrors({ form: e.message });
        } else {
          setCredErrors({ form: 'Something went wrong. Please try again.' });
        }
      } finally {
        setCredLoading(false);
      }
    },
    [phone, password],
  );

  // ── Step 2: verify OTP ────────────────────────────────────────────────────

  const handleOtpVerify = useCallback(async () => {
    if (otp.length < 6) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const { accessToken, user } = await loginVerifyOtp(phone, otp);
      setAuth(accessToken, user);
      router.replace(searchParams.get('return') ?? '/');
    } catch (err: unknown) {
      const e = err as ApiError;
      setOtpError(e.message ?? 'Invalid OTP. Please try again.');
      setOtp('');
    } finally {
      setOtpLoading(false);
    }
  }, [otp, phone, setAuth, router]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && !otpLoading) handleOtpVerify();
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resend: re-call /login (requires password re-check) ───────────────────

  const handleResend = useCallback(async () => {
    setResendLoading(true);
    setOtpError('');
    try {
      await login(phone, password);
      setCountdown(60);
      setOtp('');
    } catch (err: unknown) {
      const e = err as ApiError;
      setOtpError(e.message ?? 'Could not resend OTP.');
    } finally {
      setResendLoading(false);
    }
  }, [phone, password]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex pt-header" style={{ minHeight: '100vh' }}>
      {/* Left — Brand panel */}
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

      {/* Right — Form panel */}
      <div className="flex-1 flex flex-col" style={{ background: '#EDE8E0' }}>
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-center py-7" style={{ background: '#1A1210' }}>
          <Logo light />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-14">
          <div className="w-full max-w-[420px]">

            {/* ── Step 1: Credentials ──────────────────────────────────────── */}
            {step === 'credentials' && (
              <>
                <div className="mb-9">
                  <p className="font-sans text-[9px] tracking-[0.22em] uppercase mb-3"
                    style={{ color: '#A09488' }}>
                    Your Account
                  </p>
                  <h1 className="font-serif font-light" style={{ fontSize: '42px', color: '#1A1210', lineHeight: 1.05 }}>
                    Sign In
                  </h1>
                </div>

                <form onSubmit={handleCredSubmit} noValidate className="space-y-5">
                  {/* Phone */}
                  <div>
                    <label htmlFor="login-phone"
                      className="block font-sans text-[10px] font-medium tracking-[0.12em] uppercase mb-2"
                      style={{ color: '#2C2825' }}>
                      Phone Number
                    </label>
                    <div
                      className="flex rounded-lg overflow-hidden transition-all duration-200"
                      style={{
                        background: 'rgba(44,40,37,0.06)',
                        border: `1px solid ${credErrors.phone
                          ? 'rgba(196,113,74,0.7)'
                          : phoneFocused
                            ? 'rgba(196,113,74,0.65)'
                            : 'rgba(44,40,37,0.15)'}`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 px-3.5 flex-shrink-0 select-none"
                        style={{ borderRight: '1px solid rgba(44,40,37,0.12)', cursor: 'default' }}>
                        <span style={{ fontSize: '14px', lineHeight: 1 }}>🇮🇳</span>
                        <span className="font-sans text-[12.5px] font-light" style={{ color: '#A09488' }}>+91</span>
                      </div>
                      <input
                        id="login-phone"
                        type="tel"
                        value={phone}
                        onChange={e => {
                          setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                          setCredErrors(p => ({ ...p, phone: undefined }));
                        }}
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
                        placeholder="98765 43210"
                        autoComplete="tel-national"
                        inputMode="numeric"
                        maxLength={10}
                        className="flex-1 bg-transparent px-3.5 py-3 text-[13px] font-light outline-none"
                        style={{ color: '#2C2825' }}
                      />
                    </div>
                    {credErrors.phone && (
                      <p className="mt-1.5 font-sans text-[11px] font-light" style={{ color: '#C4714A' }}>
                        {credErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="login-password"
                        className="font-sans text-[10px] font-medium tracking-[0.12em] uppercase"
                        style={{ color: '#2C2825' }}>
                        Password
                      </label>
                      <Link href="/forgot-password"
                        className="font-sans text-[11px] font-light underline-offset-2 hover:underline transition-colors"
                        style={{ color: '#A09488' }}>
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          setCredErrors(p => ({ ...p, password: undefined }));
                        }}
                        placeholder="Your password"
                        autoComplete="current-password"
                        className="auth-input w-full rounded-lg px-4 py-3 pr-11 text-[13px] font-light"
                        style={{
                          background: 'rgba(44,40,37,0.06)',
                          border: `1px solid ${credErrors.password ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'}`,
                          color: '#2C2825',
                        }}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: '#A09488' }}>
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                    {credErrors.password && (
                      <p className="mt-1.5 font-sans text-[11px] font-light" style={{ color: '#C4714A' }}>
                        {credErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Form-level error */}
                  {credErrors.form && (
                    <p className="font-sans text-[12px] font-light text-center py-2 px-3 rounded-lg"
                      style={{ background: 'rgba(196,113,74,0.08)', color: '#C4714A' }}>
                      {credErrors.form}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={credLoading}
                    className="w-full rounded-3xl py-[14px] font-sans text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: '#C4714A', color: '#EDE8E0' }}
                  >
                    {credLoading ? 'Verifying…' : 'Continue'}
                  </button>
                </form>

                <div className="flex items-center gap-4 my-7">
                  <div className="flex-1 h-px" style={{ background: 'rgba(44,40,37,0.12)' }} />
                  <span className="font-sans text-[9.5px] tracking-[0.12em] uppercase" style={{ color: '#A09488' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(44,40,37,0.12)' }} />
                </div>
                <p className="text-center font-sans font-light" style={{ fontSize: '12.5px', color: '#A09488' }}>
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="font-medium" style={{ color: '#C4714A' }}>Create one</Link>
                </p>
              </>
            )}

            {/* ── Step 2: OTP ──────────────────────────────────────────────── */}
            {step === 'otp' && (
              <>
                {/* Back button */}
                <button
                  onClick={() => { setStep('credentials'); setOtp(''); setOtpError(''); }}
                  className="flex items-center gap-2 mb-8 font-sans text-[11px] font-light transition-colors"
                  style={{ color: '#A09488' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                  Back
                </button>

                <div className="mb-8">
                  <p className="font-sans text-[9px] tracking-[0.22em] uppercase mb-3" style={{ color: '#A09488' }}>
                    Verification
                  </p>
                  <h1 className="font-serif font-light mb-3" style={{ fontSize: '38px', color: '#1A1210', lineHeight: 1.05 }}>
                    Enter Code
                  </h1>
                  <p className="font-sans text-[12.5px] font-light leading-[1.7]" style={{ color: '#A09488' }}>
                    We sent a 6-digit code to{' '}
                    <span className="font-medium" style={{ color: '#2C2825' }}>{maskPhone(phone)}</span>
                  </p>
                </div>

                <div className="space-y-5">
                  <OtpInput value={otp} onChange={setOtp} error={!!otpError} disabled={otpLoading} />

                  {otpError && (
                    <p className="font-sans text-[11px] font-light text-center py-2 px-3 rounded-lg"
                      style={{ background: 'rgba(196,113,74,0.08)', color: '#C4714A' }}>
                      {otpError}
                    </p>
                  )}

                  <button
                    onClick={handleOtpVerify}
                    disabled={otp.length < 6 || otpLoading}
                    className="w-full rounded-3xl py-[14px] font-sans text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                    style={{ background: '#C4714A', color: '#EDE8E0' }}
                  >
                    {otpLoading ? 'Verifying…' : 'Verify & Sign In'}
                  </button>

                  {/* Resend */}
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-sans text-[12px] font-light" style={{ color: '#A09488' }}>
                      Didn&apos;t receive it?
                    </span>
                    {countdown > 0 ? (
                      <span className="font-sans text-[12px] font-medium" style={{ color: '#A09488' }}>
                        Resend in {countdown}s
                      </span>
                    ) : (
                      <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="font-sans text-[12px] font-medium underline-offset-2 hover:underline disabled:opacity-50"
                        style={{ color: '#C4714A' }}
                      >
                        {resendLoading ? 'Sending…' : 'Resend OTP'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
