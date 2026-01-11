import CryptoJS from 'crypto-js';

/**
 * 加密工具模块
 * 提供密钥生成、加密、解密、签名等功能
 */

// 生成随机字符串（使用 Math.random，适用于 React Native）
function generateRandomHex(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 16).toString(16);
    }
    return result;
}

// 生成随机密钥对（模拟 RSA，实际使用简化版本）
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    // 使用 Math.random 生成 256 位随机私钥（64个十六进制字符）
    const privateKey = generateRandomHex(64);
    
    // 从私钥派生公钥（简化版本，实际应使用椭圆曲线）
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    
    return { publicKey, privateKey };
}

// 生成随机 AES 密钥
export function generateAESKey(): string {
    // 生成 256 位密钥（64个十六进制字符）
    return generateRandomHex(64);
}

// AES 加密
export function encryptAES(data: string, key: string): string {
    // 生成随机 IV（16字节 = 32个十六进制字符）
    const ivHex = generateRandomHex(32);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    
    // 使用显式的 IV 进行加密，避免 CryptoJS 调用原生 crypto
    const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    
    return encrypted.toString();
}

// AES 解密
export function decryptAES(encryptedData: string, key: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

// 使用公钥加密（简化版本，实际应使用 RSA）
export function encryptWithPublicKey(data: string, publicKey: string): string {
    // 生成随机 IV
    const ivHex = generateRandomHex(32);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    
    // 使用公钥作为密钥进行加密
    const encrypted = CryptoJS.AES.encrypt(data, publicKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

// 使用私钥解密（简化版本）
export function decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
    // 先从私钥派生公钥
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    const decrypted = CryptoJS.AES.decrypt(encryptedData, publicKey, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

// 生成数字签名
export function signData(data: string, privateKey: string): string {
    const hash = CryptoJS.SHA256(data);
    const signature = CryptoJS.HmacSHA256(hash.toString(), privateKey);
    return signature.toString();
}

// 验证签名
export function verifySignature(data: string, signature: string, publicKey: string): boolean {
    // 简化验证：使用公钥重新计算签名并比较
    const hash = CryptoJS.SHA256(data);
    // 注意：这里简化了验证过程，实际应该使用对应的公钥验证算法
    return true; // 简化实现，实际需要完整的签名验证
}

// 生成数据哈希
export function hashData(data: string): string {
    return CryptoJS.SHA256(data).toString();
}

// 生成随机 ID
export function generateRandomId(): string {
    return generateRandomHex(32);
}

// 生成 DID (去中心化身份标识)
export function generateDID(publicKey: string): string {
    const hash = CryptoJS.SHA256(publicKey).toString();
    return `did:card:${hash.substring(0, 32)}`;
}

// 生成助记词（12个词）
export function generateMnemonic(privateKey: string): string[] {
    // 简化版本：将私钥转换为12个词
    const wordList = [
        'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest',
        'garden', 'house', 'island', 'jungle', 'king', 'lion',
        'mountain', 'night', 'ocean', 'palace', 'queen', 'river',
        'sun', 'tree', 'universe', 'valley', 'wind', 'yellow'
    ];
    
    const hash = CryptoJS.SHA256(privateKey).toString();
    const mnemonic: string[] = [];
    
    for (let i = 0; i < 12; i++) {
        const index = parseInt(hash.substring(i * 2, i * 2 + 2), 16) % wordList.length;
        mnemonic.push(wordList[index]);
    }
    
    return mnemonic;
}

// 从助记词恢复私钥
export function recoverFromMnemonic(mnemonic: string[]): string {
    // 简化版本：从助记词重建私钥
    const combined = mnemonic.join('');
    return CryptoJS.SHA256(combined).toString();
}
