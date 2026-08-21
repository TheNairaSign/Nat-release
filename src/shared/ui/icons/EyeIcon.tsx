import { View } from 'react-native';

export function EyeIcon({
  slashed = false,
  color,
  size = 17,
}: {
  slashed?: boolean;
  color: string;
  size?: number;
}) {
  const stroke = Math.max(1.2, size * 0.08);
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size * 0.9,
          height: size * 0.54,
          borderRadius: size,
          borderWidth: stroke,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: size,
            backgroundColor: color,
          }}
        />
      </View>
      {slashed ? (
        <View
          style={{
            position: 'absolute',
            width: size * 0.96,
            height: stroke,
            backgroundColor: color,
            transform: [{ rotate: '-45deg' }],
          }}
        />
      ) : null}
    </View>
  );
}
