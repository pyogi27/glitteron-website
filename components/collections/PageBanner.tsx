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
  title: '',
  subtitle: 'text-[#2C2825]/60',
  // Wraps rather than scrolling the page sideways on phones narrower than the three chips.
  stats: 'flex flex-wrap gap-3 md:gap-4',
  chip: 'bg-[#E2DAD0] px-4 md:px-6 py-4',
  num: 'text-[#A85B3B]',
  label: 'text-[#8B7D6E]',
}

// Text sits on the frosted panel (70% #1A1410 + blur) rather than a scrim. 70% is the floor
// that keeps every line here AA even when the photo behind the panel is pure white.
const ON_PHOTO = {
  // Phones keep the photo uncovered and show only the title, in the dark band beneath it.
  eyebrow: 'hidden md:block text-[#F2C4A8]',
  title: 'max-md:text-[28px] max-md:mb-0',
  subtitle: 'hidden md:block text-[#F7F2EC]/85',
  stats: 'hidden md:flex md:gap-4',
  chip: 'bg-[#1A1410]/40 border border-white/15 backdrop-blur-sm px-6 py-4',
  num: 'text-[#F2C4A8]',
  label: 'text-[#F7F2EC]/80',
}

function Copy({ title, subtitle, stats, eyebrow, tone }: Required<Omit<Props, 'image'>> & { tone: typeof BEIGE }) {
  return (
    <>
      <div className={`text-[11px] font-medium tracking-[0.2em] uppercase ${tone.eyebrow} mb-4`}>{eyebrow}</div>
      <h1 className={`font-serif text-[clamp(36px,5vw,64px)] font-normal leading-[1.1] mb-4 ${tone.title}`}>{title}</h1>
      <p className={`text-[14px] font-normal ${tone.subtitle} max-w-[480px] leading-[1.8] mb-10`}>{subtitle}</p>
      <div className={tone.stats}>
        {stats.map(s => (
          <div key={s.label} className={`${tone.chip} rounded-2xl`}>
            <div className={`font-serif text-[28px] font-normal ${tone.num}`}>{s.num}</div>
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
      <div className="pt-header bg-[#EDE8E0] text-[#2C2825] pb-12 px-6 md:px-12">
        <div className="max-w-[900px] pt-12">
          <Copy {...copy} eyebrow={eyebrow} tone={BEIGE} />
        </div>
      </div>
    )
  }

  return (
    <div className="pt-header bg-[#1A1410]">
      {/* Phones show the whole ~4:1 photo with the copy hidden; md+ lays the copy over it. Height never comes from the image, so nothing shifts when it loads. */}
      <div className="relative isolate flex md:min-h-[560px] flex-col md:justify-end overflow-hidden text-[#F7F2EC]">
        {/* aspect-[4/1] reserves the photo's height on phones; md+ turns it into the full-bleed background. */}
        <div className="relative aspect-[4/1] md:absolute md:inset-0 md:-z-10 md:aspect-auto">
          {/* q=90 (allowed in next.config): the default 75 visibly softened the banner. Optimized rather than
              unoptimized so phones get a sized WebP from Next's cache instead of the full S3 original. */}
          <Image
            src={image.src}
            alt={image.alt}
            fill
            preload
            quality={90}
            sizes="100vw"
            className="object-contain md:object-cover object-center"
          />
        </div>
        {/* No scrim: on md+ the copy sits on its own frosted panel so the photo stays untouched around it.
            On phones only the title is left in here, below the photo. */}
        <div className="px-6 py-5 md:p-12">
          <div className="max-w-[900px] md:w-fit md:rounded-3xl md:bg-[#1A1410]/70 md:backdrop-blur-md md:p-10">
            <Copy {...copy} eyebrow={eyebrow} tone={ON_PHOTO} />
          </div>
        </div>
      </div>
    </div>
  )
}
