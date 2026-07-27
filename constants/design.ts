export const Palette = {
  background: '#F5F6F9',
  surface: 'rgba(255, 255, 255, 0.94)',
  surfaceStrong: '#FFFFFF',
  text: '#18202F',
  muted: '#707888',
  subtle: '#A5ACB8',
  coral: '#FF5E57',
  coralSoft: '#FFF0EE',
  orange: '#FF8A16',
  orangeSoft: '#FFF3E8',
  line: 'rgba(72, 82, 102, 0.11)',
  shadow: '#4E586B',
  white: '#FFFFFF',
  success: '#2AAE8C',
} as const;

export const Radius = {
  small: 14,
  medium: 20,
  large: 28,
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
