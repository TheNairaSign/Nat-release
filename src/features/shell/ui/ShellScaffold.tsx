import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import {
  hidesConsumerChrome,
  hrefForTab,
  isAiPath,
  isTabLocked,
  isWherePath,
  tabIdFromPath,
  type ConsumerTabId,
} from '@/core/navigation';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';

import { GlassTabBar } from './GlassTabBar';
import { ShellHeader } from './ShellHeader';

export function ShellScaffold({
  guest,
  pathname,
  children,
  onLockedTab,
  onAiLocked,
}: {
  guest: boolean;
  pathname: string;
  children: ReactNode;
  onLockedTab: () => void;
  onAiLocked?: () => void;
}) {
  const theme = useTheme();
  const { navigation } = usePorts();
  const [collapsed, setCollapsed] = useState(false);
  const hideChrome = hidesConsumerChrome(pathname);
  const hideHeader = hideChrome || isWherePath(pathname);
  const hideAi = hideChrome || isAiPath(pathname);
  const activeId = tabIdFromPath(pathname);

  function goTab(id: ConsumerTabId) {
    if (isTabLocked(id, guest)) {
      onLockedTab();
      return;
    }
    const href = hrefForTab(id, guest);
    if (href) {
      navigation.navigate(href);
    }
  }

  if (hideChrome) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.color.bg }}>
        {children}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.bg }}>
      {hideHeader ? null : (
        <ShellHeader
          guest={guest}
          hideAi={hideAi}
          scrolled={false}
          onLogoPress={() =>
            navigation.replace(guest ? '/guest/dashboard' : '/home')
          }
          onAiPress={() => {
            if (guest) {
              (onAiLocked ?? onLockedTab)();
              return;
            }
            navigation.navigate('/ai');
          }}
          onNotificationsPress={
            guest
              ? undefined
              : () => {
                  navigation.navigate('/notifications');
                }
          }
        />
      )}
      {children}
      <GlassTabBar
        guest={guest}
        activeId={activeId}
        collapsed={collapsed}
        onToggle={() => setCollapsed((current) => !current)}
        onPressTab={goTab}
      />
    </View>
  );
}
