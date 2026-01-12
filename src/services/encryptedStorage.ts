import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ENCRYPTION_KEY = 'business-card-encryption-key-v1';
const STORAGE_PREFIX = '@BusinessCard:';

export class EncryptedStorageService {
    private static encryptionKey: string | null = null;

    private static async getEncryptionKey(): Promise<string> {
        if (this.encryptionKey) {
            return this.encryptionKey;
        }

        let key = await SecureStore.getItemAsync(ENCRYPTION_KEY);
        if (!key) {
            key = CryptoJS.lib.WordArray.random(32).toString();
            await SecureStore.setItemAsync(ENCRYPTION_KEY, key);
        }

        this.encryptionKey = key;
        return key;
    }

    private static encrypt(data: string): string {
        const key = CryptoJS.enc.Utf8.parse(this.encryptionKey!);
        const encrypted = CryptoJS.AES.encrypt(data, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString();
    }

    private static decrypt(encryptedData: string): string {
        const key = CryptoJS.enc.Utf8.parse(this.encryptionKey!);
        const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }

    static async setItem(key: string, value: any): Promise<void> {
        await this.getEncryptionKey();
        const jsonString = JSON.stringify(value);
        const encrypted = this.encrypt(jsonString);
        await AsyncStorage.setItem(`${STORAGE_PREFIX}${key}`, encrypted);
    }

    static async getItem<T>(key: string): Promise<T | null> {
        await this.getEncryptionKey();
        const encrypted = await AsyncStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (!encrypted) {
            return null;
        }

        try {
            const decrypted = this.decrypt(encrypted);
            return JSON.parse(decrypted) as T;
        } catch (error) {
            console.error(`Failed to decrypt data for key: ${key}`, error);
            return null;
        }
    }

    static async removeItem(key: string): Promise<void> {
        await AsyncStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    }

    static async getAllKeys(): Promise<string[]> {
        const allKeys = await AsyncStorage.getAllKeys();
        return allKeys
            .filter(key => key.startsWith(STORAGE_PREFIX))
            .map(key => key.replace(STORAGE_PREFIX, ''));
    }

    static async clear(): Promise<void> {
        const keys = await this.getAllKeys();
        await Promise.all(
            keys.map(key => AsyncStorage.removeItem(`${STORAGE_PREFIX}${key}`))
        );
        await SecureStore.deleteItemAsync(ENCRYPTION_KEY);
        this.encryptionKey = null;
    }
}
