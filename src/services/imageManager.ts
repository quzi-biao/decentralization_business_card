import * as FileSystem from 'expo-file-system/legacy';
import { documentDirectory, cacheDirectory } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { MINIO_CONFIG } from '../config/minio.config';

const IMAGE_DIR = `${documentDirectory}images/`;
const IMAGE_INDEX_KEY = '@image_index';

export interface ImageMetadata {
  id: string;
  hash: string;
  originalPath: string;
  thumbnailPath?: string;
  minioUrl?: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  createdAt: number;
  source: 'camera' | 'library' | 'external';
}

export type ImageSaveOptions = {
  uploadToCloud?: boolean;
  generateThumbnail?: boolean;
  calculateHash?: boolean;
};

/**
 * 统一的图片管理服务
 * 整合了图片获取、本地存储、云端上传、元数据管理等功能
 */
class ImageManagerService {
  private initialized = false;

  /**
   * 初始化图片目录
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    }
    this.initialized = true;
  }

  /**
   * 拍照并保存
   */
  async takePhoto(options: ImageSaveOptions = {}): Promise<ImageMetadata | null> {
    try {
      // 请求相机权限
      const permission = await ImagePicker.getCameraPermissionsAsync();
      if (!permission.granted) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('需要相机权限才能拍照');
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        return await this.saveImage(result.assets[0].uri, {
          source: 'camera',
          ...options,
        });
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  /**
   * 从相册选择图片并保存
   */
  async pickImage(options: ImageSaveOptions = {}): Promise<ImageMetadata | null> {
    try {
      // 请求相册权限
      const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('需要相册权限才能选择图片');
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        return await this.saveImage(result.assets[0].uri, {
          source: 'library',
          ...options,
        });
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  }

  /**
   * 计算图片内容的 SHA256 hash
   */
  async calculateImageHash(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const hash = CryptoJS.SHA256(base64).toString();
      return hash;
    } catch (error) {
      console.error('Error calculating image hash:', error);
      throw error;
    }
  }

  /**
   * 保存图片（支持 URI 或 Base64）
   */
  async saveImage(
    uriOrBase64: string,
    options: ImageSaveOptions & { source?: 'camera' | 'library' | 'external' } = {}
  ): Promise<ImageMetadata> {
    await this.initialize();

    const {
      uploadToCloud = false,
      generateThumbnail = false,
      calculateHash = true,
      source = 'external',
    } = options;

    let imageUri = uriOrBase64;

    // 如果是 base64，先转换为临时文件
    if (uriOrBase64.startsWith('data:image')) {
      const tempPath = `${cacheDirectory}temp_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(tempPath, uriOrBase64.split(',')[1], {
        encoding: 'base64',
      });
      imageUri = tempPath;
    }

    // 计算 hash（用于去重和文件命名）
    const hash = calculateHash ? await this.calculateImageHash(imageUri) : `img_${Date.now()}`;

    // 生成唯一 ID
    const imageId = `${hash}_${Date.now()}`;

    // 获取文件信息
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error(`Source image file does not exist: ${imageUri}`);
    }
    
    const extension = imageUri.split('.').pop() || 'jpg';
    const mimeType = `image/${extension}`;

    // 保存原图
    const originalPath = `${IMAGE_DIR}${imageId}.${extension}`;
    
    // 检查是否已存在相同 hash 的文件（去重）
    const existingImage = await this.findImageByHash(hash);
    if (existingImage && calculateHash) {
      console.log('Image already exists, returning existing metadata');
      return existingImage;
    }

    await FileSystem.copyAsync({
      from: imageUri,
      to: originalPath,
    });

    // 创建元数据
    const metadata: ImageMetadata = {
      id: imageId,
      hash,
      originalPath,
      width: 0,
      height: 0,
      fileSize: fileInfo.size || 0,
      mimeType,
      createdAt: Date.now(),
      source,
    };

    // 上传到云端（如果需要）
    if (uploadToCloud) {
      try {
        metadata.minioUrl = await this.uploadToMinIO(originalPath, hash);
      } catch (error) {
        console.error('Failed to upload to MinIO, continuing with local storage:', error);
      }
    }

    // 保存元数据索引
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

  /**
   * 上传图片到 MinIO
   */
  private async uploadToMinIO(localPath: string, hash: string): Promise<string> {
    try {
      const extension = localPath.split('.').pop() || 'jpg';
      const fileName = `${hash}.${extension}`;
      const objectName = `images/${fileName}`;

      // 构建上传 URL
      const uploadUrl = `${MINIO_CONFIG.endpoint}/${MINIO_CONFIG.bucket}/${objectName}`;

      // 使用 FormData 上传文件（React Native 兼容）
      const formData = new FormData();
      formData.append('file', {
        uri: localPath,
        type: `image/${extension}`,
        name: fileName,
      } as any);

      // 上传到 MinIO
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': `image/${extension}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`MinIO upload failed: ${response.statusText}`);
      }

      // 返回公开访问 URL
      const publicUrl = `${MINIO_CONFIG.endpoint}/${MINIO_CONFIG.bucket}/${objectName}`;
      return publicUrl;
    } catch (error) {
      console.error('Error uploading to MinIO:', error);
      throw error;
    }
  }

  /**
   * 通过 hash 查找图片（去重检查）
   */
  private async findImageByHash(hash: string): Promise<ImageMetadata | null> {
    try {
      const indexStr = await AsyncStorage.getItem(IMAGE_INDEX_KEY);
      if (!indexStr) return null;
      
      const index = JSON.parse(indexStr);
      const imageId = Object.keys(index).find(id => index[id].hash === hash);
      
      if (imageId) {
        const metadata = index[imageId];
        // 验证文件是否仍然存在
        const fileInfo = await FileSystem.getInfoAsync(metadata.originalPath);
        if (fileInfo.exists) {
          return metadata;
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding image by hash:', error);
      return null;
    }
  }

  /**
   * 获取图片 URI
   */
  async getImageUri(imageId: string, preferCloud = false): Promise<string | null> {
    const metadata = await this.getImageMetadata(imageId);
    if (!metadata) return null;

    // 优先返回云端 URL（如果存在且用户偏好）
    if (preferCloud && metadata.minioUrl) {
      return metadata.minioUrl;
    }

    // 验证本地文件是否存在
    const fileInfo = await FileSystem.getInfoAsync(metadata.originalPath);
    return fileInfo.exists ? metadata.originalPath : null;
  }

  /**
   * 获取图片 Base64
   */
  async getImageBase64(imageId: string): Promise<string | null> {
    const uri = await this.getImageUri(imageId, false);
    if (!uri) return null;

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const metadata = await this.getImageMetadata(imageId);
      const mimeType = metadata?.mimeType || 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Failed to read image as base64:', error);
      return null;
    }
  }

  /**
   * 获取图片元数据
   */
  async getImageMetadata(imageId: string): Promise<ImageMetadata | null> {
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

  /**
   * 删除图片
   */
  async deleteImage(imageId: string): Promise<void> {
    const metadata = await this.getImageMetadata(imageId);
    if (!metadata) return;

    // 删除本地文件
    try {
      await FileSystem.deleteAsync(metadata.originalPath, { idempotent: true });
      if (metadata.thumbnailPath) {
        await FileSystem.deleteAsync(metadata.thumbnailPath, { idempotent: true });
      }
    } catch (error) {
      console.error('Failed to delete image files:', error);
    }

    // 删除索引
    await this.removeImageIndex(imageId);
  }

  /**
   * 获取所有图片 ID
   */
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

  /**
   * 获取所有图片元数据
   */
  async getAllImages(): Promise<ImageMetadata[]> {
    try {
      const indexStr = await AsyncStorage.getItem(IMAGE_INDEX_KEY);
      if (!indexStr) return [];
      const index = JSON.parse(indexStr);
      return Object.values(index);
    } catch (error) {
      console.error('Failed to get all images:', error);
      return [];
    }
  }

  /**
   * 清理所有图片
   */
  async clearAllImages(): Promise<void> {
    try {
      await FileSystem.deleteAsync(IMAGE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
      await AsyncStorage.removeItem(IMAGE_INDEX_KEY);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to clear all images:', error);
      throw error;
    }
  }

  /**
   * 清理不存在的图片索引（数据清理）
   */
  async cleanupOrphanedIndexes(): Promise<number> {
    try {
      const indexStr = await AsyncStorage.getItem(IMAGE_INDEX_KEY);
      if (!indexStr) return 0;

      const index = JSON.parse(indexStr);
      const imageIds = Object.keys(index);
      let cleanedCount = 0;

      for (const imageId of imageIds) {
        const metadata = index[imageId];
        const fileInfo = await FileSystem.getInfoAsync(metadata.originalPath);
        
        if (!fileInfo.exists) {
          delete index[imageId];
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await AsyncStorage.setItem(IMAGE_INDEX_KEY, JSON.stringify(index));
      }

      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup orphaned indexes:', error);
      return 0;
    }
  }

  /**
   * 保存图片索引
   */
  private async saveImageIndex(imageId: string, metadata: ImageMetadata): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem(IMAGE_INDEX_KEY);
      const index = indexStr ? JSON.parse(indexStr) : {};
      index[imageId] = metadata;
      await AsyncStorage.setItem(IMAGE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to save image index:', error);
      throw error;
    }
  }

  /**
   * 删除图片索引
   */
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

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    totalImages: number;
    totalSize: number;
    cloudImages: number;
    localOnlyImages: number;
  }> {
    try {
      const images = await this.getAllImages();
      const stats = {
        totalImages: images.length,
        totalSize: images.reduce((sum, img) => sum + img.fileSize, 0),
        cloudImages: images.filter(img => img.minioUrl).length,
        localOnlyImages: images.filter(img => !img.minioUrl).length,
      };
      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalImages: 0,
        totalSize: 0,
        cloudImages: 0,
        localOnlyImages: 0,
      };
    }
  }
}

export const imageManager = new ImageManagerService();
