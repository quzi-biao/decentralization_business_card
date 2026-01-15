import * as FileSystem from 'expo-file-system/legacy';
import { documentDirectory, cacheDirectory } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { MINIO_CONFIG } from '../config/minio.config';

const FILES_DIR = `${documentDirectory}files/`;
const FILE_INDEX_KEY = '@file_index';

export type FileType = 'image' | 'document' | 'video' | 'audio' | 'other';
export type FileSource = 'camera' | 'library' | 'document_picker' | 'external';
export type FileContext = 'chat' | 'profile' | 'card' | 'other';

export interface FileMetadata {
  id: string;
  hash: string;
  originalPath: string;
  thumbnailPath?: string;
  minioUrl?: string;
  fileName: string;
  fileType: FileType;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: number;
  source: FileSource;
  context: FileContext;
}

export interface FilePickOptions {
  context?: FileContext;
  uploadToCloud?: boolean;
  generateThumbnail?: boolean;
  calculateHash?: boolean;
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

export interface DocumentPickOptions {
  context?: FileContext;
  uploadToCloud?: boolean;
  type?: string | string[];
  copyToCacheDirectory?: boolean;
  multiple?: boolean;
}

/**
 * 统一的文件管理服务
 * 支持图片、文档、视频等多种文件类型
 * 根据 context 自动决定是否上传到云端
 */
class FileManagerService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const dirInfo = await FileSystem.getInfoAsync(FILES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(FILES_DIR, { intermediates: true });
    }
    this.initialized = true;
  }

  /**
   * 拍照
   */
  async takePhoto(options: FilePickOptions = {}): Promise<FileMetadata | null> {
    try {
      const permission = await ImagePicker.getCameraPermissionsAsync();
      if (!permission.granted) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('需要相机权限才能拍照');
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        return await this.saveFile(asset.uri, {
          source: 'camera',
          fileName: `photo_${Date.now()}.jpg`,
          fileType: 'image',
          mimeType: 'image/jpeg',
          width: asset.width,
          height: asset.height,
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
   * 从相册选择图片
   */
  async pickImage(options: FilePickOptions = {}): Promise<FileMetadata | null> {
    try {
      const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('需要相册权限才能选择图片');
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const extension = asset.uri.split('.').pop() || 'jpg';
        return await this.saveFile(asset.uri, {
          source: 'library',
          fileName: `image_${Date.now()}.${extension}`,
          fileType: 'image',
          mimeType: asset.mimeType || `image/${extension}`,
          width: asset.width,
          height: asset.height,
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
   * 选择文档/文件
   */
  async pickDocument(options: DocumentPickOptions = {}): Promise<FileMetadata | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: options.type || '*/*',
        copyToCacheDirectory: options.copyToCacheDirectory ?? true,
        multiple: options.multiple ?? false,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      const fileType = this.getFileTypeFromMimeType(asset.mimeType || '');
      
      return await this.saveFile(asset.uri, {
        source: 'document_picker',
        fileName: asset.name,
        fileType,
        mimeType: asset.mimeType || 'application/octet-stream',
        fileSize: asset.size || 0,
        context: options.context || 'other',
        uploadToCloud: options.uploadToCloud,
      });
    } catch (error) {
      console.error('Error picking document:', error);
      throw error;
    }
  }

  /**
   * 直接保存 Base64 数据（用于迁移等场景）
   */
  async saveBase64(
    base64Data: string,
    options: {
      fileName: string;
      fileType: FileType;
      mimeType: string;
      context?: FileContext;
      uploadToCloud?: boolean;
    }
  ): Promise<FileMetadata> {
    return await this.saveFile(base64Data, {
      source: 'external',
      ...options,
    });
  }

  /**
   * 保存文件
   */
  private async saveFile(
    uriOrBase64: string,
    options: {
      source: FileSource;
      fileName: string;
      fileType: FileType;
      mimeType: string;
      fileSize?: number;
      width?: number;
      height?: number;
      duration?: number;
      context?: FileContext;
      uploadToCloud?: boolean;
      calculateHash?: boolean;
    }
  ): Promise<FileMetadata> {
    await this.initialize();

    const {
      source,
      fileName,
      fileType,
      mimeType,
      fileSize,
      width,
      height,
      duration,
      context = 'other',
      calculateHash = true,
    } = options;

    // 根据 context 决定是否上传到云端
    const shouldUploadToCloud = options.uploadToCloud ?? (context === 'chat');

    let fileUri = uriOrBase64;

    // 如果是 base64，先转换为临时文件
    if (uriOrBase64.startsWith('data:')) {
      const tempPath = `${cacheDirectory}temp_${Date.now()}_${fileName}`;
      const base64Data = uriOrBase64.split(',')[1];
      await FileSystem.writeAsStringAsync(tempPath, base64Data, {
        encoding: 'base64',
      });
      fileUri = tempPath;
    }

    // 计算 hash（用于去重和文件命名）
    const hash = calculateHash ? await this.calculateFileHash(fileUri) : `file_${Date.now()}`;

    // 生成唯一 ID
    const fileId = `${hash}_${Date.now()}`;

    // 获取文件信息
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error(`Source file does not exist: ${fileUri}`);
    }

    const extension = fileName.split('.').pop() || 'bin';
    const finalFileName = `${fileId}.${extension}`;

    // 保存文件
    const originalPath = `${FILES_DIR}${finalFileName}`;

    // 检查是否已存在相同 hash 的文件（去重）
    if (calculateHash) {
      const existingFile = await this.findFileByHash(hash);
      if (existingFile) {
        console.log('File already exists, checking MinIO URL...');
        
        // 如果需要上传到云端但文件没有 minioUrl，则补充上传
        if (shouldUploadToCloud && !existingFile.minioUrl) {
          try {
            console.log('补充上传到 MinIO:', existingFile.originalPath);
            existingFile.minioUrl = await this.uploadToMinIO(
              existingFile.originalPath,
              existingFile.hash,
              existingFile.fileName
            );
            console.log('✓ 补充上传成功:', existingFile.minioUrl);
            
            // 更新元数据索引
            await this.saveFileIndex(existingFile.id, existingFile);
          } catch (error) {
            console.error('✗ 补充上传失败:', error);
          }
        }
        
        console.log('返回已存在文件:', existingFile);
        return existingFile;
      }
    }

    await FileSystem.copyAsync({
      from: fileUri,
      to: originalPath,
    });

    // 创建元数据
    const metadata: FileMetadata = {
      id: fileId,
      hash,
      originalPath,
      fileName,
      fileType,
      mimeType,
      fileSize: fileSize || fileInfo.size || 0,
      width,
      height,
      duration,
      createdAt: Date.now(),
      source,
      context,
    };

    // 上传到云端（如果需要）
    if (shouldUploadToCloud) {
      try {
        console.log('开始上传到 MinIO:', { originalPath, hash, fileName });
        metadata.minioUrl = await this.uploadToMinIO(originalPath, hash, fileName);
        console.log('✓ MinIO 上传成功:', metadata.minioUrl);
        console.log('完整 metadata:', metadata);
      } catch (error) {
        console.error('✗ MinIO 上传失败:', error);
        console.error('Failed to upload to MinIO, continuing with local storage:', error);
      }
    }

    // 保存元数据索引
    await this.saveFileIndex(fileId, metadata);

    // 清理临时文件
    if (fileUri.startsWith('file://') && fileUri.includes('cache')) {
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (error) {
        console.warn('Failed to delete temp file:', error);
      }
    }

    return metadata;
  }

  /**
   * 计算文件内容的 SHA256 hash
   */
  private async calculateFileHash(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const hash = CryptoJS.SHA256(base64).toString();
      return hash;
    } catch (error) {
      console.error('Error calculating file hash:', error);
      throw error;
    }
  }

  /**
   * 上传文件到 MinIO
   */
  private async uploadToMinIO(localPath: string, hash: string, fileName: string): Promise<string> {
    try {
      const extension = fileName.split('.').pop() || 'bin';
      const objectName = `files/${hash}.${extension}`;
      const uploadUrl = `${MINIO_CONFIG.endpoint}/${MINIO_CONFIG.bucket}/${objectName}`;

      // 确定正确的 MIME 类型
      let mimeType = 'application/octet-stream';
      if (extension === 'jpg' || extension === 'jpeg') {
        mimeType = 'image/jpeg';
      } else if (extension === 'png') {
        mimeType = 'image/png';
      } else if (extension === 'gif') {
        mimeType = 'image/gif';
      } else if (extension === 'webp') {
        mimeType = 'image/webp';
      } else if (extension === 'pdf') {
        mimeType = 'application/pdf';
      }

      // 读取文件内容为 base64
      const base64Content = await FileSystem.readAsStringAsync(localPath, {
        encoding: 'base64',
      });

      // 将 base64 解码为二进制数据
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 使用 fetch PUT 上传二进制数据
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
          'Content-Length': bytes.length.toString(),
        },
        body: bytes,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MinIO upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const publicUrl = `${MINIO_CONFIG.endpoint}/${MINIO_CONFIG.bucket}/${objectName}`;
      return publicUrl;
    } catch (error) {
      console.error('Error uploading to MinIO:', error);
      throw error;
    }
  }

  /**
   * 通过 hash 查找文件（去重检查）
   */
  private async findFileByHash(hash: string): Promise<FileMetadata | null> {
    try {
      const indexStr = await AsyncStorage.getItem(FILE_INDEX_KEY);
      if (!indexStr) return null;

      const index = JSON.parse(indexStr);
      const fileId = Object.keys(index).find(id => index[id].hash === hash);

      if (fileId) {
        const metadata = index[fileId];
        const fileInfo = await FileSystem.getInfoAsync(metadata.originalPath);
        if (fileInfo.exists) {
          return metadata;
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding file by hash:', error);
      return null;
    }
  }

  /**
   * 根据 MIME 类型判断文件类型
   */
  private getFileTypeFromMimeType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation')
    ) {
      return 'document';
    }
    return 'other';
  }

  /**
   * 获取文件 URI
   */
  async getFileUri(fileId: string, preferCloud = false): Promise<string | null> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) return null;

    if (preferCloud && metadata.minioUrl) {
      return metadata.minioUrl;
    }

    const fileInfo = await FileSystem.getInfoAsync(metadata.originalPath);
    return fileInfo.exists ? metadata.originalPath : null;
  }

  /**
   * 获取文件 Base64
   */
  async getFileBase64(fileId: string): Promise<string | null> {
    const uri = await this.getFileUri(fileId, false);
    if (!uri) return null;

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const metadata = await this.getFileMetadata(fileId);
      const mimeType = metadata?.mimeType || 'application/octet-stream';
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Failed to read file as base64:', error);
      return null;
    }
  }

  /**
   * 获取文件元数据
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const indexStr = await AsyncStorage.getItem(FILE_INDEX_KEY);
      if (!indexStr) return null;
      const index = JSON.parse(indexStr);
      return index[fileId] || null;
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      return null;
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string): Promise<void> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) return;

    try {
      await FileSystem.deleteAsync(metadata.originalPath, { idempotent: true });
      if (metadata.thumbnailPath) {
        await FileSystem.deleteAsync(metadata.thumbnailPath, { idempotent: true });
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }

    await this.removeFileIndex(fileId);
  }

  /**
   * 获取所有文件 ID
   */
  async getAllFileIds(): Promise<string[]> {
    try {
      const indexStr = await AsyncStorage.getItem(FILE_INDEX_KEY);
      if (!indexStr) return [];
      const index = JSON.parse(indexStr);
      return Object.keys(index);
    } catch (error) {
      console.error('Failed to get all file IDs:', error);
      return [];
    }
  }

  /**
   * 获取所有文件元数据
   */
  async getAllFiles(): Promise<FileMetadata[]> {
    try {
      const indexStr = await AsyncStorage.getItem(FILE_INDEX_KEY);
      if (!indexStr) return [];
      const index = JSON.parse(indexStr);
      return Object.values(index);
    } catch (error) {
      console.error('Failed to get all files:', error);
      return [];
    }
  }

  /**
   * 按类型获取文件
   */
  async getFilesByType(fileType: FileType): Promise<FileMetadata[]> {
    const allFiles = await this.getAllFiles();
    return allFiles.filter(file => file.fileType === fileType);
  }

  /**
   * 按上下文获取文件
   */
  async getFilesByContext(context: FileContext): Promise<FileMetadata[]> {
    const allFiles = await this.getAllFiles();
    return allFiles.filter(file => file.context === context);
  }

  /**
   * 清理所有文件
   */
  async clearAllFiles(): Promise<void> {
    try {
      await FileSystem.deleteAsync(FILES_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(FILES_DIR, { intermediates: true });
      await AsyncStorage.removeItem(FILE_INDEX_KEY);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to clear all files:', error);
      throw error;
    }
  }

  /**
   * 清理不存在的文件索引
   */
  async cleanupOrphanedIndexes(): Promise<number> {
    try {
      const indexStr = await AsyncStorage.getItem(FILE_INDEX_KEY);
      if (!indexStr) return 0;

      const index = JSON.parse(indexStr);
      const fileIds = Object.keys(index);
      let cleanedCount = 0;

      for (const fileId of fileIds) {
        const metadata = index[fileId];
        const fileInfo = await FileSystem.getInfoAsync(metadata.originalPath);

        if (!fileInfo.exists) {
          delete index[fileId];
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await AsyncStorage.setItem(FILE_INDEX_KEY, JSON.stringify(index));
      }

      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup orphaned indexes:', error);
      return 0;
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    cloudFiles: number;
    localOnlyFiles: number;
    byType: Record<FileType, number>;
    byContext: Record<FileContext, number>;
  }> {
    try {
      const files = await this.getAllFiles();
      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.fileSize, 0),
        cloudFiles: files.filter(file => file.minioUrl).length,
        localOnlyFiles: files.filter(file => !file.minioUrl).length,
        byType: {
          image: files.filter(f => f.fileType === 'image').length,
          document: files.filter(f => f.fileType === 'document').length,
          video: files.filter(f => f.fileType === 'video').length,
          audio: files.filter(f => f.fileType === 'audio').length,
          other: files.filter(f => f.fileType === 'other').length,
        },
        byContext: {
          chat: files.filter(f => f.context === 'chat').length,
          profile: files.filter(f => f.context === 'profile').length,
          card: files.filter(f => f.context === 'card').length,
          other: files.filter(f => f.context === 'other').length,
        },
      };
      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        cloudFiles: 0,
        localOnlyFiles: 0,
        byType: { image: 0, document: 0, video: 0, audio: 0, other: 0 },
        byContext: { chat: 0, profile: 0, card: 0, other: 0 },
      };
    }
  }

  private async saveFileIndex(fileId: string, metadata: FileMetadata): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem(FILE_INDEX_KEY);
      const index = indexStr ? JSON.parse(indexStr) : {};
      index[fileId] = metadata;
      await AsyncStorage.setItem(FILE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to save file index:', error);
      throw error;
    }
  }

  private async removeFileIndex(fileId: string): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem(FILE_INDEX_KEY);
      if (!indexStr) return;
      const index = JSON.parse(indexStr);
      delete index[fileId];
      await AsyncStorage.setItem(FILE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to remove file index:', error);
    }
  }
}

export const fileManager = new FileManagerService();
