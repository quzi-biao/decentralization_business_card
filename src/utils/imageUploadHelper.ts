import * as ImagePicker from 'expo-image-picker';
import { imageStorage } from './imageStorage';

export class ImageUploadHelper {
  static async pickAndSaveImage(
    imageType: 'avatar' | 'qrcode' | 'company',
    options?: {
      allowsEditing?: boolean;
      aspect?: [number, number];
      quality?: number;
    }
  ): Promise<string | null> {
    const {
      allowsEditing = true,
      aspect = [1, 1],
      quality = 0.8,
    } = options || {};

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing,
      aspect,
      quality,
    });

    if (result.canceled) {
      return null;
    }

    const imageUri = result.assets[0].uri;
    const imageId = `${imageType}_${Date.now()}`;

    // 根据图片类型设置不同的压缩参数
    let saveOptions = {};
    
    switch (imageType) {
      case 'avatar':
        saveOptions = {
          compress: true,
          quality: 0.8,
          maxWidth: 400,
          maxHeight: 400,
          generateThumbnail: true,
          thumbnailSize: 200,
        };
        break;
      case 'qrcode':
        saveOptions = {
          compress: true,
          quality: 0.9,
          maxWidth: 800,
          maxHeight: 800,
          generateThumbnail: true,
          thumbnailSize: 200,
        };
        break;
      case 'company':
        saveOptions = {
          compress: true,
          quality: 0.8,
          maxWidth: 1200,
          maxHeight: 1200,
          generateThumbnail: true,
          thumbnailSize: 300,
        };
        break;
    }

    await imageStorage.saveImage(imageUri, imageId, saveOptions);
    return imageId;
  }

  static async takePhotoAndSave(
    imageType: 'avatar' | 'qrcode' | 'company',
    options?: {
      allowsEditing?: boolean;
      aspect?: [number, number];
      quality?: number;
    }
  ): Promise<string | null> {
    const {
      allowsEditing = true,
      aspect = [1, 1],
      quality = 0.8,
    } = options || {};

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing,
      aspect,
      quality,
    });

    if (result.canceled) {
      return null;
    }

    const imageUri = result.assets[0].uri;
    const imageId = `${imageType}_${Date.now()}`;

    let saveOptions = {};
    
    switch (imageType) {
      case 'avatar':
        saveOptions = {
          compress: true,
          quality: 0.8,
          maxWidth: 400,
          maxHeight: 400,
          generateThumbnail: true,
          thumbnailSize: 200,
        };
        break;
      case 'qrcode':
        saveOptions = {
          compress: true,
          quality: 0.9,
          maxWidth: 800,
          maxHeight: 800,
          generateThumbnail: true,
          thumbnailSize: 200,
        };
        break;
      case 'company':
        saveOptions = {
          compress: true,
          quality: 0.8,
          maxWidth: 1200,
          maxHeight: 1200,
          generateThumbnail: true,
          thumbnailSize: 300,
        };
        break;
    }

    await imageStorage.saveImage(imageUri, imageId, saveOptions);
    return imageId;
  }
}
