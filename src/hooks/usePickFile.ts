import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { captureWithCamera } from '../lib/camera';
import type { UploadFile } from '../api/endpoints';

const MAX_MB = 5;

/** Checks size with expo-file-system so we never upload huge photos on a slow network. */
function tooBig(files: UploadFile[]) {
  try {
    return files.some((f) => (new File(f.uri).size ?? 0) > MAX_MB * 1024 * 1024);
  } catch {
    return false;
  }
}

/**
 * Lets the driver take a photo with the in-app camera (expo-camera) or pick from
 * the gallery (expo-image-picker). `count` > 1 asks for several photos (vehicle sides).
 */
export function pickFile(
  opts: { multiple?: boolean; count?: number; title?: string } = {},
): Promise<UploadFile[] | null> {
  return new Promise((resolve) => {
    const done = (files: UploadFile[] | null) => {
      if (files && tooBig(files)) {
        Alert.alert('Photo too large', `Please use a photo under ${MAX_MB} MB.`);
        return resolve(null);
      }
      resolve(files);
    };

    const fromCamera = async () => done(await captureWithCamera({ count: opts.count, title: opts.title }));

    const fromGallery = async () => {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return done(null);
      const r = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        allowsMultipleSelection: !!opts.multiple || (opts.count ?? 1) > 1,
        selectionLimit: opts.count ?? 0,
        mediaTypes: ['images'],
      });
      done(r.canceled ? null : r.assets.map(toFile));
    };

    Alert.alert('Add photo', 'Use a clear photo of the original.', [
      { text: 'Take photo', onPress: fromCamera },
      { text: 'Choose from gallery', onPress: fromGallery },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

function toFile(a: ImagePicker.ImagePickerAsset): UploadFile {
  const name = a.fileName ?? a.uri.split('/').pop() ?? 'photo.jpg';
  return { uri: a.uri, name, type: a.mimeType ?? 'image/jpeg' };
}
