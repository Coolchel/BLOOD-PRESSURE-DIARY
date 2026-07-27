// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

import { AppSymbolName } from './icon-types';

type IconMapping = Record<AppSymbolName, ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'clock.fill': 'history',
  'chart.line.uptrend.xyaxis': 'insights',
  'gearshape.fill': 'settings',
  'arrow.up.circle': 'arrow-upward',
  'arrow.down.circle': 'arrow-downward',
  'waveform.path.ecg': 'monitor-heart',
  calendar: 'calendar-today',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  plus: 'add',
  ellipsis: 'more-horiz',
  'delete.left': 'backspace',
  checkmark: 'check',
  xmark: 'close',
  'square.and.arrow.up': 'ios-share',
  'square.and.arrow.down': 'file-download',
  trash: 'delete-outline',
  'arrow.counterclockwise': 'refresh',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: AppSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
