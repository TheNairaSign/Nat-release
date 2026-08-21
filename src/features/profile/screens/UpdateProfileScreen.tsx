import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { IMPACT_MEASUREMENTS } from '@/core/profile';
import {
  fetchProfileUser,
  profileUserQueryKey,
  updateProfileUser,
} from '../api/profile-api';
import { useQuery } from '@/shared/api';
import { usePorts } from '@/shared/hooks/use-ports';
import { useTheme } from '@/shared/theme';
import { ChromeScreen, ScreenBack, Text } from '@/shared/ui';

export function UpdateProfileScreen() {
  const { http, navigation } = usePorts();
  const query = useQuery({
    queryKey: profileUserQueryKey,
    queryFn: () => fetchProfileUser(http),
  });
  const user = query.data;
  if (!user) {
    return (
      <ChromeScreen>
        <ScreenBack onPress={() => navigation.back()} />
        <Text>Update Profile</Text>
      </ChromeScreen>
    );
  }
  return <UpdateProfileForm user={user} />;
}

function UpdateProfileForm({
  user,
}: {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    impactMeasurement?: string;
    phoneNumber?: string;
  };
}) {
  const theme = useTheme();
  const { http, navigation } = usePorts();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [impactMeasurement, setImpactMeasurement] = useState(
    user.impactMeasurement || 'trees',
  );
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [saved, setSaved] = useState(false);

  async function onSave() {
    const next = await updateProfileUser(http, {
      firstName,
      lastName,
      email,
      impactMeasurement,
      phoneNumber,
    });
    if (next) setSaved(true);
  }

  return (
    <ChromeScreen>
      <ScreenBack onPress={() => navigation.back()} />
      <Text variant="heading">Update Profile</Text>
      <Field label="First Name" value={firstName} onChange={setFirstName} />
      <Field label="Last Name" value={lastName} onChange={setLastName} />
      <Field label="Email" value={email} onChange={setEmail} editable={false} />
      <Text style={{ marginTop: 16, fontFamily: theme.font.medium }}>
        Impact Measurement
      </Text>
      <Text variant="small" muted>
        How do you want to measure your impact on the environment?
      </Text>
      <View style={{ gap: 8, marginTop: 8 }}>
        {IMPACT_MEASUREMENTS.map((item) => (
          <Pressable
            key={item.id}
            testID={`impact-measure-${item.id}`}
            onPress={() => setImpactMeasurement(item.id)}
            style={{
              padding: 10,
              borderRadius: theme.radius.sm,
              borderWidth: 1,
              borderColor: theme.color.inputBorder,
              backgroundColor:
                impactMeasurement === item.id
                  ? theme.color.ink
                  : theme.color.surface,
            }}
          >
            <Text
              style={{
                color:
                  impactMeasurement === item.id
                    ? theme.color.accentText
                    : theme.color.text,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Field
        label="Phone Number"
        value={phoneNumber}
        onChange={setPhoneNumber}
      />
      <Text variant="small" muted>
        Enter your phone number
      </Text>
      <Pressable
        testID="update-profile-submit"
        onPress={() => {
          void onSave();
        }}
        style={{
          marginTop: 32,
          backgroundColor: theme.color.ink,
          borderRadius: theme.radius.sm,
          padding: 12,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: theme.color.accentText,
            fontFamily: theme.font.semibold,
          }}
        >
          Update Profile
        </Text>
      </Pressable>
      {saved ? (
        <Text variant="small" style={{ marginTop: 8 }}>
          Profile Updated Successfully
        </Text>
      ) : null}
    </ChromeScreen>
  );
}

function Field({
  label,
  value,
  onChange,
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontFamily: theme.font.medium, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        editable={editable}
        onChangeText={onChange}
        style={{
          padding: 8,
          borderWidth: 1,
          borderColor: theme.color.inputBorder,
          borderRadius: theme.radius.sm,
          color: theme.color.text,
          fontFamily: theme.font.regular,
        }}
      />
    </View>
  );
}
