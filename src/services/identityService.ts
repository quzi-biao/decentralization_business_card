import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateKeyPair, generateDID, signData, generateMnemonic } from '../utils/crypto';

/**
 * 身份管理服务
 * 负责用户身份的创建、存储和管理
 */

export interface UserIdentity {
    did: string;
    publicKey: string;
    createdAt: number;
    signature: string;
}

const IDENTITY_KEY = 'user_identity';
const PRIVATE_KEY = 'private_key';
const MNEMONIC_KEY = 'mnemonic';

// 初始化用户身份
export async function initializeIdentity(): Promise<UserIdentity> {
    // 检查是否已存在身份
    const existingIdentity = await getIdentity();
    if (existingIdentity) {
        return existingIdentity;
    }
    
    // 生成新的密钥对
    const { publicKey, privateKey } = await generateKeyPair();
    
    // 生成 DID
    const did = generateDID(publicKey);
    
    // 生成签名
    const signature = signData(did, privateKey);
    
    // 生成助记词
    const mnemonic = generateMnemonic(privateKey);
    
    // 创建身份对象
    const identity: UserIdentity = {
        did,
        publicKey,
        createdAt: Date.now(),
        signature
    };
    
    // 安全存储私钥
    await SecureStore.setItemAsync(PRIVATE_KEY, privateKey);
    
    // 存储助记词（加密）
    await SecureStore.setItemAsync(MNEMONIC_KEY, JSON.stringify(mnemonic));
    
    // 存储身份信息
    await AsyncStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    
    return identity;
}

// 获取当前身份
export async function getIdentity(): Promise<UserIdentity | null> {
    try {
        const identityJson = await AsyncStorage.getItem(IDENTITY_KEY);
        if (!identityJson) return null;
        return JSON.parse(identityJson);
    } catch (error) {
        console.error('Failed to get identity:', error);
        return null;
    }
}

// 获取私钥
export async function getPrivateKey(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(PRIVATE_KEY);
    } catch (error) {
        console.error('Failed to get private key:', error);
        return null;
    }
}

// 获取助记词
export async function getMnemonic(): Promise<string[] | null> {
    try {
        const mnemonicJson = await SecureStore.getItemAsync(MNEMONIC_KEY);
        if (!mnemonicJson) return null;
        return JSON.parse(mnemonicJson);
    } catch (error) {
        console.error('Failed to get mnemonic:', error);
        return null;
    }
}

// 删除身份（重置）
export async function deleteIdentity(): Promise<void> {
    await SecureStore.deleteItemAsync(PRIVATE_KEY);
    await SecureStore.deleteItemAsync(MNEMONIC_KEY);
    await AsyncStorage.removeItem(IDENTITY_KEY);
}

// 检查是否已初始化
export async function isInitialized(): Promise<boolean> {
    const identity = await getIdentity();
    return identity !== null;
}
