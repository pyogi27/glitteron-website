import type { ReactNode } from 'react';
import Logo from '@/components/ui/Logo';

interface AuthBrandPanelProps {
  eyebrow: string;
  headline: ReactNode;
  subtext: string;
  quote: string;
  children?: ReactNode;
}

export default function AuthBrandPanel({
  eyebrow,
  headline,
  subtext,
  quote,
  children,
}: AuthBrandPanelProps) {
  return (
    <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] relative flex-col flex-shrink-0">
      {/* Dark base */}
      <div className="absolute inset-0" style={{ background: '#1A1210' }} />

      {/* Glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            width: '480px',
            height: '480px',
            top: '8%',
            left: '-18%',
            background: 'radial-gradient(circle, rgba(196,113,74,0.17) 0%, transparent 62%)',
            animation: 'flicker1 4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '340px',
            height: '340px',
            bottom: '12%',
            right: '-10%',
            background: 'radial-gradient(circle, rgba(196,113,74,0.13) 0%, transparent 62%)',
            animation: 'flicker2 3s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '180px',
            height: '180px',
            top: '55%',
            left: '38%',
            background: 'radial-gradient(circle, rgba(196,113,74,0.08) 0%, transparent 65%)',
            animation: 'flicker1 5s ease-in-out infinite',
            animationDelay: '1.8s',
          }}
        />
      </div>

      {/* Fine grain texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.18,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-11 xl:px-14 py-11">
        <Logo light />

        {/* Main text */}
        <div className="flex-1 flex flex-col justify-center max-w-[360px] mt-8">
          <p
            className="font-sans text-[9px] tracking-[0.22em] uppercase mb-6"
            style={{ color: 'rgba(237,232,224,0.42)' }}
          >
            {eyebrow}
          </p>
          <h2
            className="font-serif font-light leading-[1.05] mb-6"
            style={{
              fontSize: 'clamp(34px, 3vw, 50px)',
              color: '#EDE8E0',
              letterSpacing: '-0.01em',
            }}
          >
            {headline}
          </h2>
          <p
            className="font-sans font-light leading-[1.85] text-[13px]"
            style={{ color: 'rgba(237,232,224,0.5)' }}
          >
            {subtext}
          </p>

          {children}
        </div>

        {/* Bottom quote */}
        <div
          className="pt-7 border-t"
          style={{ borderColor: 'rgba(237,232,224,0.07)' }}
        >
          <p
            className="font-serif italic leading-[1.75]"
            style={{ fontSize: '14.5px', color: 'rgba(237,232,224,0.32)' }}
          >
            "{quote}"
          </p>
        </div>
      </div>
    </div>
  );
}
