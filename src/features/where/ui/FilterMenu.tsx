import { Modal, Pressable, ScrollView, View } from 'react-native';

import {
  WHERE_FILTERS,
  type MapPartner,
  type WhereFilterId,
} from '@/core/where';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui/Text';

export function FilterMenu({
  open,
  selected,
  organization,
  partners,
  onClose,
  onSelect,
  onSelectOrganization,
}: {
  open: boolean;
  selected: WhereFilterId;
  organization: string | null;
  partners: MapPartner[];
  onClose: () => void;
  onSelect: (id: WhereFilterId) => void;
  onSelectOrganization: (name: string | null) => void;
}) {
  const theme = useTheme();
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        testID="where-filter-backdrop"
        onPress={onClose}
        style={{ flex: 1 }}
      >
        <View
          style={{
            marginTop: 120,
            marginRight: 16,
            alignSelf: 'flex-end',
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.1)',
            minWidth: 240,
            maxHeight: 420,
            padding: 8,
            ...theme.shadow.md,
          }}
        >
          <ScrollView>
            {WHERE_FILTERS.map((opt) => {
              const active = selected === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  testID={`where-filter-${opt.id}`}
                  onPress={() => {
                    onSelect(opt.id);
                    onClose();
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: theme.radius.sm,
                    backgroundColor: active ? theme.color.lime : 'transparent',
                  }}
                >
                  <Text
                    variant="small"
                    style={{
                      fontFamily: theme.font.medium,
                      color: active ? theme.color.text : theme.color.textMuted,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
            {partners.length > 0 ? (
              <>
                <View
                  style={{
                    height: 1,
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    marginVertical: 6,
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: theme.font.bold,
                    color: theme.color.textMuted,
                    textTransform: 'uppercase',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  Organization
                </Text>
                <Pressable
                  testID="where-filter-org-all"
                  onPress={() => {
                    onSelectOrganization(null);
                    onClose();
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: theme.radius.sm,
                    backgroundColor: !organization
                      ? theme.color.lime
                      : 'transparent',
                  }}
                >
                  <Text variant="small">All organizations</Text>
                </Pressable>
                {partners.map((org) => (
                  <Pressable
                    key={org.id}
                    testID={`where-filter-org-${org.id}`}
                    onPress={() => {
                      onSelectOrganization(org.name);
                      onClose();
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: theme.radius.sm,
                      backgroundColor:
                        organization === org.name
                          ? theme.color.lime
                          : 'transparent',
                    }}
                  >
                    <Text variant="small" numberOfLines={1}>
                      {org.name}
                    </Text>
                  </Pressable>
                ))}
              </>
            ) : null}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}
