import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable } from 'react-native';

import { Text } from './Text';

const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * The phone's own date picker, as web's `<input type="date">`: tap the field, pick a day.
 * Works in YYYY-MM-DD, local calendar dates.
 */
export function DatePickerField({
  value,
  minimumDate,
  onChange,
  testID,
}: {
  value: string;
  minimumDate?: Date;
  onChange: (date: string) => void;
  testID?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = new Date(`${value}T00:00:00`);

  const picked = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && date) onChange(toIso(date));
  };

  return (
    <>
      <Pressable
        testID={testID}
        onPress={() => setOpen((o) => !o)}
        style={{
          marginTop: 4,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.1)',
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontSize: 15, color: '#1E293B' }}>{value}</Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={current}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate}
          onChange={picked}
        />
      ) : null}
    </>
  );
}
