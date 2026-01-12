import { EncryptedStorageService } from './encryptedStorage';

const AVATAR_PREFIX = 'avatar_';
const IMAGE_PREFIX = 'image_';

interface ImageData {
    id: string;
    base64: string;
    timestamp: number;
}

export class FilePersistenceService {
    // 保存头像
    static async saveAvatar(userId: string, base64Data: string): Promise<string> {
        const imageId = `${userId}_${Date.now()}`;
        const key = `${AVATAR_PREFIX}${imageId}`;
        
        // 确保 base64 数据包含前缀
        const base64WithPrefix = base64Data.startsWith('data:') 
            ? base64Data 
            : `data:image/jpeg;base64,${base64Data}`;
        
        const imageData: ImageData = {
            id: imageId,
            base64: base64WithPrefix,
            timestamp: Date.now()
        };
        
        await EncryptedStorageService.setItem(key, imageData);
        return key;
    }

    // 获取头像
    static async getAvatar(key: string): Promise<string | null> {
        try {
            const imageData = await EncryptedStorageService.getItem<ImageData>(key);
            return imageData ? imageData.base64 : null;
        } catch (error) {
            console.error('Failed to read avatar:', error);
            return null;
        }
    }

    // 删除头像
    static async deleteAvatar(key: string): Promise<void> {
        try {
            await EncryptedStorageService.removeItem(key);
        } catch (error) {
            console.error('Failed to delete avatar:', error);
        }
    }

    // 保存通用图片
    static async saveImage(name: string, base64Data: string): Promise<string> {
        const imageId = `${name}_${Date.now()}`;
        const key = `${IMAGE_PREFIX}${imageId}`;
        
        const base64WithPrefix = base64Data.startsWith('data:') 
            ? base64Data 
            : `data:image/jpeg;base64,${base64Data}`;
        
        const imageData: ImageData = {
            id: imageId,
            base64: base64WithPrefix,
            timestamp: Date.now()
        };
        
        await EncryptedStorageService.setItem(key, imageData);
        return key;
    }

    // 获取图片
    static async getImage(key: string): Promise<string | null> {
        try {
            const imageData = await EncryptedStorageService.getItem<ImageData>(key);
            return imageData ? imageData.base64 : null;
        } catch (error) {
            console.error('Failed to read image:', error);
            return null;
        }
    }

    // 删除图片
    static async deleteImage(key: string): Promise<void> {
        try {
            await EncryptedStorageService.removeItem(key);
        } catch (error) {
            console.error('Failed to delete image:', error);
        }
    }

    // 清除所有文件
    static async clearAllFiles(): Promise<void> {
        try {
            const allKeys = await EncryptedStorageService.getAllKeys();
            const imageKeys = allKeys.filter(
                key => key.startsWith(AVATAR_PREFIX) || key.startsWith(IMAGE_PREFIX)
            );
            
            await Promise.all(imageKeys.map(key => EncryptedStorageService.removeItem(key)));
        } catch (error) {
            console.error('Failed to clear files:', error);
        }
    }

    // 获取所有头像
    static async getAllAvatars(): Promise<Array<{ key: string; data: ImageData }>> {
        try {
            const allKeys = await EncryptedStorageService.getAllKeys();
            const avatarKeys = allKeys.filter(key => key.startsWith(AVATAR_PREFIX));
            
            const avatars = await Promise.all(
                avatarKeys.map(async key => {
                    const data = await EncryptedStorageService.getItem<ImageData>(key);
                    return data ? { key, data } : null;
                })
            );
            
            return avatars.filter((item): item is { key: string; data: ImageData } => item !== null);
        } catch (error) {
            console.error('Failed to list avatars:', error);
            return [];
        }
    }

    // 获取所有图片
    static async getAllImages(): Promise<Array<{ key: string; data: ImageData }>> {
        try {
            const allKeys = await EncryptedStorageService.getAllKeys();
            const imageKeys = allKeys.filter(key => key.startsWith(IMAGE_PREFIX));
            
            const images = await Promise.all(
                imageKeys.map(async key => {
                    const data = await EncryptedStorageService.getItem<ImageData>(key);
                    return data ? { key, data } : null;
                })
            );
            
            return images.filter((item): item is { key: string; data: ImageData } => item !== null);
        } catch (error) {
            console.error('Failed to list images:', error);
            return [];
        }
    }
}
