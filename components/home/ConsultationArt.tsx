/**
 * Flat vector scenes for the three consultation cards (video, phone, WhatsApp),
 * drawn after the approved mockup: warm blobs behind, a ledge, plants, and the
 * expert as a simple illustrated character. Brand palette from app/globals.css.
 * Ids carry a `cs-` prefix because inline SVG ids are page-global.
 */

const OCHRE = '#C08A3E'
const OCHRE_BRIGHT = '#E0A04A'
const CLAY = '#A85B3B'
const OLIVE = '#5F6650'
const INK = '#14100D'
const BULB = '#FFF1D6'
const WA_GREEN = '#25D366'
const WA_TEAL = '#1F6E5A'
const BLOB = '#4B3B2F'
const BLOB_DARK = '#433428'
const LEDGE = '#2A211B'
const FRAME = '#D8B88E'
const LEAF_DARK = '#3F4A33'
const LEAF = '#55603F'
const HAIR = '#231812'
const SKIN = '#D29A72'
const SKIN_DEEP = '#B9805A'
const END_CALL = '#E5483B'

const ART = 'block h-auto w-full'

// simple-icons 13 WhatsApp mark (CC0), 24x24
const WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'

const Glow = ({ id }: { id: string }) => (
  <radialGradient id={id}>
    <stop offset="0" stopColor={OCHRE} stopOpacity="0.6" />
    <stop offset="1" stopColor={OCHRE} stopOpacity="0" />
  </radialGradient>
)

const Brass = ({ id }: { id: string }) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#E7BE74" />
    <stop offset="1" stopColor="#9C6B2E" />
  </linearGradient>
)

const HangUp = ({ x, y }: { x: number; y: number }) => (
  <path transform={`translate(${x} ${y})`} d="M-8 1q8-7 16 0l-2 4-4-1v-2q-2-1-4 0v2l-4 1z" fill="#fff" />
)

const Sparks = ({ x, y }: { x: number; y: number }) => (
  <path transform={`translate(${x} ${y})`} d="M0 14l6-12M10 20l13-6M12 30h12" stroke={OCHRE_BRIGHT} strokeWidth="3" strokeLinecap="round" />
)

/** A leafy plant in a pot whose rim centre sits at (x, y). */
const Plant = ({ x, y, pot, rim }: { x: number; y: number; pot: string; rim: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 0c-16-14-20-40-8-58 12 18 16 40 8 58z" fill={LEAF_DARK} />
    <path d="M2 0c6-22 22-34 40-34-4 20-20 32-40 34z" fill={LEAF} />
    <path d="M-2 2c-12-4-28 0-38 12 14 6 28 2 38-12z" fill={LEAF} />
    <path d="M-18 4h36l-5 32h-26z" fill={pot} />
    <rect x="-21" y="0" width="42" height="7" rx="2" fill={rim} />
  </g>
)

const Backdrop = ({ blobs }: { blobs: [number, number, number, string][] }) => (
  <>
    <rect width="400" height="250" fill="#3A2F27" />
    {blobs.map(([cx, cy, r, fill]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={fill} />)}
    <rect y="234" width="400" height="16" fill={LEDGE} />
  </>
)

export function VideoCallArt() {
  return (
    <svg viewBox="0 0 400 250" aria-hidden="true" className={ART}>
      <defs>
        <Glow id="cs-v-glow" />
        <Brass id="cs-v-brass" />
        <clipPath id="cs-v-screen"><rect x="128" y="66" width="194" height="134" rx="4" /></clipPath>
        <clipPath id="cs-v-avatar"><circle cx="92" cy="92" r="54" /></clipPath>
      </defs>
      <Backdrop blobs={[[330, 110, 72, BLOB], [40, 225, 80, BLOB_DARK]]} />

      {/* Laptop: the showroom on screen, a brass pendant lit for the camera */}
      <rect x="120" y="58" width="210" height="150" rx="10" fill={INK} />
      <g clipPath="url(#cs-v-screen)">
        <rect x="128" y="66" width="194" height="134" fill="#CDB497" />
        <rect x="200" y="66" width="122" height="134" fill="#7A4E30" />
        <path d={Array.from({ length: 12 }, (_, i) => `M${206 + i * 10} 66v134`).join('')} stroke="#5E3A22" strokeWidth="2" />
        <circle cx="225" cy="134" r="60" fill="url(#cs-v-glow)" />
        <rect x="158" y="160" width="134" height="22" rx="6" fill="#E6D8C3" />
        <rect x="150" y="174" width="150" height="30" rx="8" fill="#D9C8B0" />
        <path d="M154 172c-8-6-10-18-4-26 6 8 7 18 4 26zM155 172c2-10 10-16 18-16-2 9-9 15-18 16z" fill={OLIVE} />
        <path d="M146 172h18l-3 16h-12z" fill={CLAY} />
        <path d="M225 66v32" stroke={HAIR} strokeWidth="1.5" />
        <path d="M195 130c0-20 13-32 30-32s30 12 30 32z" fill="url(#cs-v-brass)" />
        <ellipse cx="225" cy="130" rx="30" ry="4" fill="#7A5226" />
        <circle cx="225" cy="135" r="6" fill={BULB} />
        <g transform="translate(300 96)">
          <circle r="12" fill="#fff" />
          <rect x="-7" y="-4" width="9" height="8" rx="1.5" fill={INK} />
          <path d="M3-2l4-2.5v9L3 2z" fill={INK} />
        </g>
        <g transform="translate(300 130)">
          <circle r="12" fill="#fff" />
          <rect x="-2.5" y="-7" width="5" height="9" rx="2.5" fill={INK} />
          <path d="M-5 0a5 5 0 0 0 10 0M0 5v2.5" stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
        <circle cx="300" cy="166" r="12" fill={END_CALL} />
        <HangUp x={300} y={165} />
      </g>
      <rect x="100" y="206" width="250" height="9" rx="4.5" fill="#D9D3CA" />
      <rect x="200" y="206" width="50" height="3" rx="1.5" fill="#B5ADA2" />

      <Plant x={362} y={198} pot="#D9A441" rim="#E8B954" />

      {/* The expert, waving from the call bubble */}
      <path d="M124 128l26 24-34-6z" fill="#fff" />
      <circle cx="92" cy="92" r="58" fill="#fff" />
      <circle cx="92" cy="92" r="54" fill="#F4EBDD" />
      <g clipPath="url(#cs-v-avatar)">
        <path d="M66 86c0-24 12-38 28-38s28 14 28 38v40H66z" fill={HAIR} />
        <path d="M46 150c2-22 18-34 46-34s44 12 46 34z" fill="#C8913E" />
        <path d="M82 118l10 24 10-24z" fill="#F7F1E8" />
        <path d="M80 117l12 26-16-10zM104 117l-12 26 16-10z" fill="#A87430" />
        <rect x="86" y="100" width="12" height="18" rx="4" fill={SKIN} />
        <ellipse cx="92" cy="84" rx="16" ry="19" fill={SKIN} />
        <path d="M75 86c-1-17 7-26 17-26s18 9 17 26c-3-10-9-15-17-16-8 1-14 6-17 16z" fill={HAIR} />
        <circle cx="86" cy="86" r="1.8" fill={HAIR} />
        <circle cx="98" cy="86" r="1.8" fill={HAIR} />
        <path d="M83 81q3-2 6 0M95 81q3-2 6 0" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M87 93q5 4 10 0" stroke="#8A3B2A" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <circle cx="82" cy="91" r="2.6" fill={CLAY} opacity="0.25" />
        <circle cx="102" cy="91" r="2.6" fill={CLAY} opacity="0.25" />
        <circle cx="76" cy="92" r="1.6" fill={OCHRE} />
        <circle cx="108" cy="92" r="1.6" fill={OCHRE} />
      </g>
      <path d="M118 140l16-26" stroke="#C8913E" strokeWidth="12" strokeLinecap="round" />
      <ellipse cx="137" cy="109" rx="6" ry="7" fill={SKIN} />
      <path d="M139 103l3-6M141 106l5-4" stroke={SKIN} strokeWidth="2.4" strokeLinecap="round" />
      <Sparks x={150} y={24} />
    </svg>
  )
}

export function PhoneCallArt() {
  return (
    <svg viewBox="0 0 400 250" aria-hidden="true" className={ART}>
      <defs>
        <clipPath id="cs-p-avatar"><circle cx="205" cy="98" r="34" /></clipPath>
      </defs>
      <Backdrop blobs={[[205, 140, 92, BLOB], [60, 205, 60, BLOB_DARK]]} />

      {/* Dry leaves, left */}
      <g transform="translate(92 240)">
        <path d="M0 0c-20-20-24-50-8-72 14 22 18 50 8 72z" fill="#5A4433" />
        <path d="M6 0c4-30 24-48 48-50-4 28-24 46-48 50z" fill="#6B5140" />
        <path d="M-4 2c-18-6-38 0-50 16 20 6 38 0 50-16z" fill="#6B5140" />
        <path d="M0 0c-4-24-6-44-8-72M6 0c12-18 28-36 48-50M-4 2c-16 4-32 8-50 16" stroke="#3A2C22" strokeWidth="1.2" fill="none" />
      </g>

      {/* Ringing */}
      <g stroke={OCHRE_BRIGHT} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M134 94q-14 28 0 56M290 86q14 28 0 56" />
        <path d="M118 84q-20 38 0 76M306 76q20 38 0 76" opacity="0.6" />
      </g>

      <g transform="rotate(10 205 125)">
        <rect x="150" y="12" width="110" height="226" rx="20" fill={INK} stroke={FRAME} strokeWidth="3" />
        <rect x="157" y="19" width="96" height="212" rx="14" fill="#2A201A" />
        <rect x="190" y="26" width="30" height="4" rx="2" fill="#000" />

        {/* The expert */}
        <circle cx="205" cy="98" r="40" fill="none" stroke={OCHRE} strokeOpacity="0.3" strokeWidth="2" />
        <circle cx="205" cy="98" r="34" fill="#D9A441" />
        <g clipPath="url(#cs-p-avatar)">
          <path d="M169 140c2-16 14-24 36-24s34 8 36 24z" fill="#2A2420" />
          <path d="M197 116l8 9 8-9" stroke="#3E3530" strokeWidth="3" fill="none" strokeLinejoin="round" />
          <rect x="199" y="102" width="12" height="15" rx="4" fill={SKIN_DEEP} />
          <ellipse cx="191" cy="89" rx="2.2" ry="3.6" fill={SKIN_DEEP} />
          <ellipse cx="219" cy="89" rx="2.2" ry="3.6" fill={SKIN_DEEP} />
          <ellipse cx="205" cy="88" rx="14" ry="17" fill={SKIN_DEEP} />
          <path d="M190 84c-1-14 7-21 16-21 10 0 16 7 15 20-3-6-8-9-15-9-7 0-12 4-16 10z" fill={HAIR} />
          <path d="M191 88c0 12 6 19 14 19s14-7 14-19c-2 6-6 8-14 8s-12-2-14-8z" fill={HAIR} />
          <path d="M200 98q5 3 10 0" stroke="#F4EBDD" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <circle cx="200" cy="86" r="1.6" fill={HAIR} />
          <circle cx="210" cy="86" r="1.6" fill={HAIR} />
          <path d="M197 81.5q3-1.6 6 0M207 81.5q3-1.6 6 0" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </g>

        {/* Mute, end, speaker */}
        <g transform="translate(177 196)">
          <circle r="11" fill="#57504A" />
          <rect x="-2.5" y="-6" width="5" height="8" rx="2.5" fill="#fff" />
          <path d="M-5 0a5 5 0 0 0 10 0M0 5v2M-6-6l12 12" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
        <circle cx="205" cy="198" r="13" fill={END_CALL} />
        <HangUp x={205} y={197} />
        <g transform="translate(233 196)">
          <circle r="11" fill="#57504A" />
          <path d="M-6-2h3l4-4v12l-4-4h-3z" fill="#fff" />
          <path d="M3-3q3 3 0 6M5-6q6 6 0 12" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}

export function WhatsAppArt() {
  return (
    <svg viewBox="0 0 400 250" aria-hidden="true" className={ART}>
      <defs>
        <Glow id="cs-w-glow" />
        <Brass id="cs-w-brass" />
      </defs>
      <Backdrop blobs={[[330, 120, 70, BLOB], [110, 215, 75, BLOB_DARK]]} />

      <Plant x={106} y={200} pot="#E8DCC6" rim="#F2E8D6" />

      {/* Phone, running off the bottom edge */}
      <rect x="210" y="18" width="140" height="250" rx="20" fill={INK} stroke={FRAME} strokeWidth="3" />
      <rect x="217" y="25" width="126" height="240" rx="14" fill="#F1ECE4" />
      <rect x="217" y="25" width="126" height="34" rx="14" fill={WA_TEAL} />
      <rect x="217" y="45" width="126" height="14" fill={WA_TEAL} />
      <rect x="260" y="25" width="40" height="7" rx="3.5" fill={INK} />
      <path d="M229 46h11M229 46l4-4M229 46l4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="330" cy="46" r="5" stroke="#fff" strokeWidth="1.6" fill="none" />

      {/* Chat cards spilling past the screen: a pendant pick, then a chandelier */}
      <rect x="168" y="86" width="170" height="70" rx="10" fill="#000" opacity="0.22" />
      <rect x="165" y="82" width="170" height="70" rx="10" fill="#fff" />
      <rect x="177" y="96" width="74" height="6" rx="3" fill="#D5CEC4" />
      <rect x="177" y="108" width="60" height="6" rx="3" fill="#D5CEC4" />
      <rect x="177" y="120" width="46" height="6" rx="3" fill="#D5CEC4" />
      <rect x="265" y="90" width="60" height="54" rx="6" fill="#7A4E30" />
      <circle cx="295" cy="124" r="24" fill="url(#cs-w-glow)" />
      <path d="M295 90v18" stroke={HAIR} strokeWidth="1.2" />
      <path d="M284 122c0-9 5-14 11-14s11 5 11 14z" fill="url(#cs-w-brass)" />
      <circle cx="295" cy="124" r="3.5" fill={BULB} />

      <rect x="193" y="166" width="180" height="72" rx="10" fill="#000" opacity="0.22" />
      <rect x="190" y="162" width="180" height="72" rx="10" fill="#D3EDD3" />
      <rect x="202" y="178" width="84" height="6" rx="3" fill="#A9C9A9" />
      <rect x="202" y="190" width="70" height="6" rx="3" fill="#A9C9A9" />
      <rect x="202" y="202" width="52" height="6" rx="3" fill="#A9C9A9" />
      <rect x="298" y="170" width="62" height="56" rx="6" fill="#3A2A20" />
      <circle cx="329" cy="200" r="28" fill="url(#cs-w-glow)" />
      <path d="M329 170v14M313 196q16 10 32 0M329 184l-14 10M329 184l14 10M329 184v14" stroke={OCHRE} strokeWidth="1.3" fill="none" />
      <g fill={BULB}>
        <circle cx="313" cy="194" r="2.6" />
        <circle cx="321" cy="199" r="2.6" />
        <circle cx="329" cy="201" r="2.6" />
        <circle cx="337" cy="199" r="2.6" />
        <circle cx="345" cy="194" r="2.6" />
      </g>

      {/* WhatsApp badge */}
      <path d="M152 78l-12 18 22-8z" fill="#fff" />
      <circle cx="172" cy="62" r="30" fill="#fff" />
      <circle cx="172" cy="62" r="26" fill={WA_GREEN} />
      <path transform="translate(158 48) scale(1.17)" d={WA_PATH} fill="#fff" />
      <Sparks x={356} y={40} />
    </svg>
  )
}
