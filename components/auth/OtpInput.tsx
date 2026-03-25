'use client';

import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export default function OtpInput({ value, onChange, error, disabled }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const chars = value.padEnd(6, ' ').split('');
    chars[i] = digit || ' ';
    const next = chars.join('').trimEnd();
    onChange(next);
    if (digit && i < 5) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const chars = value.padEnd(6, ' ').split('');
      if (chars[i]?.trim()) {
        chars[i] = ' ';
        onChange(chars.join('').trimEnd());
      } else if (i > 0) {
        chars[i - 1] = ' ';
        onChange(chars.join('').trimEnd());
        focus(i - 1);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1);
    } else if (e.key === 'ArrowRight' && i < 5) {
      focus(i + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(digits);
    focus(Math.min(digits.length, 5));
  };

  return (
    <div className="flex gap-2 w-full">
      {Array.from({ length: 6 }).map((_, i) => {
        const digit = value[i] ?? '';
        const isFilled = digit.trim() !== '';
        return (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit.trim()}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={e => e.target.select()}
            disabled={disabled}
            aria-label={`OTP digit ${i + 1}`}
            className="auth-input flex-1 aspect-square text-center font-sans font-light rounded-lg transition-all duration-150 disabled:opacity-50"
            style={{
              fontSize: '20px',
              background: 'rgba(44,40,37,0.06)',
              border: `1px solid ${
                error
                  ? 'rgba(196,113,74,0.7)'
                  : isFilled
                    ? 'rgba(196,113,74,0.55)'
                    : 'rgba(44,40,37,0.15)'
              }`,
              color: '#2C2825',
              maxWidth: '56px',
            }}
          />
        );
      })}
    </div>
  );
}
