// PDF p.15 — Edit profile
import React, { useState } from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, Header, Avatar, Button, SectionLabel, Pill, Muted, Input, OtpInput } from '../../components/ui';
import { driverApi, documentsApi } from '../../api/endpoints';
import { useAuth } from '../../store/auth';
import { useAction } from '../../hooks/useApi';
import { pickFile } from '../../hooks/usePickFile';
import { colors, font } from '../../theme';
import { formatDate } from '../../utils/format';
import type { ScreenProps } from '../../navigation/types';

export default function EditProfileScreen({ navigation }: ScreenProps<'EditProfile'>) {
  const { driver, setDriver } = useAuth();
  const docs = useQuery({ queryKey: ['documents'], queryFn: documentsApi.list });
  const [name, setName] = useState(driver?.name ?? '');
  const [division, setDivision] = useState(driver?.division ?? '');
  const [editing, setEditing] = useState<'name' | 'division' | null>(null);
  const [mobileStep, setMobileStep] = useState<null | 'enter' | 'otp'>(null);
  const [newMobile, setNewMobile] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const save = useAction(driverApi.update);
  if (!driver) return null;

  const doc = (k: string) => docs.data?.find((d) => d.key === k);

  const changePhoto = async () => {
    const f = await pickFile({ title: 'Face photo' });
    if (!f?.[0]) return;
    try {
      setDriver(await driverApi.uploadPhoto(f[0]));
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    }
  };

  const changeMobile = () => setMobileStep('enter');

  const sendMobileOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(newMobile)) return Alert.alert('Enter a 10 digit mobile number');
    try {
      await driverApi.requestMobileChange(newMobile);
      setMobileStep('otp');
    } catch (e: any) {
      Alert.alert('Could not send OTP', e.message);
    }
  };
  const confirmMobile = async () => {
    try {
      setDriver(await driverApi.confirmMobileChange(newMobile, mobileOtp));
      setMobileStep(null);
      setNewMobile('');
      setMobileOtp('');
    } catch (e: any) {
      Alert.alert('Wrong OTP', e.message);
    }
  };

  const DocRow = ({
    title,
    value,
    action,
    onPress,
  }: {
    title: string;
    value: string;
    action: string;
    onPress: () => void;
  }) => (
    <View
      style={{
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      <View>
        <Text style={font.tiny}>{title}</Text>
        <Text style={{ fontSize: 15, fontWeight: '700' }}>{value}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Pressable onPress={onPress}>
          <Text style={{ fontWeight: '700' }}>{action}</Text>
        </Pressable>
        <Pill text="Admin approval" tone="amber" />
      </View>
    </View>
  );

  return (
    <Screen
      footer={
        <Button
          title="Save changes"
          loading={save.loading}
          onPress={async () => {
            try {
              setDriver(await save.run({ name, division }));
              setEditing(null);
              navigation.goBack();
            } catch {
              /* shown */
            }
          }}
        />
      }
    >
      <Header title="Edit profile" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        {driver.photo_url ? (
          <Image source={{ uri: driver.photo_url }} style={{ width: 52, height: 52, borderRadius: 26 }} />
        ) : (
          <Avatar initials={driver.initials} size={52} />
        )}
        <Pressable onPress={changePhoto}>
          <Text style={{ fontWeight: '700' }}>Change photo</Text>
          <Muted>A clear face photo, no sunglasses</Muted>
        </Pressable>
      </View>
      <Field
        label="Full name"
        value={name}
        editing={editing === 'name'}
        onChange={setName}
        onEdit={() => setEditing('name')}
      />
      <Field
        label="Mobile number"
        value={driver.mobile}
        right={
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Pressable onPress={changeMobile}>
              <Text style={{ fontWeight: '700' }}>Change</Text>
            </Pressable>
            <Pill text="OTP needed" tone="amber" />
          </View>
        }
      />
      {mobileStep && (
        <View style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginTop: 8, gap: 8 }}>
          {mobileStep === 'enter' ? (
            <>
              <Input
                label="New mobile number"
                prefix="+91"
                keyboardType="phone-pad"
                maxLength={10}
                value={newMobile}
                onChangeText={setNewMobile}
              />
              <Button small title="Send OTP" onPress={sendMobileOtp} />
            </>
          ) : (
            <>
              <Muted>Enter the OTP sent to +91 {newMobile}</Muted>
              <OtpInput length={6} value={mobileOtp} onChange={setMobileOtp} />
              <Button small title="Verify" disabled={mobileOtp.length !== 6} onPress={confirmMobile} />
            </>
          )}
          <Button small variant="ghost" title="Cancel" onPress={() => setMobileStep(null)} />
        </View>
      )}
      <Field
        label="Division"
        value={division}
        editing={editing === 'division'}
        onChange={setDivision}
        onEdit={() => setEditing('division')}
      />

      <SectionLabel>Vehicle and documents</SectionLabel>
      <DocRow
        title="Vehicle"
        value={driver.vehicle_number}
        action="Update"
        onPress={() =>
          Alert.alert('Update vehicle', 'A vehicle change needs new RC and insurance. AOLO will review it.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to documents', onPress: () => navigation.navigate('Documents') },
          ])
        }
      />
      <DocRow
        title="Driving licence"
        value={`Valid till ${formatDate(doc('dl')?.valid_till)}`}
        action="Upload"
        onPress={() => navigation.navigate('Documents')}
      />
      <DocRow
        title="RC and insurance"
        value={`Valid till ${formatDate(doc('insurance')?.valid_till)}`}
        action="Upload"
        onPress={() => navigation.navigate('Documents')}
      />
    </Screen>
  );
}

function Field({ label, value, onEdit, editing, onChange, right }: any) {
  return (
    <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={font.tiny}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {editing ? (
          <TextInput
            value={value}
            onChangeText={onChange}
            autoFocus
            style={{ flex: 1, fontSize: 15, fontWeight: '700', paddingVertical: 2 }}
          />
        ) : (
          <Text style={{ fontSize: 15, fontWeight: '700' }}>{value}</Text>
        )}
        {right ?? (
          <Pressable onPress={onEdit}>
            <Text style={{ fontWeight: '700' }}>Edit</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
