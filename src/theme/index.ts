// Design tokens sampled from the AOLO Driver UI PDF: monochrome base,
// green for success / online, amber for warnings, red for danger.
export const colors = {
  bg: '#FFFFFF',
  text: '#101010',
  textMuted: '#707070',
  textFaint: '#9A9A9A',
  surface: '#F0F0F0',
  surfaceAlt: '#EAEAEA',
  border: '#E2E2E2',
  borderStrong: '#CFCFCF',
  primary: '#101010',
  onPrimary: '#FFFFFF',

  green: '#0C783C',
  greenSoft: '#E0F4E8',
  amber: '#8A6A00',
  amberSoft: '#FCF0D4',
  orange: '#C0640A',
  red: '#B0241C',
  redSoft: '#FDECEA',

  // locked / dark screens
  dark: '#101010',
  darkCard: '#282828',
  darkText: '#FFFFFF',
  darkMuted: '#A8A8A8',

  map: '#E8E8E4',
  mapRoad: '#FFFFFF',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const radius = { sm: 6, md: 10, lg: 14, pill: 999 } as const;

export const font = {
  h1: { fontSize: 24, fontWeight: '800' as const, color: colors.text },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 15, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  small: { fontSize: 12, color: colors.textMuted },
  tiny: { fontSize: 11, color: colors.textMuted },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
  },
  money: { fontSize: 34, fontWeight: '800' as const, color: colors.text },
};
