'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import OtpInput from '@/components/auth/OtpInput';
import { forgotPassword, resetPassword } from '@/lib/auth/api';
import type { ApiError } from '@/lib/auth/types';

type Step = 'email' | 'otp' | 'password' | 'success';

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

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');

  // Step 1 — email
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Step 2 — OTP
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  // Step 3 — new password
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwErrors, setPwErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [pwLoading, setPwLoading] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [step, countdown]);

  // ── Step 1: send OTP to email ────────────────────────────────────────────

  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailLoading(true);
    setEmailError('');
    try {
      await forgotPassword(email.trim());
      setStep('otp');
      setCountdown(60);
      setOtp('');
      setOtpError('');
    } catch (err: unknown) {
      const e = err as ApiError;
      setEmailError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  }, [email]);

  // ── Step 2: resend OTP ───────────────────────────────────────────────────

  const handleResend = useCallback(async () => {
    setResendLoading(true);
    setOtpError('');
    try {
      await forgotPassword(email.trim());
      setCountdown(60);
      setOtp('');
    } catch (err: unknown) {
      const e = err as ApiError;
      setOtpError(e.message ?? 'Could not resend code.');
    } finally {
      setResendLoading(false);
    }
  }, [email]);

  // Proceed to password step — OTP is the reset token
  const handleOtpContinue = useCallback(() => {
    if (otp.length < 6) {
      setOtpError('Enter the 6-digit code.');
      return;
    }
    setOtpError('');
    setStep('password');
    setPwErrors({});
    setPassword('');
    setConfirm('');
  }, [otp]);

  // Auto-proceed when all 6 digits entered
  useEffect(() => {
    if (otp.length === 6) handleOtpContinue();
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 3: reset password using OTP as token ────────────────────────────

  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof pwErrors = {};
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (password !== confirm) errs.confirm = 'Passwords do not match.';
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPwLoading(true);
    try {
      await resetPassword(email.trim(), otp, password);
      setStep('success');
    } catch (err: unknown) {
      const e = err as ApiError;
      if (e.status === 400 || e.status === 401) {
        // OTP is wrong — send user back to OTP step
        setStep('otp');
        setOtp('');
        setOtpError('Incorrect or expired code. Please try again.');
      } else {
        setPwErrors({ form: e.message ?? 'Something went wrong. Please try again.' });
      }
    } finally {
      setPwLoading(false);
    }
  }, [otp, password, confirm]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <AuthBrandPanel
        eyebrow="Account Recovery"
        headline={
          <>
            Reset Your
            <br />
            <em className="italic" style={{ color: '#E8A87C' }}>Password</em>
          </>
        }
        subtext="Enter your email and we'll send you a one-time code to reset your password."
        quote="Every chandelier tells a story of elegance and light."
      />

      <div className="flex-1 flex flex-col" style={{ background: '#EDE8E0' }}>
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-center py-7" style={{ background: '#1A1210' }}>
          <Logo light />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-14">
          <div className="w-full max-w-[420px]">

            {/* ── Step 1: Email ──────────────────────────────────────────── */}
            {step === 'email' && (
              <>
                <div className="mb-9">
                  <p className="font-sans text-[9px] tracking-[0.22em] uppercase mb-3" style={{ color: '#A09488' }}>
                    Forgot Password
                  </p>
                  <h1 className="font-serif font-light" style={{ fontSize: '42px', color: '#1A1210', lineHeight: 1.05 }}>
                    Reset Password
                  </h1>
                  <p className="mt-3 font-sans text-[13px] font-light leading-[1.7]" style={{ color: '#A09488' }}>
                    We'll send a one-time code to your email.
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} noValidate className="space-y-5">
                  <div>
                    <label
                      htmlFor="fp-email"
                      className="block font-sans text-[10px] font-medium tracking-[0.12em] uppercase mb-2"
                      style={{ color: '#2C2825' }}
                    >
                      Email Address
                    </label>
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      inputMode="email"
                      className="w-full rounded-lg px-4 py-3 font-sans text-[13px] font-light outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(44,40,37,0.06)',
                        border: `1px solid ${emailError ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'}`,
                        color: '#2C2825',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,113,74,0.65)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = emailError ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'; }}
                    />
                    {emailError && (
                      <p className="mt-1.5 font-sans text-[11px] font-light" style={{ color: '#C4714A' }}>
                        {emailError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="w-full rounded-3xl py-[14px] font-sans text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: '#C4714A', color: '#EDE8E0' }}
                  >
                    {emailLoading ? 'Sending…' : 'Send Code'}
                  </button>
                </form>

                <div className="flex items-center gap-4 my-7">
                  <div className="flex-1 h-px" style={{ background: 'rgba(44,40,37,0.12)' }} />
                  <span className="font-sans text-[9.5px] tracking-[0.12em] uppercase" style={{ color: '#A09488' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(44,40,37,0.12)' }} />
                </div>

                <p className="text-center font-sans font-light" style={{ fontSize: '12.5px', color: '#A09488' }}>
                  Remember your password?{' '}
                  <Link href="/login" className="font-medium" style={{ color: '#C4714A' }}>Sign in</Link>
                </p>
              </>
            )}

            {/* ── Step 2: OTP ────────────────────────────────────────────── */}
            {step === 'otp' && (
              <>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setOtpError(''); }}
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
                    <span className="font-medium" style={{ color: '#2C2825' }}>{maskEmail(email)}</span>
                  </p>
                </div>

                <div className="space-y-5">
                  <OtpInput value={otp} onChange={setOtp} error={!!otpError} />

                  {otpError && (
                    <p className="font-sans text-[11px] font-light text-center py-2 px-3 rounded-lg"
                      style={{ background: 'rgba(196,113,74,0.08)', color: '#C4714A' }}>
                      {otpError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleOtpContinue}
                    disabled={otp.length < 6}
                    className="w-full rounded-3xl py-[14px] font-sans text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                    style={{ background: '#C4714A', color: '#EDE8E0' }}
                  >
                    Continue
                  </button>

                  {/* Resend */}
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-sans text-[12px] font-light" style={{ color: '#A09488' }}>
                      Didn't receive it?
                    </span>
                    {countdown > 0 ? (
                      <span className="font-sans text-[12px] font-medium" style={{ color: '#A09488' }}>
                        Resend in {countdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="font-sans text-[12px] font-medium underline-offset-2 hover:underline disabled:opacity-50"
                        style={{ color: '#C4714A' }}
                      >
                        {resendLoading ? 'Sending…' : 'Resend Code'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Step 3: New password ────────────────────────────────────── */}
            {step === 'password' && (
              <>
                <button
                  type="button"
                  onClick={() => { setStep('otp'); setOtp(''); setOtpError(''); }}
                  className="flex items-center gap-2 mb-8 font-sans text-[11px] font-light transition-colors"
                  style={{ color: '#A09488' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                  Back
                </button>

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

                <form onSubmit={handlePasswordSubmit} noValidate className="space-y-5">
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
                        onChange={e => { setPassword(e.target.value); setPwErrors(p => ({ ...p, password: undefined, form: undefined })); }}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        className="w-full rounded-lg px-4 py-3 pr-11 font-sans text-[13px] font-light outline-none transition-all duration-200"
                        style={{
                          background: 'rgba(44,40,37,0.06)',
                          border: `1px solid ${pwErrors.password ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'}`,
                          color: '#2C2825',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,113,74,0.65)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = pwErrors.password ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'; }}
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
                    {pwErrors.password && (
                      <p className="mt-1.5 font-sans text-[11px] font-light" style={{ color: '#C4714A' }}>
                        {pwErrors.password}
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
                        onChange={e => { setConfirm(e.target.value); setPwErrors(p => ({ ...p, confirm: undefined })); }}
                        placeholder="Repeat your password"
                        autoComplete="new-password"
                        className="w-full rounded-lg px-4 py-3 pr-11 font-sans text-[13px] font-light outline-none transition-all duration-200"
                        style={{
                          background: 'rgba(44,40,37,0.06)',
                          border: `1px solid ${pwErrors.confirm ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'}`,
                          color: '#2C2825',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,113,74,0.65)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = pwErrors.confirm ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'; }}
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
                    {pwErrors.confirm && (
                      <p className="mt-1.5 font-sans text-[11px] font-light" style={{ color: '#C4714A' }}>
                        {pwErrors.confirm}
                      </p>
                    )}
                  </div>

                  {pwErrors.form && (
                    <p className="font-sans text-[12px] font-light text-center py-2 px-3 rounded-lg"
                      style={{ background: 'rgba(196,113,74,0.08)', color: '#C4714A' }}>
                      {pwErrors.form}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="w-full rounded-3xl py-[14px] font-sans text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: '#C4714A', color: '#EDE8E0' }}
                  >
                    {pwLoading ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              </>
            )}

            {/* ── Step 4: Success ─────────────────────────────────────────── */}
            {step === 'success' && (
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-7"
                  style={{ background: 'rgba(34,197,94,0.1)' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803D"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="font-sans text-[9px] tracking-[0.22em] uppercase mb-3" style={{ color: '#A09488' }}>
                  All Done
                </p>
                <h1 className="font-serif font-light mb-4" style={{ fontSize: '38px', color: '#1A1210', lineHeight: 1.05 }}>
                  Password Updated
                </h1>
                <p className="font-sans text-[13px] font-light leading-[1.75] mb-8" style={{ color: '#A09488' }}>
                  Your password has been reset successfully.
                  <br />
                  You can now sign in with your new password.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center no-underline rounded-3xl py-3 px-8 font-sans text-[12px] font-medium uppercase tracking-[0.12em] transition-all duration-200 hover:brightness-110"
                  style={{ background: '#2C2825', color: '#EDE8E0' }}
                >
                  Sign In
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
