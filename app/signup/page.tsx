'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';
import OtpInput from '@/components/auth/OtpInput';
import { sendOtp, verifyOtp } from '@/lib/auth/api';
import { useAuthStore } from '@/lib/stores/authStore';
import type { ApiError } from '@/lib/auth/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function getPasswordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length === 0) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 14) score++;
  return score as 0 | 1 | 2 | 3;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Strong'];
const STRENGTH_COLORS = ['', '#C4714A', '#E8A87C', '#6B9E6B'];

const MEMBER_PERKS = [
  'Free shipping on orders over $200',
  'Exclusive member-only collections',
  'Early access to new arrivals',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  agreedToTerms?: string;
  form?: string;
}

type Step = 'details' | 'otp';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);

  // Step 1 — user details
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Step 2 — OTP
  const [step, setStep] = useState<Step>('details');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const update = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // Countdown timer
  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [step, countdown]);

  // ── Step 1: validate + send OTP ───────────────────────────────────────────

  const handleDetailsSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: FormErrors = {};
      if (!form.firstName.trim()) newErrors.firstName = 'Required';
      if (!form.lastName.trim()) newErrors.lastName = 'Required';
      if (!form.email.trim()) newErrors.email = 'Email address is required';
      else if (!form.email.includes('@')) newErrors.email = 'Enter a valid email address';
      if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'Enter a valid 10-digit number';
      if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!form.agreedToTerms) newErrors.agreedToTerms = 'You must agree to continue';
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;

      setDetailsLoading(true);
      try {
        await sendOtp(form.email);
        setStep('otp');
        setCountdown(60);
        setOtp('');
        setOtpError('');
      } catch (err: unknown) {
        const e = err as ApiError;
        if (e.status === 429) {
          setErrors(prev => ({ ...prev, form: e.message }));
        } else {
          setErrors(prev => ({ ...prev, form: 'Could not send OTP. Please try again.' }));
        }
      } finally {
        setDetailsLoading(false);
      }
    },
    [form],
  );

  // ── Step 2: verify OTP + create account ──────────────────────────────────

  const handleOtpVerify = useCallback(async () => {
    if (otp.length < 6) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const { accessToken, user } = await verifyOtp({
        email: form.email,
        phone: form.phone,
        otp,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
      });
      setAuth(accessToken, user);
      router.replace('/');
    } catch (err: unknown) {
      const e = err as ApiError;
      if (e.status === 409) {
        // Email conflict — send back to step 1 highlighting the email field
        setErrors({ email: 'This email is already in use. Try a different one.' });
        setStep('details');
      } else {
        setOtpError(e.message ?? 'Invalid OTP. Please try again.');
        setOtp('');
      }
    } finally {
      setOtpLoading(false);
    }
  }, [otp, form, setAuth, router]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && !otpLoading) handleOtpVerify();
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resend ────────────────────────────────────────────────────────────────

  const handleResend = useCallback(async () => {
    setResendLoading(true);
    setOtpError('');
    try {
      await sendOtp(form.email);
      setCountdown(60);
      setOtp('');
    } catch (err: unknown) {
      const e = err as ApiError;
      setOtpError(e.message ?? 'Could not resend OTP.');
    } finally {
      setResendLoading(false);
    }
  }, [form.phone]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - var(--spacing-header))' }}>
      {/* Left — Brand panel */}
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

      {/* Right — Form panel */}
      <div className="flex-1 flex flex-col" style={{ background: '#EDE8E0' }}>
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-center py-7" style={{ background: '#1A1210' }}>
          <Logo light />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-12">
          <div className="w-full max-w-[440px]">

            {/* ── Step 1: Details form ─────────────────────────────────────── */}
            {step === 'details' && (
              <>
                <div className="mb-8">
                  <p className="font-sans text-[9px] tracking-[0.22em] uppercase mb-3" style={{ color: '#A09488' }}>
                    Create Account
                  </p>
                  <h1 className="font-serif font-light" style={{ fontSize: '42px', color: '#1A1210', lineHeight: 1.05 }}>
                    Get Started
                  </h1>
                </div>

                <form onSubmit={handleDetailsSubmit} noValidate className="space-y-4">
                  {/* Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="signup-first"
                        className="block font-sans text-[10px] font-medium tracking-[0.12em] uppercase mb-2"
                        style={{ color: '#2C2825' }}>
                        First Name
                      </label>
                      <input
                        id="signup-first" type="text" value={form.firstName}
                        onChange={e => update('firstName', e.target.value)}
                        placeholder="Jane" autoComplete="given-name"
                        className="auth-input w-full rounded-lg px-4 py-3 text-[13px] font-light"
                        style={{
                          background: 'rgba(44,40,37,0.06)',
                          border: `1px solid ${errors.firstName ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'}`,
                          color: '#2C2825',
                        }}
                      />
                      {errors.firstName && (
                        <p className="mt-1 font-sans text-[10.5px] font-light" style={{ color: '#C4714A' }}>
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="signup-last"
                        className="block font-sans text-[10px] font-medium tracking-[0.12em] uppercase mb-2"
                        style={{ color: '#2C2825' }}>
                        Last Name
                      </label>
                      <input
                        id="signup-last" type="text" value={form.lastName}
                        onChange={e => update('lastName', e.target.value)}
                        placeholder="Doe" autoComplete="family-name"
                        className="auth-input w-full rounded-lg px-4 py-3 text-[13px] font-light"
                        style={{
                          background: 'rgba(44,40,37,0.06)',
                          border: `1px solid ${errors.lastName ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'}`,
                          color: '#2C2825',
                        }}
                      />
                      {errors.lastName && (
                        <p className="mt-1 font-sans text-[10.5px] font-light" style={{ color: '#C4714A' }}>
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="signup-email"
                      className="block font-sans text-[10px] font-medium tracking-[0.12em] uppercase mb-2"
                      style={{ color: '#2C2825' }}>
                      Email Address
                    </label>
                    <input
                      id="signup-email" type="email" value={form.email}
                      onChange={e => update('email', e.target.value)}
                      placeholder="you@example.com" autoComplete="email"
                      className="auth-input w-full rounded-lg px-4 py-3 text-[13px] font-light"
                      style={{
                        background: 'rgba(44,40,37,0.06)',
                        border: `1px solid ${errors.email ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'}`,
                        color: '#2C2825',
                      }}
                    />
                    {errors.email && (
                      <p className="mt-1.5 font-sans text-[11px] font-light" style={{ color: '#C4714A' }}>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="signup-phone"
                      className="block font-sans text-[10px] font-medium tracking-[0.12em] uppercase mb-2"
                      style={{ color: '#2C2825' }}>
                      Phone Number
                    </label>
                    <div
                      className="flex rounded-lg overflow-hidden transition-all duration-200"
                      style={{
                        background: 'rgba(44,40,37,0.06)',
                        border: `1px solid ${errors.phone
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
                        id="signup-phone" type="tel"
                        value={form.phone}
                        onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
                        placeholder="98765 43210"
                        autoComplete="tel-national" inputMode="numeric" maxLength={10}
                        className="flex-1 bg-transparent px-3.5 py-3 text-[13px] font-light outline-none"
                        style={{ color: '#2C2825' }}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1.5 font-sans text-[11px] font-light" style={{ color: '#C4714A' }}>
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="signup-password"
                      className="block font-sans text-[10px] font-medium tracking-[0.12em] uppercase mb-2"
                      style={{ color: '#2C2825' }}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => update('password', e.target.value)}
                        placeholder="Min. 8 characters" autoComplete="new-password"
                        className="auth-input w-full rounded-lg px-4 py-3 pr-11 text-[13px] font-light"
                        style={{
                          background: 'rgba(44,40,37,0.06)',
                          border: `1px solid ${errors.password ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'}`,
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
                    {form.password.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                          {[1, 2, 3].map(level => (
                            <div key={level} className="h-[3px] flex-1 rounded-full transition-all duration-300"
                              style={{
                                background: passwordStrength >= level
                                  ? STRENGTH_COLORS[passwordStrength]
                                  : 'rgba(44,40,37,0.12)',
                              }} />
                          ))}
                        </div>
                        <span className="font-sans text-[10px] font-medium"
                          style={{ color: STRENGTH_COLORS[passwordStrength] }}>
                          {STRENGTH_LABELS[passwordStrength]}
                        </span>
                      </div>
                    )}
                    {errors.password && (
                      <p className="mt-1.5 font-sans text-[11px] font-light" style={{ color: '#C4714A' }}>
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="signup-confirm"
                      className="block font-sans text-[10px] font-medium tracking-[0.12em] uppercase mb-2"
                      style={{ color: '#2C2825' }}>
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="signup-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={e => update('confirmPassword', e.target.value)}
                        placeholder="Repeat your password" autoComplete="new-password"
                        className="auth-input w-full rounded-lg px-4 py-3 pr-11 text-[13px] font-light"
                        style={{
                          background: 'rgba(44,40,37,0.06)',
                          border: `1px solid ${errors.confirmPassword ? 'rgba(196,113,74,0.7)' : 'rgba(44,40,37,0.15)'}`,
                          color: '#2C2825',
                        }}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: '#A09488' }}>
                        <EyeIcon open={showConfirm} />
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1.5 font-sans text-[11px] font-light" style={{ color: '#C4714A' }}>
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="pt-1">
                    <div className="flex items-start gap-2.5">
                      <button type="button" role="checkbox" aria-checked={form.agreedToTerms}
                        onClick={() => update('agreedToTerms', !form.agreedToTerms)}
                        className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all duration-200 mt-0.5"
                        style={{
                          background: form.agreedToTerms ? '#C4714A' : 'transparent',
                          border: `1px solid ${errors.agreedToTerms
                            ? 'rgba(196,113,74,0.7)'
                            : form.agreedToTerms ? '#C4714A' : 'rgba(44,40,37,0.28)'}`,
                        }}>
                        {form.agreedToTerms && (
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white"
                            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2,6 5,9 10,3" />
                          </svg>
                        )}
                      </button>
                      <span className="font-sans text-[12px] font-light leading-[1.7]" style={{ color: '#A09488' }}>
                        I agree to the{' '}
                        <Link href="/terms" className="underline underline-offset-2" style={{ color: '#C4714A' }}>
                          Terms of Service
                        </Link>{' '}and{' '}
                        <Link href="/privacy" className="underline underline-offset-2" style={{ color: '#C4714A' }}>
                          Privacy Policy
                        </Link>
                      </span>
                    </div>
                    {errors.agreedToTerms && (
                      <p className="mt-1.5 font-sans text-[11px] font-light" style={{ color: '#C4714A' }}>
                        {errors.agreedToTerms}
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

                  {/* Submit */}
                  <div className="pt-1">
                    <button
                      type="submit" disabled={detailsLoading}
                      className="w-full rounded-3xl py-[14px] font-sans text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                      style={{ background: '#C4714A', color: '#EDE8E0' }}>
                      {detailsLoading ? 'Sending OTP…' : 'Send OTP'}
                    </button>
                  </div>
                </form>

                <div className="flex items-center gap-4 my-7">
                  <div className="flex-1 h-px" style={{ background: 'rgba(44,40,37,0.12)' }} />
                  <span className="font-sans text-[9.5px] tracking-[0.12em] uppercase" style={{ color: '#A09488' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(44,40,37,0.12)' }} />
                </div>
                <p className="text-center font-sans font-light" style={{ fontSize: '12.5px', color: '#A09488' }}>
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium" style={{ color: '#C4714A' }}>Sign in</Link>
                </p>
              </>
            )}

            {/* ── Step 2: OTP ──────────────────────────────────────────────── */}
            {step === 'otp' && (
              <>
                <button
                  onClick={() => { setStep('details'); setOtp(''); setOtpError(''); }}
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
                    <span className="font-medium" style={{ color: '#2C2825' }}>{form.email}</span>
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
                    style={{ background: '#C4714A', color: '#EDE8E0' }}>
                    {otpLoading ? 'Creating Account…' : 'Create Account'}
                  </button>

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
                        onClick={handleResend} disabled={resendLoading}
                        className="font-sans text-[12px] font-medium underline-offset-2 hover:underline disabled:opacity-50"
                        style={{ color: '#C4714A' }}>
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
