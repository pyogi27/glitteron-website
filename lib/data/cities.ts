import type { CategoryFaq } from './categories'

/**
 * City landing pages — `/lighting/mumbai`.
 *
 * These are delivery-area pages, NOT store pages. LitMeUp has one address, the
 * Surat workshop, and every one of these pages says so. Competitors with real
 * showrooms in nine cities rank on `/bangalore-store`; inventing the equivalent
 * here would be a fabricated local presence, which is both a lie to the
 * customer and a Google spam violation.
 *
 * What makes each page non-duplicate is real: distance from the workshop, and
 * the finish and fixture advice that city's climate and housing stock actually
 * calls for. If a city cannot be given something true and specific, it does not
 * get a page.
 */
export interface City {
  slug: string
  /** Display name, as used in headings and titles. */
  name: string
  state: string
  title: string
  description: string
  subtitle: string
  intro: string[]
  faqs: CategoryFaq[]
}

/** Every city page repeats these, because they are true everywhere in India. */
const commonFaqs = (city: string): CategoryFaq[] => [
  {
    question: `Do you deliver to ${city}?`,
    answer: `Yes. Shipping to ${city} is free on every order with no minimum value, and delivery is 5 to 7 days from dispatch by registered courier, tracked by email.`,
  },
  {
    question: `Do you have a showroom in ${city}?`,
    answer: `No. LitMeUp sells direct from its workshop in Surat, Gujarat — there is no ${city} showroom, and no dealer margin in the price. You are welcome to visit the workshop, Monday to Saturday, 10am to 7pm.`,
  },
  {
    question: 'What if a fixture arrives damaged?',
    answer:
      'Report it within 24 hours of delivery with photographs and a replacement ships within 3 days of the item reaching us. Every fixture also carries a 5-year warranty against manufacturing defects and a 7-day return window.',
  },
]

export const cities: City[] = [
  {
    slug: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    title: 'Buy Decorative Lights Online in Mumbai — Free Delivery',
    description:
      'Handcrafted chandeliers, pendants and wall lights delivered free across Mumbai from our Surat workshop, about 280 km away. 5-year warranty, 7-day returns.',
    subtitle: 'Shipped free to Mumbai from the workshop, about 280 km up the coast.',
    intro: [
      'Mumbai is the closest metro to our workshop — roughly 280 km down the coast from Surat — and every order ships free by registered courier, arriving 5 to 7 days from dispatch.',
      'Coastal air is the thing worth planning around here. Salt-laden humidity is hard on untreated metal, so in Mumbai we would steer you toward lacquered brass or powder-coated steel over a raw finish, particularly for anything near an open window or a sea-facing balcony.',
      'The city’s flats also argue for particular fixtures. A 9 to 10 foot slab in a high-rise does not have the headroom for a tiered chandelier; flush and semi-flush ceiling lights, compact single pendants and wall lights do far more for a Mumbai living room than a fixture scaled for a farmhouse.',
    ],
    faqs: [
      ...commonFaqs('Mumbai'),
      {
        question: 'Which finishes hold up best in Mumbai’s humidity?',
        answer:
          'Lacquered brass and powder-coated steel. Both are sealed against moisture, which matters within a few kilometres of the sea. An unlacquered finish will patina faster in Mumbai than in an inland city — some people want exactly that, but it should be a choice.',
      },
    ],
  },
  {
    slug: 'delhi',
    name: 'Delhi NCR',
    state: 'Delhi',
    title: 'Buy Decorative Lights Online in Delhi NCR — Free Delivery',
    description:
      'Handcrafted chandeliers, pendants and wall lights delivered free across Delhi, Gurugram and Noida. Direct from our Surat workshop, 5-year warranty.',
    subtitle: 'Free delivery to Delhi, Gurugram, Noida and Faridabad.',
    intro: [
      'Delhi NCR is about 1,150 km north of the workshop. Orders ship free by registered courier to Delhi, Gurugram, Noida, Ghaziabad and Faridabad, arriving 5 to 7 days from dispatch.',
      'NCR housing stock rewards bigger fixtures than most Indian cities. Builder floors, independent houses and the double-height entrances common in Gurugram give you the ceiling height a tiered chandelier needs — the sizing rule (room length plus width in feet, read as inches) often lands NCR buyers at 32 inches and above where a Mumbai flat lands at 24.',
      'Dust is the practical consideration. An enclosed glass shade needs wiping a fraction as often as an open frame with exposed lamps, which is worth thinking about on a fixture hanging twelve feet up a stairwell.',
    ],
    faqs: [
      ...commonFaqs('Delhi NCR'),
      {
        question: 'Do you deliver to Gurugram and Noida as well as Delhi?',
        answer:
          'Yes — the whole NCR, including Gurugram, Noida, Ghaziabad and Faridabad, on the same free shipping and the same 5 to 7 day window from dispatch.',
      },
    ],
  },
  {
    slug: 'bangalore',
    name: 'Bangalore',
    state: 'Karnataka',
    title: 'Buy Decorative Lights Online in Bangalore — Free Delivery',
    description:
      'Handcrafted chandeliers, pendants and wall lights delivered free across Bangalore from our Surat workshop. 5-year warranty, 7-day returns, dimmable as standard.',
    subtitle: 'Free delivery across Bangalore, direct from the workshop.',
    intro: [
      'Bangalore is roughly 1,300 km south of Surat. Orders ship free by registered courier and arrive 5 to 7 days from dispatch, tracked by email.',
      'Bangalore is the easiest major city to specify for: moderate temperatures, no coastal salt, and none of the humidity load that shortens the life of an unsealed finish in Mumbai or Chennai. Raw and unlacquered brass age slowly and gracefully here.',
      'Apartment ceilings across the city sit at the familiar 9 to 10 feet, which puts semi-flush ceiling lights and single pendants ahead of tiered chandeliers in most flats — though the older independent houses in Malleshwaram and Basavanagudi often have the height for something larger.',
    ],
    faqs: commonFaqs('Bangalore'),
  },
  {
    slug: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    title: 'Buy Decorative Lights Online in Hyderabad — Free Delivery',
    description:
      'Handcrafted chandeliers, pendants and wall lights delivered free across Hyderabad from our Surat workshop. 5-year warranty, 7-day returns.',
    subtitle: 'Free delivery across Hyderabad and Secunderabad.',
    intro: [
      'Hyderabad is about 1,000 km south-east of the workshop. Shipping is free, by registered courier, 5 to 7 days from dispatch.',
      'The climate here is dry, which is good news for finishes — there is no humidity penalty on unlacquered brass, and no reason to rule out an open frame on corrosion grounds.',
      'New construction in the western corridor tends toward generous ceiling heights and double-height living rooms, which is where a two-tier chandelier earns its keep. Size to the room, not the furniture: length plus width in feet, read as inches, gives you the diameter to aim for.',
    ],
    faqs: commonFaqs('Hyderabad'),
  },
  {
    slug: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    title: 'Buy Decorative Lights Online in Chennai — Free Delivery',
    description:
      'Handcrafted chandeliers, pendants and wall lights delivered free across Chennai. Humidity-resistant finishes, 5-year warranty, 7-day returns.',
    subtitle: 'Free delivery to Chennai, with finishes chosen for coastal air.',
    intro: [
      'Chennai is roughly 1,600 km from the workshop by road. Orders ship free by registered courier and arrive 5 to 7 days from dispatch.',
      'Like Mumbai, Chennai is a coastal city and the air carries salt. Lacquered brass and powder-coated steel are the sensible specification, especially in Besant Nagar, Thiruvanmiyur and anywhere else within reach of the sea breeze; an unsealed finish will move faster here than inland.',
      'Heat argues for how you light rather than what you hang. Warm 2700K light reads as hotter in a room that is already hot — a lot of Chennai homes are more comfortable on a neutral 3000K to 3500K in living areas, with the fixture on a dimmer.',
    ],
    faqs: [
      ...commonFaqs('Chennai'),
      {
        question: 'Which finishes suit Chennai’s coastal climate?',
        answer:
          'Lacquered brass and powder-coated steel, both sealed against salt-laden humidity. Reserve unlacquered finishes for rooms well away from open sea-facing windows.',
      },
    ],
  },
  {
    slug: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    title: 'Buy Decorative Lights Online in Pune — Free Delivery',
    description:
      'Handcrafted chandeliers, pendants and wall lights delivered free across Pune from our Surat workshop, about 450 km away. 5-year warranty, 7-day returns.',
    subtitle: 'Free delivery to Pune, about 450 km from the workshop.',
    intro: [
      'Pune sits about 450 km from Surat, making it one of the nearer metros we ship to. Delivery is free by registered courier, 5 to 7 days from dispatch.',
      'Pune’s inland climate is kinder to metal than the coast an hour and a half west of it. Unlacquered brass is a reasonable choice here in a way it is not in Mumbai, and open frames need less upkeep.',
      'Much of the newer housing in Baner, Kharadi and Hinjawadi follows the standard 9 to 10 foot apartment slab. That points at semi-flush ceiling fixtures and single pendants; the older bungalows in Koregaon Park and Deccan carry a full chandelier comfortably.',
    ],
    faqs: commonFaqs('Pune'),
  },
  {
    slug: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    title: 'Buy Decorative Lights Online in Ahmedabad — Free Delivery',
    description:
      'Handcrafted chandeliers, pendants and wall lights delivered free across Ahmedabad from our Surat workshop, 265 km away in the same state.',
    subtitle: 'Free delivery to Ahmedabad — same state, 265 km up the road.',
    intro: [
      'Ahmedabad is the closest major city to the workshop, about 265 km north on the same highway. Orders ship free by registered courier and arrive 5 to 7 days from dispatch.',
      'It is also the easiest city for us to invite you to visit from. The workshop is in Udhana, Surat, open Monday to Saturday, 10am to 7pm, and seeing a fixture lit in person settles questions about finish and scale that no photograph does.',
      'Ahmedabad’s dry heat puts no particular load on a finish, so the choice is aesthetic rather than practical. Unlacquered brass will patina slowly; lacquered brass and powder-coated steel will hold their colour indefinitely.',
    ],
    faqs: commonFaqs('Ahmedabad'),
  },
  {
    slug: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    title: 'Buy Decorative Lights Online in Kolkata — Free Delivery',
    description:
      'Handcrafted chandeliers, pendants and wall lights delivered free across Kolkata. Sealed finishes for a humid climate, 5-year warranty, 7-day returns.',
    subtitle: 'Free delivery to Kolkata, with finishes chosen for humidity.',
    intro: [
      'Kolkata is the furthest metro we ship to, about 1,900 km east of the workshop. Delivery is still free and still 5 to 7 days from dispatch by registered courier.',
      'Humidity here runs high for much of the year, so sealed finishes — lacquered brass, powder-coated steel — are the safer specification, much as they are on the west coast.',
      'Kolkata also has more genuinely old housing stock than most Indian cities, and those high-ceilinged rooms in the south and centre of the city are among the few that can take a large tiered chandelier hung at full drop. If you have twelve feet to work with, use them.',
    ],
    faqs: commonFaqs('Kolkata'),
  },
]

export function getCityBySlug(slug: string): City | undefined {
  return cities.find(city => city.slug === slug)
}
