/** Native Flavors palette. */

export const CLAY_FOREST = '#2F4A3A'
export const SUN_AGED_TURMERIC = '#C7922E'
export const RIVER_STONE = '#6E736F'
export const WARM_MILK = '#F6F3EE'
export const SEED_HUSK = '#5A4634'
/** Body copy. One step darker than River Stone so 16px text stays at 4.5:1 on milk. */
export const BODY_INK = '#4A4F4B'

export const FONT_SERIF = '"Playfair Display", Georgia, serif'
export const FONT_SANS = '"Poppins", ui-sans-serif, system-ui, sans-serif'

/** Layout: 60% milk, 30% forest, 10% category accent. */
export const SECTION_PADDING = '80px'
export const CONTENT_MAX = '1100px'
export const BUTTON_RADIUS = '12px'

export const FOREST_DEEP = '#1E3328'
export const FOREST_SAGE = '#4E6B58'

export const GHEE_DAIRY = SUN_AGED_TURMERIC
export const ATTA_GRAINS = SEED_HUSK
export const NATURAL_SWEETENERS = '#8B6A3E'
export const SNACKS = '#6E736F'

export const BRAND_GRADIENT = `linear-gradient(135deg,${FOREST_DEEP} 0%,${CLAY_FOREST} 55%,${FOREST_SAGE} 100%)`

type Tone = { from: string; to: string; grad: string; solid: string }

function tone(solid: string, to: string): Tone {
  return { solid, from: solid, to, grad: `linear-gradient(135deg,${solid},${to})` }
}

/** Category accent colors. Each gradient stays on that accent. */
export const CATEGORY_COLORS: Record<string, Tone> = {
  'Ghee & Dairy': tone(GHEE_DAIRY, '#8F6818'),
  'Atta & Grains': tone(ATTA_GRAINS, '#3E3024'),
  'Natural Sweeteners': tone(NATURAL_SWEETENERS, '#6A4E2C'),
  'Snacks': tone(SNACKS, '#4E524E'),
}

const ALIASES: Array<[RegExp, string]> = [
  [/ghee|dairy/i, 'Ghee & Dairy'],
  [/atta|grain/i, 'Atta & Grains'],
  [/sweet|jaggery/i, 'Natural Sweeteners'],
  [/snack/i, 'Snacks'],
]

export function namedCategoryTone(name: string): Tone | null {
  const exact = CATEGORY_COLORS[name]
  if (exact) return exact
  const alias = ALIASES.find(([pattern]) => pattern.test(name))
  return alias ? CATEGORY_COLORS[alias[1]] : null
}

export function categoryTone(name: string): Tone {
  return namedCategoryTone(name) ?? {
    solid: CLAY_FOREST,
    from: CLAY_FOREST,
    to: RIVER_STONE,
    grad: BRAND_GRADIENT,
  }
}
