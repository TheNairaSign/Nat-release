import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import {
  hidesConsumerChrome,
  hrefForTab,
  isAiPath,
  isTabLocked,
  isGroceryAppPath,
  isWasteAppsPath,
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
}: {
  guest: boolean;
  pathname: string;
  children: ReactNode;
  onLockedTab: () => void;
}) {
  const theme = useTheme();
  const { navigation } = usePorts();
  const [collapsed, setCollapsed] = useState(false);
  const hideChrome = hidesConsumerChrome(pathname);
  const miniApp = isGroceryAppPath(pathname);
  const hideHeader =
    hideChrome ||
    miniApp ||
    isWherePath(pathname) ||
    isWasteAppsPath(pathname);
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
          // Guests get a few free DiVA questions before being asked to sign up.
          onAiPress={() => navigation.navigate(guest ? '/guest/ai' : '/ai')}
          onWasteAppsPress={() =>
            navigation.navigate(guest ? '/guest/waste-apps' : '/waste-apps')
          }
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
      {miniApp ? null : (
      <GlassTabBar
        guest={guest}
        activeId={activeId}
        collapsed={collapsed}
        onToggle={() => setCollapsed((current) => !current)}
        onPressTab={goTab}
      />
      )}
    </View>
  );
}
