export const Palette = {
  background: '#F6F3EC',
  surface: '#FDFBF6',
  surfaceStrong: '#FDFBF6',
  text: '#292D29',
  muted: '#6D7268',
  subtle: '#8C9286',
  coral: '#495B35',
  coralSoft: '#E6E9D9',
  orange: '#A96943',
  orangeSoft: '#F3EAE0',
  line: '#DCDED1',
  shadow: '#72796C',
  white: '#FFFFFF',
  success: '#495B35',
  pulse: '#4F7188',
  wellbeing: '#8B6B2F',
  wellbeingSoft: '#F2EAD8',
  danger: '#A96E70',
} as const;

export const Radius = {
  small: 10,
  medium: 14,
  large: 18,
  pill: 999,
} as const;

export const Spacing = {
  screen: 20,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
} as const;

export const Shadow = {
  card: {
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 6,
  },
  button: {
    shadowColor: Palette.coral,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
} as const;
