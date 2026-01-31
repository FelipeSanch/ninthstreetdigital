export interface Project {
  slug: string;
  name: string;
  type: string;
  location: string;
  url: string;
  color: string;
  description: string;
  challenge: string;
  solution: string;
  features: string[];
}

export const projects: Project[] = [
  {
    slug: "golden-crust-bakery",
    name: "Golden Crust Bakery",
    type: "Bakery & Cafe",
    location: "Portland, OR",
    url: "https://golden-crust-bakery.ninthstreetdigital.com",
    color: "#C17D3A",
    description:
      "A neighborhood bakery known for artisan breads and custom cakes needed an online presence that captured the warmth and craft of their shop.",
    challenge:
      "Golden Crust had zero web presence and was losing foot traffic to competitors with online ordering. They needed something that felt handmade, not corporate.",
    solution:
      "We built a warm, editorial-style site with rich earth tones and photography that makes you smell the bread. The design emphasizes their craft and story over flashy features.",
    features: [
      "Custom photography integration",
      "Service showcase with descriptions",
      "Contact section with hours and location",
      "Mobile-optimized for on-the-go searches",
    ],
  },
  {
    slug: "southside-barber-co",
    name: "Southside Barber Co.",
    type: "Barber Shop",
    location: "Chicago, IL",
    url: "https://southside-barber-co.ninthstreetdigital.com",
    color: "#B8754A",
    description:
      "A classic barbershop in Chicago's South Side wanted a site that matched their no-nonsense, quality-first approach to men's grooming.",
    challenge:
      "Their old site was a template that looked like every other barber in the city. They needed something with character that drove bookings.",
    solution:
      "Bold typography and real photography set the tone. The layout is direct — services, prices, and a prominent booking CTA. No clutter.",
    features: [
      "Bold hero with real shop photography",
      "Service menu with pricing",
      "Click-to-call and email CTAs",
      "Responsive across all devices",
    ],
  },
  {
    slug: "verde-lawn-garden",
    name: "Verde Lawn & Garden",
    type: "Landscaping",
    location: "Austin, TX",
    url: "https://verde-lawn-garden.ninthstreetdigital.com",
    color: "#2D5A27",
    description:
      "A full-service landscaping company in Austin needed a professional site to compete for residential and commercial contracts.",
    challenge:
      "Verde was getting passed over for larger competitors with better websites, despite doing superior work. First impressions were costing them jobs.",
    solution:
      "Clean, green-forward design with large landscape photography. The site positions them as premium professionals, not just a guy with a mower.",
    features: [
      "Full-bleed hero imagery",
      "Service breakdown with descriptions",
      "Consultation request CTA",
      "Trust-building about section",
    ],
  },
  {
    slug: "mesa-roja-kitchen",
    name: "Mesa Roja Kitchen",
    type: "Restaurant",
    location: "San Antonio, TX",
    url: "https://mesa-roja-kitchen.ninthstreetdigital.com",
    color: "#B83A2A",
    description:
      "A family-owned Mexican restaurant serving authentic regional dishes wanted a site that captured the warmth and vibrancy of their dining experience.",
    challenge:
      "Mesa Roja relied entirely on word-of-mouth and social media. They had no dedicated site, and their Google listing was bare.",
    solution:
      "Rich, warm colors and food photography that makes you hungry. The site highlights their family story and menu, with easy access to hours and location.",
    features: [
      "Vibrant food photography",
      "Menu highlights section",
      "Location and hours prominently displayed",
      "Mobile-first for dine-in searchers",
    ],
  },
  {
    slug: "bright-smile-dental",
    name: "Bright Smile Dental",
    type: "Dental Practice",
    location: "Denver, CO",
    url: "https://bright-smile-dental.ninthstreetdigital.com",
    color: "#2A7AB8",
    description:
      "A modern family dental practice needed a site that felt welcoming and professional — not clinical and cold like most dental websites.",
    challenge:
      "Dental sites are notoriously generic. Bright Smile wanted to stand out and make nervous patients feel at ease before they even walked in.",
    solution:
      "Clean blues and warm whites create a calming feel. Real imagery over stock photos. The copy is friendly, not medical jargon.",
    features: [
      "Calming, trust-building design",
      "Service overview with clear descriptions",
      "Emergency appointment CTA",
      "Insurance and new patient info",
    ],
  },
  {
    slug: "iron-district-fitness",
    name: "Iron District Fitness",
    type: "Gym & Training",
    location: "Brooklyn, NY",
    url: "https://iron-district-fitness.ninthstreetdigital.com",
    color: "#3A3A3A",
    description:
      "A no-frills strength gym in Brooklyn needed a site as straightforward as their training philosophy — all substance, no gimmicks.",
    challenge:
      "Iron District had a DIY site that looked dated and didn't convey the energy of the gym. Memberships were flat.",
    solution:
      "Dark, bold design with strong typography that matches the gym's intensity. Clean layout focused on getting people through the door.",
    features: [
      "High-energy visual design",
      "Class schedule and training options",
      "Membership inquiry CTA",
      "Trainer profiles section",
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
