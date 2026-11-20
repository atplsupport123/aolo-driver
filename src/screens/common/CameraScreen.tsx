// In-app camera for documents, odometer and receipts (expo-camera).
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, RotateCcw, Check } from 'lucide-react-native';
import { Button } from '../../components/ui';
import { finishCapture } from '../../lib/camera';
import { colors } from '../../theme';
import type { UploadFile } from '../../api/endpoints';
import type { ScreenProps } from '../../navigation/types';

export default function CameraScreen({ navigation, route }: ScreenProps<'Camera'>) {
  const count = route.params?.count ?? 1;
  const [permission, requestPermission] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [shots, setShots] = useState<UploadFile[]>([]);
  const [preview, setPreview] = useState<UploadFile | null>(null);
  const [busy, setBusy] = useState(false);
  const finished = useRef(false);

  // If the driver leaves with the back gesture, tell the caller "nothing".
  useEffect(
    () => () => {
      if (!finished.current) finishCapture(null);
    },
    [],
  );

  const close = (files: UploadFile[] | null) => {
    finished.current = true;
    finishCapture(files);
    navigation.goBack();
  };

  const snap = async () => {
    if (!cam.current || busy) return;
    setBusy(true);
    try {
      const p = await cam.current.takePictureAsync({ quality: 0.7 });
      if (p?.uri) setPreview({ uri: p.uri, name: `photo_${Date.now()}.jpg`, type: 'image/jpeg' });
    } finally {
      setBusy(false);
    }
  };

  const usePhoto = () => {
    if (!preview) return;
    const next = [...shots, preview];
    setPreview(null);
    if (next.length >= count) close(next);
    else setShots(next);
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark, padding: 24, justifyContent: 'center', gap: 12 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>Allow camera</Text>
        <Text style={{ color: colors.darkMuted }}>AOLO needs the camera to photograph your documents.</Text>
        <Button title="Allow camera" variant="light" onPress={requestPermission} />
        <Button title="Cancel" variant="darkGhost" onPress={() => close(null)} />
      </SafeAreaView>
    );
  }

  const label = count > 1 ? `Photo ${shots.length + 1} of ${count}` : (route.params?.title ?? 'Take a photo');

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {preview ? (
        <Image source={{ uri: preview.uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
      ) : (
        <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" />
      )}
      <SafeAreaView style={styles.top}>
        <Pressable onPress={() => close(shots.length ? shots : null)} style={styles.round} hitSlop={10}>
          <X color="#fff" size={22} />
        </Pressable>
        <Text style={{ color: '#fff', fontWeight: '700' }}>{label}</Text>
        <View style={{ width: 44 }} />
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        {preview ? (
          <View style={{ flexDirection: 'row', gap: 40 }}>
            <Pressable onPress={() => setPreview(null)} style={styles.round}>
              <RotateCcw color="#fff" size={24} />
            </Pressable>
            <Pressable onPress={usePhoto} style={[styles.round, { backgroundColor: colors.green }]}>
              <Check color="#fff" size={26} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={snap} style={styles.shutter} disabled={busy} />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bottom: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
  round: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#fff',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
