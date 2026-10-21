import Image from 'next/image'

interface Stat { num: string; label: string }
interface Props {
  title: string
  subtitle: string
  stats: Stat[]
  /** Eyebrow label above the title. Defaults to 'Collections'. */
  eyebrow?: string
  /** Admin-uploaded category banner. When set it becomes the hero's background, under the fixed header. */
  image?: { src: string; alt: string }
}

const BEIGE = {
  eyebrow: 'text-[#A85B3B]',
  subtitle: 'text-[#2C2825]/60',
  chip: 'bg-[#E2DAD0]',
  num: 'text-[#A85B3B]',
  label: 'text-[#8B7D6E]',
}

// Every value is AA against the scrim even when the photo behind it is pure white:
// the scrim never drops below 75% #1A1410 where text sits.
const ON_PHOTO = {
  eyebrow: 'text-[#F2C4A8]',
  subtitle: 'text-[#F7F2EC]/85',
  chip: 'bg-[#1A1410]/40 border border-white/15 backdrop-blur-sm',
  num: 'text-[#F2C4A8]',
  label: 'text-[#F7F2EC]/80',
}

function Copy({ title, subtitle, stats, eyebrow, tone }: Required<Omit<Props, 'image'>> & { tone: typeof BEIGE }) {
  return (
    <>
      <div className={`text-[11px] font-medium tracking-[0.2em] uppercase ${tone.eyebrow} mb-4`}>{eyebrow}</div>
      <h1 className="font-serif text-[clamp(36px,5vw,64px)] font-light leading-[1.1] mb-4">{title}</h1>
      <p className={`text-[14px] font-light ${tone.subtitle} max-w-[480px] leading-[1.8] mb-10`}>{subtitle}</p>
      <div className="flex gap-4">
        {stats.map(s => (
          <div key={s.label} className={`${tone.chip} rounded-2xl px-6 py-4`}>
            <div className={`font-serif text-[28px] font-light ${tone.num}`}>{s.num}</div>
            <div className={`text-[10px] font-medium tracking-[0.14em] uppercase ${tone.label} mt-1`}>{s.label}</div>
          </div>
        ))}
      </div>
    </>
  )
}

export default function PageBanner({ image, eyebrow = 'Collections', ...copy }: Props) {
  if (!image) {
    return (
      <div className="pt-header bg-[#EDE8E0] text-[#2C2825] pb-12 px-12">
        <div className="max-w-[900px] pt-12">
          <Copy {...copy} eyebrow={eyebrow} tone={BEIGE} />
        </div>
      </div>
    )
  }

  return (
    <div className="pt-header bg-[#1A1410]">
      {/* Height comes from the copy and min-height, never the image, so nothing shifts when it loads. */}
      <div className="relative isolate flex min-h-[480px] md:min-h-[560px] flex-col justify-end overflow-hidden text-[#F7F2EC]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          preload
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
        {/* Desktop scrim: dark under the copy column (≤ 948px wide), clearing to the photo on the right. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 hidden md:block bg-[linear-gradient(to_right,rgb(26_20_16/0.8),rgb(26_20_16/0.75)_min(62rem,100%),rgb(26_20_16/0))]"
        />
        {/* Phone scrim rides on the copy itself, since wrapped titles make its height unknown;
            it fades out across the top 10rem so the photo shows above the text. */}
        <div className="px-12 pt-40 pb-12 bg-[linear-gradient(to_top,rgb(26_20_16/0.85),rgb(26_20_16/0.75)_calc(100%_-_10rem),rgb(26_20_16/0))] md:bg-none md:pt-12">
          <div className="max-w-[900px]">
            <Copy {...copy} eyebrow={eyebrow} tone={ON_PHOTO} />
          </div>
        </div>
      </div>
    </div>
  )
}
