import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIdentity, getPrivateKey } from './identityService';
import { encryptAES, decryptAES, generateAESKey, encryptWithPublicKey, signData, hashData } from '../utils/crypto';
import { uploadToMinio, downloadFromMinio } from './minioService';
import { DataAccessControlService } from './dataAccessControl';

/**
 * 存储服务
 * 负责加密数据的上传和下载（模拟 OSS）
 */

export interface EncryptedPackage {
    did: string;
    storageUrl: string;
    encryptedData: string;
    encryptedKey: string;
    dataHash: string;
    signature: string;
    version: string;
    timestamp: number;
}

export interface AccessGrant {
    granterDid: string;
    granteeDid: string;
    granteePublicKey: string;
    encryptedAESKey: string;
    expiresAt: number;
    signature: string;
}

const STORAGE_PREFIX = 'encrypted_card_';
const GRANT_PREFIX = 'access_grant_';

// 上传加密的名片数据
export async function uploadEncryptedCard(cardData: any): Promise<EncryptedPackage> {
    const identity = await getIdentity();
    const privateKey = await getPrivateKey();
    
    if (!identity || !privateKey) {
        throw new Error('Identity not initialized');
    }
    
    // 根据可见性设置过滤名片数据
    const filteredCardData = await DataAccessControlService.filterCardDataForExchange(cardData);
    console.log('Card data filtered for exchange. Original fields:', Object.keys(cardData).length, 'Filtered fields:', Object.keys(filteredCardData).length);
    
    // 生成 AES 密钥
    const aesKey = generateAESKey();
    
    // 用 AES 加密过滤后的名片数据
    const cardJson = JSON.stringify(filteredCardData);
    const encryptedData = encryptAES(cardJson, aesKey);
    
    // 用自己的公钥加密 AES 密钥
    const encryptedKey = encryptWithPublicKey(aesKey, identity.publicKey);
    
    // 生成数据哈希
    const dataHash = hashData(encryptedData);
    
    // 生成签名
    const signature = signData(dataHash, privateKey);
    
    // 创建加密包
    const package_: EncryptedPackage = {
        did: identity.did,
        storageUrl: '', // 将在上传后设置
        encryptedData,
        encryptedKey,
        dataHash,
        signature,
        version: '1.0.0',
        timestamp: Date.now()
    };
    
    // 尝试上传到 MinIO，使用内容 hash 作为文件名
    try {
        const minioUrl = await uploadToMinio(JSON.stringify(package_), `${dataHash}.json`);
        package_.storageUrl = minioUrl;
        console.log('✓ Encrypted card uploaded to MinIO:', minioUrl);
    } catch (error) {
        console.warn('MinIO upload failed, will use local storage only');
        // MinIO 上传失败不影响功能，使用空 URL，后续交换时会重试
        package_.storageUrl = '';
    }
    
    // 同时保存到本地 AsyncStorage 作为备份
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${identity.did}`, JSON.stringify(package_));
    
    // 保存 AES 密钥到本地（用于后续创建授权）
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${identity.did}_key`, aesKey);
    
    return package_;
}

// 下载加密的名片数据
export async function downloadEncryptedCard(storageUrl: string): Promise<EncryptedPackage | null> {
    try {
        // 如果是 MinIO URL，从 MinIO 下载
        if (storageUrl.startsWith('http://') || storageUrl.startsWith('https://')) {
            const data = await downloadFromMinio(storageUrl);
            return JSON.parse(data);
        }
        
        // 否则从本地 AsyncStorage 读取（向后兼容）
        const packageJson = await AsyncStorage.getItem(storageUrl);
        if (!packageJson) return null;
        return JSON.parse(packageJson);
    } catch (error) {
        console.error('Failed to download encrypted card:', error);
        return null;
    }
}

// 创建访问授权
export async function createAccessGrant(peerDid: string, peerPublicKey: string): Promise<AccessGrant> {
    const identity = await getIdentity();
    const privateKey = await getPrivateKey();
    
    if (!identity || !privateKey) {
        throw new Error('Identity not initialized');
    }
    
    // 获取自己的 AES 密钥
    const aesKey = await AsyncStorage.getItem(`${STORAGE_PREFIX}${identity.did}_key`);
    if (!aesKey) {
        throw new Error('AES key not found');
    }
    
    // 用对方的公钥加密 AES 密钥
    const encryptedAESKey = encryptWithPublicKey(aesKey, peerPublicKey);
    
    // 创建授权
    const grant: AccessGrant = {
        granterDid: identity.did,
        granteeDid: peerDid,
        granteePublicKey: peerPublicKey,
        encryptedAESKey,
        expiresAt: Date.now() + 365 * 24 * 3600 * 1000, // 1年
        signature: signData(encryptedAESKey, privateKey)
    };
    
    // 存储授权
    const grantKey = `${GRANT_PREFIX}${identity.did}_to_${peerDid}`;
    await AsyncStorage.setItem(grantKey, JSON.stringify(grant));
    
    return grant;
}

// 为特定公钥创建预授权（用于二维码）
export async function createPreAuthorizedGrant(targetPublicKey: string): Promise<string> {
    const identity = await getIdentity();
    const privateKey = await getPrivateKey();
    
    if (!identity || !privateKey) {
        throw new Error('Identity not initialized');
    }
    
    // 获取自己的 AES 密钥
    const aesKey = await AsyncStorage.getItem(`${STORAGE_PREFIX}${identity.did}_key`);
    if (!aesKey) {
        throw new Error('AES key not found');
    }
    
    // 用目标公钥加密 AES 密钥
    const encryptedAESKey = encryptWithPublicKey(aesKey, targetPublicKey);
    
    return encryptedAESKey;
}

// 获取访问授权
export async function getAccessGrant(granterDid: string, granteeDid: string): Promise<AccessGrant | null> {
    try {
        const grantKey = `${GRANT_PREFIX}${granterDid}_to_${granteeDid}`;
        const grantJson = await AsyncStorage.getItem(grantKey);
        if (!grantJson) return null;
        return JSON.parse(grantJson);
    } catch (error) {
        console.error('Failed to get access grant:', error);
        return null;
    }
}

// 解密名片数据
export async function decryptCardData(encryptedPackage: EncryptedPackage, grant: AccessGrant): Promise<any> {
    const privateKey = await getPrivateKey();
    if (!privateKey) {
        throw new Error('Private key not found');
    }
    
    // 用自己的私钥解密 AES 密钥
    const aesKey = decryptWithPrivateKey(grant.encryptedAESKey, privateKey);
    
    // 用 AES 密钥解密名片数据
    const decryptedJson = decryptAES(encryptedPackage.encryptedData, aesKey);
    
    return JSON.parse(decryptedJson);
}

// 撤销访问授权
export async function revokeAccessGrant(granteeDid: string): Promise<void> {
    const identity = await getIdentity();
    if (!identity) {
        throw new Error('Identity not initialized');
    }
    
    const grantKey = `${GRANT_PREFIX}${identity.did}_to_${granteeDid}`;
    await AsyncStorage.removeItem(grantKey);
    
    // 添加到撤销列表
    const revocationKey = `revocation_${identity.did}`;
    const revocationListJson = await AsyncStorage.getItem(revocationKey);
    const revocationList = revocationListJson ? JSON.parse(revocationListJson) : [];
    revocationList.push({
        granteeDid,
        revokedAt: Date.now()
    });
    await AsyncStorage.setItem(revocationKey, JSON.stringify(revocationList));
}

// 检查授权是否被撤销
export async function isGrantRevoked(granterDid: string, granteeDid: string): Promise<boolean> {
    try {
        const revocationKey = `revocation_${granterDid}`;
        const revocationListJson = await AsyncStorage.getItem(revocationKey);
        if (!revocationListJson) return false;
        
        const revocationList = JSON.parse(revocationListJson);
        return revocationList.some((item: any) => item.granteeDid === granteeDid);
    } catch (error) {
        console.error('Failed to check revocation:', error);
        return false;
    }
}

function decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
    // 从私钥派生公钥
    const CryptoJS = require('crypto-js');
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    const decrypted = CryptoJS.AES.decrypt(encryptedData, publicKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
}
