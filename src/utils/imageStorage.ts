import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IMAGE_DIR = `${FileSystem.documentDirectory}images/`;
const IMAGE_INDEX_KEY = '@image_index';

export interface ImageMetadata {
  id: string;
  originalPath: string;
  thumbnailPath: string;
  width: number;
  height: number;
  createdAt: number;
}

class ImageStorageService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    }
    this.initialized = true;
  }

  async saveImage(
    base64OrUri: string,
    imageId: string
  ): Promise<ImageMetadata> {
    await this.initialize();

    let imageUri = base64OrUri;
    
    // 如果是 base64，先转换为临时文件
    if (base64OrUri.startsWith('data:image')) {
      const tempPath = `${FileSystem.cacheDirectory}temp_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(tempPath, base64OrUri.split(',')[1], {
        encoding: FileSystem.EncodingType.Base64,
      });
      imageUri = tempPath;
    }

    // 直接复制原图，不压缩
    const originalPath = `${IMAGE_DIR}${imageId}_original.jpg`;
    await FileSystem.copyAsync({
      from: imageUri,
      to: originalPath,
    });

    // 缩略图使用原图路径
    const thumbnailPath = originalPath;

    const metadata: ImageMetadata = {
      id: imageId,
      originalPath,
      thumbnailPath,
      width: 0,
      height: 0,
      createdAt: Date.now(),
    };

    // 保存索引
    await this.saveImageIndex(imageId, metadata);

    // 清理临时文件
    if (imageUri.startsWith('file://') && imageUri.includes('cache')) {
      try {
        await FileSystem.deleteAsync(imageUri, { idempotent: true });
      } catch (error) {
        console.warn('Failed to delete temp file:', error);
      }
    }

    return metadata;
  }

  async getImageUri(imageId: string, useThumbnail = false): Promise<string | null> {
    const metadata = await this.getImageMetadata(imageId);
    if (!metadata) return null;

    const path = useThumbnail && metadata.thumbnailPath 
      ? metadata.thumbnailPath 
      : metadata.originalPath;

    const fileInfo = await FileSystem.getInfoAsync(path);
    return fileInfo.exists ? path : null;
  }

  async getImageBase64(imageId: string, useThumbnail = false): Promise<string | null> {
    const uri = await this.getImageUri(imageId, useThumbnail);
    if (!uri) return null;

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Failed to read image as base64:', error);
      return null;
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    const metadata = await this.getImageMetadata(imageId);
    if (!metadata) return;

    // 删除文件
    try {
      await FileSystem.deleteAsync(metadata.originalPath, { idempotent: true });
    } catch (error) {
      console.error('Failed to delete image files:', error);
    }

    // 删除索引
    await this.removeImageIndex(imageId);
  }

  private async saveImageIndex(imageId: string, metadata: ImageMetadata): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem(IMAGE_INDEX_KEY);
      const index = indexStr ? JSON.parse(indexStr) : {};
      index[imageId] = metadata;
      await AsyncStorage.setItem(IMAGE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to save image index:', error);
    }
  }

  private async getImageMetadata(imageId: string): Promise<ImageMetadata | null> {
    try {
      const indexStr = await AsyncStorage.getItem(IMAGE_INDEX_KEY);
      if (!indexStr) return null;
      const index = JSON.parse(indexStr);
      return index[imageId] || null;
    } catch (error) {
      console.error('Failed to get image metadata:', error);
      return null;
    }
  }

  private async removeImageIndex(imageId: string): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem(IMAGE_INDEX_KEY);
      if (!indexStr) return;
      const index = JSON.parse(indexStr);
      delete index[imageId];
      await AsyncStorage.setItem(IMAGE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to remove image index:', error);
    }
  }

  async getAllImageIds(): Promise<string[]> {
    try {
      const indexStr = await AsyncStorage.getItem(IMAGE_INDEX_KEY);
      if (!indexStr) return [];
      const index = JSON.parse(indexStr);
      return Object.keys(index);
    } catch (error) {
      console.error('Failed to get all image IDs:', error);
      return [];
    }
  }

  async clearAllImages(): Promise<void> {
    try {
      await FileSystem.deleteAsync(IMAGE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
      await AsyncStorage.removeItem(IMAGE_INDEX_KEY);
    } catch (error) {
      console.error('Failed to clear all images:', error);
    }
  }
}

export const imageStorage = new ImageStorageService();
