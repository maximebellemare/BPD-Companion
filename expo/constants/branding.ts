export const BRAND = {
  name: 'BPD Companion',
  tagline: 'Understand. Regulate. Thrive.',
  shortTagline: 'Understand. Regulate. Thrive.',
  supportLine: 'Support for emotional storms and relationship triggers',
} as const;

export const BrandColors = {
  navy: '#020617',
  navyLight: '#0B1238',
  navyMuted: '#15145A',

  teal: '#14B8A6',
  tealLight: '#67E8F9',
  tealMuted: '#14B8A6',
  tealSoft: 'rgba(20, 184, 166, 0.18)',

  purple: '#2E2A72',
  purpleLight: '#3B82F6',
  purpleSoft: 'rgba(46, 42, 114, 0.38)',

  sage: '#14B8A6',
  sageSoft: 'rgba(20, 184, 166, 0.18)',

  mist: '#3B82F6',
  mistSoft: 'rgba(59, 130, 246, 0.2)',

  white: '#FFFFFF',
  warmWhite: '#FFFFFF',
  parchment: 'rgba(255, 255, 255, 0.1)',

  charcoal: '#020617',
  charcoalLight: '#0B1238',

  calm: '#14B8A6',
  calmSoft: 'rgba(20, 184, 166, 0.18)',

  cyan: '#67E8F9',
  cyanSoft: 'rgba(103, 232, 249, 0.18)',

  blue: '#3B82F6',
  blueSoft: 'rgba(59, 130, 246, 0.18)',

  textPrimary: '#FFFFFF',
  textSecondary: '#0B1238',
  textMuted: '#2E2A72',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255, 255, 255, 0.68)',
} as const;

export const BrandTypography = {
  display: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: 0,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 16,
  },
  overline: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
} as const;

export const BrandSpacing = {
  screenPadding: 22,
  cardRadius: 18,
  cardRadiusSmall: 14,
  buttonRadius: 14,
  chipRadius: 24,
  iconRadius: 14,
  sectionGap: 24,
  cardPadding: 18,
  cardShadow: {
    shadowColor: 'rgba(0, 0, 0, 0.36)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  cardShadowLight: {
    shadowColor: 'rgba(0, 0, 0, 0.24)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
} as const;
