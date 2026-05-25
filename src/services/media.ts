import * as ImageManipulator from "expo-image-manipulator";

export async function compressImageForEncryptedUpload(uri: string) {
  return ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG, base64: false }
  );
}
