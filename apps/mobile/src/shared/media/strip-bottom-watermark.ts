import { Image } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Crop a thin strip from the bottom of a photo to remove camera date/time watermarks
 * (e.g. "18 09 26 11:41:21") before display / AI upload.
 */
export async function stripBottomWatermark(
  uri: string,
  bottomRatio = 0.1,
): Promise<string> {
  try {
    const { width, height } = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        Image.getSize(
          uri,
          (w, h) => resolve({ width: w, height: h }),
          (err) => reject(err),
        );
      },
    );

    if (!width || !height) return uri;

    const cropHeight = Math.max(1, Math.floor(height * (1 - bottomRatio)));
    const result = await manipulateAsync(
      uri,
      [
        {
          crop: {
            originX: 0,
            originY: 0,
            width,
            height: cropHeight,
          },
        },
      ],
      { compress: 0.85, format: SaveFormat.JPEG },
    );
    return result.uri || uri;
  } catch {
    return uri;
  }
}
