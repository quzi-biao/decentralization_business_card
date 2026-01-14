import AsyncStorage from '@react-native-async-storage/async-storage';
import { MINIO_CONFIG, getMinioUploadUrl, getMinioDownloadUrl } from '../config/minio.config';
import { hashData } from '../utils/crypto';

/**
 * MinIO 存储服务
 * 用于上传和下载加密的名片数据到 MinIO 对象存储
 */

const UPLOAD_CACHE_KEY = 'minio_upload_cache';

interface UploadCacheEntry {
  hash: string;
  url: string;
  uploadedAt: number;
}

/**
 * 上传数据到 MinIO
 * @param data 要上传的数据（已加密）
 * @param filename 可选的文件名，如果不提供则使用内容 hash
 * @returns MinIO 中的文件 URL
 */
export async function uploadToMinio(data: string, filename?: string): Promise<string> {
  try {
    // 计算数据的 hash
    const contentHash = hashData(data);
    
    // 检查本地缓存，如果之前上传过相同内容，直接返回 URL
    const cachedUrl = await getCachedUploadUrl(contentHash);
    if (cachedUrl) {
      return cachedUrl;
    }

    // 使用 hash 作为文件名（如果没有提供自定义文件名）
    const objectName = filename || `${contentHash}.json`;
    const uploadUrl = getMinioUploadUrl(objectName);

    // 上传到 MinIO（公共读写 bucket，使用 PUT 请求）
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length.toString(),
      },
      body: data,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MinIO upload failed:', response.status, response.statusText, errorText);
      throw new Error(`MinIO upload failed: ${response.status} ${response.statusText}`);
    }

    // 缓存上传记录
    await cacheUploadUrl(contentHash, uploadUrl);

    return uploadUrl;
  } catch (error) {
    console.error('MinIO upload error:', error);
    throw error;
  }
}

/**
 * 从 MinIO 下载数据
 * @param url MinIO 文件 URL
 * @returns 下载的数据
 */
export async function downloadFromMinio(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`MinIO download failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.text();
    return data;
  } catch (error) {
    console.error('MinIO download error:', error);
    throw error;
  }
}

/**
 * 从 MinIO 下载 JSON 数据
 * @param url MinIO 文件 URL
 * @returns 解析后的 JSON 对象
 */
export async function downloadJsonFromMinio<T = any>(url: string): Promise<T> {
  const data = await downloadFromMinio(url);
  return JSON.parse(data);
}

/**
 * 检查文件是否存在于 MinIO
 * @param url MinIO 文件 URL
 * @returns 文件是否存在
 */
export async function checkMinioFileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * 从本地缓存获取已上传文件的 URL
 */
async function getCachedUploadUrl(hash: string): Promise<string | null> {
  try {
    const cacheJson = await AsyncStorage.getItem(UPLOAD_CACHE_KEY);
    if (!cacheJson) return null;

    const cache: Record<string, UploadCacheEntry> = JSON.parse(cacheJson);
    const entry = cache[hash];

    if (!entry) return null;

    // 检查缓存是否过期（7天）
    const isExpired = Date.now() - entry.uploadedAt > 7 * 24 * 60 * 60 * 1000;
    if (isExpired) {
      return null;
    }

    return entry.url;
  } catch (error) {
    console.error('Failed to get cached upload URL:', error);
    return null;
  }
}

/**
 * 缓存上传记录到本地存储
 */
async function cacheUploadUrl(hash: string, url: string): Promise<void> {
  try {
    const cacheJson = await AsyncStorage.getItem(UPLOAD_CACHE_KEY);
    const cache: Record<string, UploadCacheEntry> = cacheJson ? JSON.parse(cacheJson) : {};

    cache[hash] = {
      hash,
      url,
      uploadedAt: Date.now(),
    };

    await AsyncStorage.setItem(UPLOAD_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to cache upload URL:', error);
  }
}

/**
 * 清理过期的缓存记录
 */
export async function cleanupExpiredCache(): Promise<void> {
  try {
    const cacheJson = await AsyncStorage.getItem(UPLOAD_CACHE_KEY);
    if (!cacheJson) return;

    const cache: Record<string, UploadCacheEntry> = JSON.parse(cacheJson);
    const now = Date.now();
    const expirationTime = 7 * 24 * 60 * 60 * 1000; // 7天

    const cleanedCache: Record<string, UploadCacheEntry> = {};
    for (const [hash, entry] of Object.entries(cache)) {
      if (now - entry.uploadedAt < expirationTime) {
        cleanedCache[hash] = entry;
      }
    }

    await AsyncStorage.setItem(UPLOAD_CACHE_KEY, JSON.stringify(cleanedCache));
  } catch (error) {
    console.error('Failed to cleanup expired cache:', error);
  }
}
