// Color mapping from color names to hex values
// Must match ProjectColorSchema in @taskflow/shared
export const PROJECT_COLORS: Record<string, string> = {
  berry_red: '#b8255f',
  red: '#dc2626',
  orange: '#ea580c',
  yellow: '#ca8a04',
  olive_green: '#7c8c03',
  lime_green: '#84cc16',
  green: '#16a34a',
  mint_green: '#10b981',
  teal: '#0d9488',
  sky_blue: '#0ea5e9',
  light_blue: '#38bdf8',
  blue: '#2563eb',
  grape: '#9333ea',
  violet: '#7c3aed',
  lavender: '#a78bfa',
  magenta: '#db2777',
  salmon: '#f87171',
  charcoal: '#36454f',
  grey: '#6b7280',
  taupe: '#8b7355'
};

export function getColorHex(colorName: string): string {
  return PROJECT_COLORS[colorName] || PROJECT_COLORS.charcoal;
}

// For color picker display
export const COLOR_PICKER_OPTIONS = [
  { name: 'charcoal', hex: '#36454f' },
  { name: 'red', hex: '#dc2626' },
  { name: 'orange', hex: '#ea580c' },
  { name: 'yellow', hex: '#ca8a04' },
  { name: 'green', hex: '#16a34a' },
  { name: 'teal', hex: '#0d9488' },
  { name: 'blue', hex: '#2563eb' },
  { name: 'grape', hex: '#9333ea' },
  { name: 'magenta', hex: '#db2777' },
  { name: 'sky_blue', hex: '#0ea5e9' },
  { name: 'mint_green', hex: '#10b981' },
  { name: 'salmon', hex: '#f87171' }
];
