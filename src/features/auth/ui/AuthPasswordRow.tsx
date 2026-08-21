import { View } from 'react-native';

import { AuthTextField } from './AuthTextField';
import { PasswordVisibilityToggle } from './PasswordVisibilityToggle';

export function AuthPasswordRow({
  testID,
  placeholder,
  value,
  onChangeText,
  visible,
  onToggle,
  hideLabel,
  showLabel,
  eyeSize,
  autoComplete = 'password',
  textContentType = 'password',
}: {
  testID: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  hideLabel: string;
  showLabel: string;
  eyeSize?: number;
  autoComplete?: 'password' | 'password-new';
  textContentType?: 'password' | 'newPassword';
}) {
  return (
    <View style={{ justifyContent: 'center' }}>
      <AuthTextField
        testID={testID}
        placeholder={placeholder}
        autoCapitalize="none"
        autoComplete={autoComplete}
        textContentType={textContentType}
        secureTextEntry={!visible}
        value={value}
        onChangeText={onChangeText}
        style={{ paddingRight: 44 }}
      />
      <PasswordVisibilityToggle
        visible={visible}
        onToggle={onToggle}
        hideLabel={hideLabel}
        showLabel={showLabel}
        size={eyeSize}
      />
    </View>
  );
}
