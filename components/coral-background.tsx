import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

export function CoralBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#F8F9FB', '#FFFBFA', '#F4F6F9']}
        locations={[0, 0.44, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.coralGlow]} />
      <View style={[styles.glow, styles.orangeGlow]} />
      <View style={[styles.glow, styles.bottomGlow]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.18,
  },
  coralGlow: {
    width: 245,
    height: 245,
    right: -112,
    top: 82,
    backgroundColor: '#FFB0A8',
  },
  orangeGlow: {
    width: 205,
    height: 205,
    right: -92,
    top: 188,
    backgroundColor: '#FFB255',
  },
  bottomGlow: {
    width: 300,
    height: 300,
    left: -180,
    bottom: 80,
    backgroundColor: '#FFE1D4',
    opacity: 0.14,
  },
});
