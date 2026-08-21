import { useTranslation } from 'react-i18next';

import { ChromeScreen, Text } from '@/shared/ui';

export function DropoffScreen() {
  const { t } = useTranslation();
  return (
    <ChromeScreen>
      <Text variant="title">{t('dropoff')}</Text>
      <Text muted>Scaffold placeholder for drop-off proof capture.</Text>
    </ChromeScreen>
  );
}
