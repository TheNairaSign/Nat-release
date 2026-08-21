import { TextInput, View } from 'react-native';

import { formatCuPerItem, type MaterialLine } from '@/core/dropoff';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';

export function MaterialQuantityList({
  lines,
  quantities,
  onChange,
  loading,
}: {
  lines: MaterialLine[];
  quantities: Record<string, string>;
  onChange: (id: string, value: string) => void;
  loading?: boolean;
}) {
  const theme = useTheme();
  if (loading && lines.length === 0) {
    return (
      <Text variant="small" muted style={{ marginTop: 8 }}>
        Loading accepted materials…
      </Text>
    );
  }
  return (
    <View style={{ marginTop: 8, gap: 8 }}>
      {lines.map((line) => {
        const cu = formatCuPerItem(line.cuValue);
        return (
          <View
            key={line.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.color.band,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: theme.color.lime,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: theme.font.bold }}>
                {line.name.slice(0, 1)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: theme.font.medium }} numberOfLines={1}>
                {line.name}
              </Text>
              <Text variant="small" muted numberOfLines={1}>
                {[cu, line.unit].filter(Boolean).join(' · ')}
              </Text>
              <TextInput
                testID={`qty-${line.id}`}
                keyboardType="number-pad"
                value={quantities[line.id] ?? ''}
                placeholder={`Qty (${line.unit})`}
                placeholderTextColor={theme.color.placeholder}
                onChangeText={(value) => {
                  if (value === '' || /^\d+$/.test(value))
                    onChange(line.id, value);
                }}
                style={{
                  marginTop: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.color.surface,
                  color: theme.color.text,
                  fontSize: 14,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function QuantityStepperNote({ estimated }: { estimated: number }) {
  const theme = useTheme();
  if (estimated <= 0) return null;
  return (
    <Text
      variant="small"
      style={{ marginTop: 8, fontFamily: theme.font.semibold }}
    >
      Estimated impact: {Math.round(estimated * 100) / 100} CU
    </Text>
  );
}
