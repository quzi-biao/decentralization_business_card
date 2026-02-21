import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Modal, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import ViewShot from 'react-native-view-shot';
import NetInfo from '@react-native-community/netinfo';
import { useCardStore, BusinessCardData } from '../store/useCardStore';
import { useExchangeStore } from '../store/useExchangeStore';
import { useTagStore, TAG_COLORS } from '../store/useTagStore';
import { getIdentity } from '../services/identityService';
import { uploadEncryptedCard, createAccessGrant, downloadEncryptedCard, getAccessGrant, decryptCardData } from '../services/storageService';
import { generateRandomId } from '../utils/crypto';
import { checkMinioFileExists } from '../services/minioService';
import { fileManager } from '../services/fileManager';
import MyCard from '../components/MyCard';
import { ThemeConfig } from '../constants/theme';

/**
 * 名片交换屏幕
 * 支持生成二维码和扫描二维码交换名片
 */

const ExchangeScreen = () => {
    const { cardData } = useCardStore();
    const { addExchange, setExchangedCard } = useExchangeStore();
    
    const [mode, setMode] = useState<'qr' | 'scan'>('qr');
    const [qrData, setQrData] = useState<string>('');
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const [lastScannedData, setLastScannedData] = useState<string>('');
    const [lastScanTime, setLastScanTime] = useState<number>(0);
    const [scanFailed, setScanFailed] = useState(false);
    const scanFailedRef = useRef(false); // 同步标志，立即阻止后续扫描
    const [scannedCard, setScannedCard] = useState<BusinessCardData | null>(null);
    const [scannedPeerDid, setScannedPeerDid] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const qrRef = useRef<ViewShot>(null);

    // 预设标签
    const availableTags = ['客户', '供应商', '合作伙伴', '朋友', '同事', '潜在客户'];

    useEffect(() => {
        // 立即生成二维码
        generateMyQRCode();
    }, []);

    // 监听网络状态变化，网络恢复后自动刷新二维码并重置扫描状态
    useEffect(() => {
        let previouslyDisconnected = false;
        
        const unsubscribe = NetInfo.addEventListener(state => {
            console.log('Network state changed:', state);
            
            // 检测网络从断开到连接的转变
            if (state.isConnected && state.isInternetReachable !== false) {
                if (previouslyDisconnected) {
                    console.log('✅ Network restored, auto-refreshing QR code...');
                    // 网络恢复，自动刷新二维码
                    generateMyQRCode();
                    
                    // 重置扫描失败状态，允许用户重新扫描
                    if (scanFailedRef.current) {
                        console.log('🔄 Resetting scan failure state, user can retry scanning');
                        scanFailedRef.current = false;
                        setScanFailed(false);
                    }
                }
                previouslyDisconnected = false;
            } else {
                console.log('⚠️ Network disconnected');
                previouslyDisconnected = true;
            }
        });
        
        return () => {
            unsubscribe();
        };
    }, []);

    // 监听名片数据变化，自动重新生成二维码
    useEffect(() => {
        // 只有在已经生成过二维码后才重新生成
        if (qrData) {
            console.log('🔄 Card data changed, regenerating QR code...');
            generateMyQRCode();
        }
    }, [cardData]);


    // 验证并上传所有图片文件到 MinIO
    const validateAndUploadImages = async (): Promise<{
        avatarUrl?: string;
        wechatQrCodeUrl?: string;
        companyImageUrls?: string[];
        missingFiles: string[];
    }> => {
        const missingFiles: string[] = [];
        let avatarUrl: string | undefined;
        let wechatQrCodeUrl: string | undefined;
        const companyImageUrls: string[] = [];

        // 1. 检查并上传头像
        if (cardData.avatarId) {
            console.log('Checking avatar in MinIO...', 'avatarId:', cardData.avatarId);
            try {
                const avatarFile = await fileManager.getFileMetadata(cardData.avatarId);
                console.log('Avatar file metadata:', avatarFile);
                if (avatarFile) {
                    if (avatarFile.minioUrl) {
                        console.log('Checking if avatar exists at:', avatarFile.minioUrl);
                        const exists = await checkMinioFileExists(avatarFile.minioUrl);
                        if (exists) {
                            avatarUrl = avatarFile.minioUrl;
                            console.log('✓ Avatar exists in MinIO:', avatarUrl);
                        } else {
                            console.log('⚠ Avatar URL exists in metadata but file not found in MinIO');
                        }
                    }
                    
                    if (!avatarUrl) {
                        console.log('Uploading avatar to MinIO...');
                        const updatedFile = await fileManager.ensureFileUploaded(cardData.avatarId);
                        if (updatedFile?.minioUrl) {
                            avatarUrl = updatedFile.minioUrl;
                            console.log('✓ Avatar uploaded to MinIO:', avatarUrl);
                        } else {
                            missingFiles.push('头像');
                        }
                    }
                } else {
                    missingFiles.push('头像');
                }
            } catch (error) {
                missingFiles.push('头像');
            }
        }

        // 2. 检查并上传微信二维码
        if (cardData.wechatQrCodeId) {
            console.log('Checking WeChat QR code in MinIO...');
            try {
                const qrFile = await fileManager.getFileMetadata(cardData.wechatQrCodeId);
                if (qrFile) {
                    if (qrFile.minioUrl) {
                        const exists = await checkMinioFileExists(qrFile.minioUrl);
                        if (exists) {
                            wechatQrCodeUrl = qrFile.minioUrl;
                            console.log('✓ WeChat QR code exists in MinIO');
                        }
                    }
                    
                    if (!wechatQrCodeUrl) {
                        console.log('Uploading WeChat QR code to MinIO...');
                        const updatedFile = await fileManager.ensureFileUploaded(cardData.wechatQrCodeId);
                        if (updatedFile?.minioUrl) {
                            wechatQrCodeUrl = updatedFile.minioUrl;
                            console.log('✓ WeChat QR code uploaded to MinIO');
                        } else {
                            missingFiles.push('微信二维码');
                        }
                    }
                } else {
                    missingFiles.push('微信二维码');
                }
            } catch (error) {
                missingFiles.push('微信二维码');
            }
        }

        // 3. 检查并上传公司图片
        if (cardData.companyImageIds && cardData.companyImageIds.length > 0) {
            console.log(`Checking ${cardData.companyImageIds.length} company images in MinIO...`);
            for (let i = 0; i < cardData.companyImageIds.length; i++) {
                const imageId = cardData.companyImageIds[i];
                try {
                    const imageFile = await fileManager.getFileMetadata(imageId);
                    if (imageFile) {
                        let imageUrl: string | undefined;
                        
                        if (imageFile.minioUrl) {
                            const exists = await checkMinioFileExists(imageFile.minioUrl);
                            if (exists) {
                                imageUrl = imageFile.minioUrl;
                                console.log(`✓ Company image ${i + 1} exists in MinIO`);
                            }
                        }
                        
                        if (!imageUrl) {
                            console.log(`Uploading company image ${i + 1} to MinIO...`);
                            const updatedFile = await fileManager.ensureFileUploaded(imageId);
                            if (updatedFile?.minioUrl) {
                                imageUrl = updatedFile.minioUrl;
                                console.log(`✓ Company image ${i + 1} uploaded to MinIO`);
                            } else {
                                missingFiles.push(`公司图片 ${i + 1}`);
                            }
                        }
                        
                        if (imageUrl) {
                            companyImageUrls.push(imageUrl);
                        }
                    } else {
                        missingFiles.push(`公司图片 ${i + 1}`);
                    }
                } catch (error) {
                    missingFiles.push(`公司图片 ${i + 1}`);
                }
            }
        }

        return { avatarUrl, wechatQrCodeUrl, companyImageUrls, missingFiles };
    };

    // 生成我的二维码
    const generateMyQRCode = async () => {
        setIsGeneratingQR(true);
        try {
            console.log('Step 1: Getting identity...');
            const identity = await getIdentity();
            if (!identity) {
                Alert.alert('错误', '请先初始化身份');
                setIsGeneratingQR(false);
                return;
            }
            console.log('Step 2: Identity obtained:', identity.did);

            // Step 3: 验证并上传所有图片文件
            console.log('Step 3: Validating and uploading all images...');
            const { avatarUrl, wechatQrCodeUrl, companyImageUrls, missingFiles } = await validateAndUploadImages();
            
            // 如果有文件上传失败，显示警告但继续
            if (missingFiles.length > 0) {
                // console.warn('Some files failed to upload:', missingFiles);
                // Alert.alert(
                //     '提示',
                //     `以下文件暂未上传到云端：\n${missingFiles.join('、')}\n\n二维码已生成，交换名片时会自动重试上传。`,
                //     [
                //         { text: '知道了', style: 'default' }
                //     ]
                // );
            }

            // Step 4: 上传加密的名片数据
            console.log('Step 4: Uploading latest encrypted card...');
            const encryptedPackage = await uploadEncryptedCard(cardData);
            console.log('Step 5: Card uploaded successfully to:', encryptedPackage.storageUrl);

            // 获取新生成的 AES 密钥（用于二维码中）
            const aesKey = await AsyncStorage.getItem(`encrypted_card_${identity.did}_key`);
            if (!aesKey) {
                throw new Error('AES key not found');
            }

            // 生成二维码数据（包含所有图片 URL）
            const qrPayload = {
                did: identity.did,
                publicKey: identity.publicKey,
                storageUrl: encryptedPackage.storageUrl,
                aesKey: aesKey,
                signature: encryptedPackage.signature,
                avatarUrl: avatarUrl,
                wechatQrCodeUrl: wechatQrCodeUrl,
                companyImageUrls: (companyImageUrls?.length ?? 0) > 0 ? companyImageUrls : undefined,
                timestamp: Date.now()
            };

            console.log('Step 6: QR Payload Image URLs:');
            console.log('  - avatarUrl:', avatarUrl || 'NOT SET');
            console.log('  - wechatQrCodeUrl:', wechatQrCodeUrl || 'NOT SET');
            console.log('  - companyImageUrls:', (companyImageUrls?.length ?? 0) > 0 ? companyImageUrls : 'NOT SET');
            
            setQrData(JSON.stringify(qrPayload));
            console.log('Step 7: QR code generated successfully');
        } catch (error: any) {
            console.error('Failed to generate QR code:', error);
            console.error('Error stack:', error.stack);
            Alert.alert('提示', '二维码生成失败，请检查网络连接后重试。');
        } finally {
            setIsGeneratingQR(false);
        }
    };

    // 保存二维码到相册
    const handleSaveQRCode = async () => {
        if (!qrRef.current || !qrData) {
            Alert.alert('提示', '二维码还未生成完成');
            return;
        }

        try {
            setIsSaving(true);

            // 请求媒体库权限
            const { status } = await MediaLibrary.requestPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('需要权限', '请允许访问相册以保存二维码');
                return;
            }

            // 捕获二维码视图
            if (!qrRef.current) {
                Alert.alert('错误', '二维码视图未准备好');
                return;
            }
            const uri = await qrRef.current.capture();
            
            // 直接保存到相册
            await MediaLibrary.saveToLibraryAsync(uri);
            console.log("保存成功")

            Alert.alert('成功', '二维码已保存到相册');
        } catch (error) {
            console.error('Failed to save QR code:', error);
            Alert.alert('错误', '保存二维码失败，请重试');
        } finally {
            setIsSaving(false);
        }
    };

    // 分享二维码
    const handleShareQRCode = async () => {
        if (!qrRef.current || !qrData) {
            Alert.alert('提示', '二维码还未生成完成');
            return;
        }

        try {
            setIsSaving(true);

            // 检查是否支持分享
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('提示', '当前设备不支持分享功能');
                return;
            }

            // 捕获二维码视图
            if (!qrRef.current) {
                Alert.alert('错误', '二维码视图未准备好');
                return;
            }

            const uri = await qrRef.current.capture();
            
            // 分享图片
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: '分享我的名片二维码',
                UTI: 'public.png',
            });
        } catch (error) {
            console.error('Failed to share QR code:', error);
            Alert.alert('错误', '分享二维码失败，请重试');
        } finally {
            setIsSaving(false);
        }
    };

    // 处理扫描结果
    const handleBarCodeScanned = async ({ data }: any) => {
        // 如果扫描已失败，阻止所有扫描（使用 ref 实现同步检查）
        if (scanFailedRef.current) return;
        
        // 防止重复扫描：检查是否正在处理
        if (isProcessing) return;
        
        // 防止重复扫描：检查是否是相同的二维码
        if (data === lastScannedData) return;
        
        // 防止重复扫描：添加冷却时间（5秒内不处理相同或新的扫描）
        const now = Date.now();
        if (now - lastScanTime < 5000) return;
        
        setLastScannedData(data);
        setLastScanTime(now);
        setIsProcessing(true);
        
        try {
            const qrPayload = JSON.parse(data);
            const { did: peerDid, publicKey: peerPublicKey, storageUrl: peerStorageUrl } = qrPayload;

            const identity = await getIdentity();
            if (!identity) {
                Alert.alert('错误', '请先初始化身份');
                setIsProcessing(false);
                return;
            }

            // 在交换前检查并重试上传图片到 MinIO
            console.log('Checking and retrying image uploads before exchange...');
            const { avatarUrl, wechatQrCodeUrl, companyImageUrls, missingFiles } = await validateAndUploadImages();
            
            // 图片上传失败不影响交换，继续执行
            if (missingFiles.length > 0) {
                console.log('Some images failed to upload, but exchange will continue:', missingFiles);
            }
            
            // 检查加密名片数据是否已上传
            const storedPackage = await AsyncStorage.getItem(`encrypted_card_${identity.did}`);
            if (storedPackage) {
                const package_ = JSON.parse(storedPackage);
                if (!package_.storageUrl) {
                    console.log('Encrypted card not uploaded, retrying...');
                    try {
                        const newPackage = await uploadEncryptedCard(cardData);
                        if (!newPackage.storageUrl) {
                            throw new Error('MinIO upload failed');
                        }
                        console.log('✓ Encrypted card uploaded successfully');
                    } catch (error) {
                        // 立即设置失败标志，防止后续 Alert
                        if (!scanFailedRef.current) {
                            scanFailedRef.current = true;
                            Alert.alert(
                                '网络连接失败',
                                '无法上传名片数据到云端，请检查网络连接后重试交换名片。',
                                [{ text: '确定' }]
                            );
                        }
                        setIsProcessing(false);
                        setScanFailed(true);
                        return;
                    }
                }
            }

            // 检查是否已经交换过
            const existingExchange = useExchangeStore.getState().getExchange(peerDid);
            const isUpdate = !!existingExchange;

            // 1. 创建访问授权（让对方能访问我的名片）
            console.log('Creating access grant for peer...');
            await createAccessGrant(peerDid, peerPublicKey);

            // 2. 尝试下载并解密对方的名片（使用二维码中的 AES 密钥）
            let peerCardData: BusinessCardData | null = null;
            try {
                console.log('Downloading encrypted card from:', peerStorageUrl);
                const encryptedPackage = await downloadEncryptedCard(peerStorageUrl);
                if (!encryptedPackage) {
                    throw new Error('无法下载对方的名片数据');
                }
                
                // 从二维码获取 AES 密钥
                const aesKey = qrPayload.aesKey;
                if (!aesKey) {
                    throw new Error('二维码中缺少 AES 密钥');
                }
                
                console.log('Decrypting card data with AES key from QR...');
                // 直接使用 AES 密钥解密
                const { decryptAES } = require('../utils/crypto');
                const decryptedJson = decryptAES(encryptedPackage.encryptedData, aesKey);
                peerCardData = JSON.parse(decryptedJson);
                
                if (!peerCardData) {
                    throw new Error('无法解密对方的名片');
                }
                
                // 下载头像（如果二维码中包含头像 URL）
                if (qrPayload.avatarUrl && peerCardData) {
                    try {
                        console.log('Downloading avatar from:', qrPayload.avatarUrl);
                        const avatarFile = await fileManager.downloadFromUrl(qrPayload.avatarUrl);
                        if (avatarFile) {
                            peerCardData.avatarId = avatarFile.id;
                            console.log('✓ Avatar downloaded and saved:', avatarFile.id);
                        }
                    } catch (error) {
                        // 头像下载失败不影响整体流程
                    }
                }
                
                // 下载微信二维码（如果二维码中包含微信二维码 URL）
                if (qrPayload.wechatQrCodeUrl && peerCardData) {
                    try {
                        console.log('Downloading WeChat QR code from:', qrPayload.wechatQrCodeUrl);
                        const qrFile = await fileManager.downloadFromUrl(qrPayload.wechatQrCodeUrl);
                        if (qrFile) {
                            peerCardData.wechatQrCodeId = qrFile.id;
                            console.log('✓ WeChat QR code downloaded and saved:', qrFile.id);
                        }
                    } catch (error) {
                        // 微信二维码下载失败不影响整体流程
                    }
                }
                
                // 下载公司图片（如果二维码中包含公司图片 URLs）
                if (qrPayload.companyImageUrls && Array.isArray(qrPayload.companyImageUrls) && peerCardData) {
                    try {
                        console.log(`Downloading ${qrPayload.companyImageUrls.length} company images...`);
                        const downloadedImageIds: string[] = [];
                        
                        for (let i = 0; i < qrPayload.companyImageUrls.length; i++) {
                            const imageUrl = qrPayload.companyImageUrls[i];
                            try {
                                console.log(`Downloading company image ${i + 1} from:`, imageUrl);
                                const imageFile = await fileManager.downloadFromUrl(imageUrl);
                                if (imageFile) {
                                    downloadedImageIds.push(imageFile.id);
                                    console.log(`✓ Company image ${i + 1} downloaded and saved:`, imageFile.id);
                                }
                            } catch (error) {
                                // 单个图片下载失败不影响其他图片
                            }
                        }
                        
                        if (downloadedImageIds.length > 0) {
                            peerCardData.companyImageIds = downloadedImageIds;
                            console.log(`✓ Total ${downloadedImageIds.length} company images downloaded`);
                        }
                    } catch (error) {
                        // 公司图片下载失败不影响整体流程
                    }
                }
                
                // 保存 AES 密钥以便后续使用
                await AsyncStorage.setItem(`encrypted_card_${peerDid}_key`, aesKey);
            } catch (error: any) {
                // 立即设置失败标志，防止后续 Alert
                if (!scanFailedRef.current) {
                    scanFailedRef.current = true;
                    Alert.alert(
                        '网络连接失败', 
                        '无法下载对方的名片数据，请检查网络连接后重新打开扫描重试。'
                    );
                }
                setIsProcessing(false);
                setScanFailed(true);
                return;
            }

            // 如果是更新，更新交换记录和名片数据
            if (isUpdate) {
                await useExchangeStore.getState().updateExchange(peerDid, {
                    peerPublicKey,
                    peerStorageUrl,
                    lastSyncAt: Date.now(),
                });
                await setExchangedCard(peerDid, peerCardData);
                
                // 加载已有的标签和备注
                const existingExchange = useExchangeStore.getState().getExchange(peerDid);
                if (existingExchange) {
                    setSelectedTags(existingExchange.tags || []);
                    setNote(existingExchange.note || '');
                }
                
                // 退出扫描模式，显示名片预览弹窗
                console.log('✓ Exchange updated, showing card preview modal');
                console.log('Peer card data:', peerCardData ? 'exists' : 'null');
                setMode('qr');
                setScannedCard(peerCardData);
                setScannedPeerDid(peerDid);
            } else {
                // 创建新的交换记录
                const exchange = {
                    id: generateRandomId(),
                    myDid: identity.did,
                    peerDid,
                    peerPublicKey,
                    peerStorageUrl,
                    exchangedAt: Date.now(),
                    lastSyncAt: Date.now(),
                    status: 'active' as const
                };

                await addExchange(exchange);
                await setExchangedCard(peerDid, peerCardData);

                // 新建交换记录，清空标签和备注
                setSelectedTags([]);
                setNote('');
                
                // 退出扫描模式，显示名片预览弹窗
                console.log('✓ Exchange created, showing card preview modal');
                console.log('Peer card data:', peerCardData ? 'exists' : 'null');
                setMode('qr');
                setScannedCard(peerCardData);
                setScannedPeerDid(peerDid);
            }
        } catch (error) {
            console.warn('Exchange failed:', error);
            // 立即设置失败标志，防止后续 Alert
            if (!scanFailedRef.current) {
                scanFailedRef.current = true;
                Alert.alert('错误', '名片交换失败，请重新打开扫描重试。');
            }
            setIsProcessing(false);
            setScanFailed(true);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* 我的二维码区域 */}
                <View style={styles.qrSection}>
                    <View style={styles.qrCard}>
                        <View style={styles.qrHeader}>
                            <MaterialIcons name="qr-code-2" size={24} color="#4F46E5" style={styles.qrIcon} />
                            <View>
                                <Text style={styles.qrTitle}>我的二维码</Text>
                                <Text style={styles.qrSubtitle}>让对方扫描此二维码交换名片</Text>
                            </View>
                        </View>
                            
                        <ViewShot ref={qrRef} options={{ format: 'png', quality: 1.0 }}>
                            <View style={styles.qrWrapper}>
                                {qrData ? (
                                    <QRCode
                                        value={qrData}
                                        size={220}
                                        backgroundColor="white"
                                        color="#4F46E5"
                                    />
                                ) : (
                                    <View style={styles.qrPlaceholder}>
                                        <ActivityIndicator size="large" color={ThemeConfig.colors.primary} />
                                        <Text style={styles.placeholderText}>正在生成二维码...</Text>
                                    </View>
                                )}
                            </View>
                        </ViewShot>

                        <View style={styles.qrActions}>
                            <TouchableOpacity 
                                style={styles.qrActionButton}
                                onPress={handleSaveQRCode}
                                disabled={!qrData || isSaving}
                            >
                                <MaterialIcons name="save-alt" size={18} color={!qrData || isSaving ? "#cbd5e1" : "#64748b"} />
                                <Text style={[styles.qrActionText, (!qrData || isSaving) && styles.qrActionTextDisabled]}>
                                    {isSaving ? '保存中...' : '保存图片'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.qrActionButton, styles.qrActionButtonPrimary, (!qrData || isSaving) && styles.qrActionButtonDisabled]}
                                onPress={handleShareQRCode}
                                disabled={!qrData || isSaving}
                            >
                                <MaterialIcons name="share" size={18} color={!qrData || isSaving ? "#cbd5e1" : "#ffffff"} />
                                <Text style={[styles.qrActionText, styles.qrActionTextPrimary, (!qrData || isSaving) && styles.qrActionTextDisabled]}>
                                    分享
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.qrInfo}>
                            <View style={styles.qrInfoRow}>
                                <MaterialIcons name="lock" size={16} color="#64748b" />
                                <Text style={styles.qrInfoText}>端到端加密保护</Text>
                            </View>
                            <View style={styles.qrInfoRow}>
                                <MaterialIcons name="vpn-key" size={16} color="#64748b" />
                                <Text style={styles.qrInfoText}>只有交换过的用户才能解密</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 扫描按钮区域 */}
                <View style={styles.scanSection}>
                    <TouchableOpacity 
                        style={styles.scanCard}
                        onPress={() => {
                            setScannedCard(null);
                            // 重置扫描失败状态，但保留 lastScannedData 防止重复扫描
                            scanFailedRef.current = false;
                            setScanFailed(false);
                            setMode('scan');
                        }}
                    >
                        <MaterialIcons name="qr-code-scanner" size={48} color="#4F46E5" style={styles.scanIcon} />
                        <Text style={styles.scanTitle}>扫描对方二维码</Text>
                        <Text style={styles.scanHint}>点击开始扫描</Text>
                    </TouchableOpacity>
                </View>

                {/* 扫描到的名片弹窗 */}
                <Modal
                    visible={!!scannedCard}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => {
                        setScannedCard(null);
                        setScannedPeerDid('');
                        // 重置状态
                        setSelectedTags([]);
                        setNote('');
                        setLastScannedData('');
                        setLastScanTime(0);
                    }}
                >
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleRow}>
                                <MaterialIcons name="check-circle" size={28} color="#10b981" />
                                <Text style={styles.modalTitle}>名片交换成功</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.modalCloseButton}
                                onPress={() => {
                                    setScannedCard(null);
                                    // 重置扫描状态
                                    setLastScannedData('');
                                    setLastScanTime(0);
                                }}
                            >
                                <MaterialIcons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalContent}>
                            {scannedCard && (
                                <View style={styles.modalCardWrapper}>
                                    <MyCard cardData={scannedCard} />
                                    
                                    {/* 标签选择 */}
                                    <View style={styles.tagsSection}>
                                        <Text style={styles.sectionLabel}>标签</Text>
                                        <View style={styles.tagsContainer}>
                                            {availableTags.map((tag) => (
                                                <TouchableOpacity
                                                    key={tag}
                                                    style={[
                                                        styles.tagButton,
                                                        selectedTags.includes(tag) && styles.tagButtonSelected
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedTags(prev => 
                                                            prev.includes(tag)
                                                                ? prev.filter(t => t !== tag)
                                                                : [...prev, tag]
                                                        );
                                                    }}
                                                >
                                                    <Text style={[
                                                        styles.tagButtonText,
                                                        selectedTags.includes(tag) && styles.tagButtonTextSelected
                                                    ]}>
                                                        {tag}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    {/* 备注输入框 */}
                                    <View style={styles.noteSection}>
                                        <Text style={styles.sectionLabel}>备注</Text>
                                        <TextInput
                                            style={styles.noteInput}
                                            placeholder="添加备注信息..."
                                            placeholderTextColor="#94a3b8"
                                            multiline
                                            numberOfLines={4}
                                            value={note}
                                            onChangeText={setNote}
                                            textAlignVertical="top"
                                        />
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                        
                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={styles.modalButton}
                                onPress={async () => {
                                    // 保存标签和备注到交换记录
                                    if (scannedPeerDid) {
                                        try {
                                            console.log('开始保存标签和备注...');
                                            console.log('peerDid:', scannedPeerDid);
                                            console.log('标签:', selectedTags);
                                            console.log('备注:', note);
                                            
                                            // 检查交换记录是否存在
                                            const exchange = useExchangeStore.getState().getExchange(scannedPeerDid);
                                            if (!exchange) {
                                                console.error('未找到交换记录:', scannedPeerDid);
                                                Alert.alert('错误', '未找到对应的交换记录');
                                                return;
                                            }
                                            
                                            // 1. 保存到 CardExchange（用于记录原始标签名称）
                                            await useExchangeStore.getState().updateExchange(scannedPeerDid, {
                                                tags: selectedTags.length > 0 ? selectedTags : undefined,
                                                note: note.trim() || undefined,
                                            });
                                            
                                            // 2. 转换标签名称为标签ID并保存到 useTagStore
                                            const tagStore = useTagStore.getState();
                                            const tagIds: string[] = [];
                                            
                                            for (const tagName of selectedTags) {
                                                // 查找是否已存在该标签
                                                let existingTag = tagStore.tags.find(t => t.name === tagName);
                                                
                                                if (!existingTag) {
                                                    // 创建新标签
                                                    const colorIndex = tagStore.tags.length % TAG_COLORS.length;
                                                    await tagStore.addTag({
                                                        name: tagName,
                                                        color: TAG_COLORS[colorIndex]
                                                    });
                                                    // 重新获取创建的标签
                                                    existingTag = tagStore.tags.find(t => t.name === tagName);
                                                }
                                                
                                                if (existingTag) {
                                                    tagIds.push(existingTag.id);
                                                }
                                            }
                                            
                                            // 保存到 cardMetadata
                                            await tagStore.setCardMetadata(scannedPeerDid, {
                                                tags: tagIds,
                                                note: note.trim()
                                            });
                                            
                                            console.log('✓ 标签和备注已成功保存到两个存储');
                                        } catch (error) {
                                            console.error('保存标签和备注失败:', error);
                                            Alert.alert('错误', '保存失败，请重试');
                                            return;
                                        }
                                    }
                                    
                                    setScannedCard(null);
                                    setScannedPeerDid('');
                                    // 重置状态
                                    setSelectedTags([]);
                                    setNote('');
                                    setLastScannedData('');
                                    setLastScanTime(0);
                                }}
                            >
                                <Text style={styles.modalButtonText}>完成</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </Modal>

                {/* 扫描模态框 */}
                {mode === 'scan' && (
                    <View style={styles.scanModal}>
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => {
                                setMode('qr');
                                // 关闭扫描时清空扫描记录，允许下次重新扫描
                                setLastScannedData('');
                                setLastScanTime(0);
                                scanFailedRef.current = false;
                                setScanFailed(false);
                            }}
                        >
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>

                        {!permission ? (
                            <View style={styles.permissionView}>
                                <Text style={styles.permissionTitle}>请求相机权限...</Text>
                            </View>
                        ) : !permission.granted ? (
                            <View style={styles.permissionView}>
                                <Text style={styles.permissionIcon}>⚠️</Text>
                                <Text style={styles.permissionTitle}>需要相机权限</Text>
                                <Text style={styles.permissionText}>请在设置中允许访问相机</Text>
                                <TouchableOpacity
                                    style={styles.permissionButton}
                                    onPress={requestPermission}
                                >
                                    <Text style={styles.permissionButtonText}>重新请求权限</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.cameraContainer}>
                                <View style={styles.camera}>
                                    <CameraView
                                        style={StyleSheet.absoluteFillObject}
                                        facing="back"
                                        barcodeScannerSettings={{
                                            barcodeTypes: ['qr'],
                                        }}
                                        onBarcodeScanned={isProcessing ? undefined : handleBarCodeScanned}
                                    />
                                </View>
                                <View style={styles.cameraTipContainer}>
                                    {isProcessing && <MaterialIcons name="hourglass-empty" size={16} color="#ffffff" style={styles.cameraTipIcon} />}
                                    <Text style={styles.cameraTip}>
                                        {isProcessing ? '处理中...' : '将二维码对准扫描框'}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: ThemeConfig.spacing.base,
        paddingTop: ThemeConfig.spacing.sm,
    },
    qrSection: {
        marginBottom: ThemeConfig.spacing.base,
    },
    qrCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.lg,
        ...ThemeConfig.shadow.primary,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: '#e0e7ff',
    },
    qrHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: ThemeConfig.spacing.lg,
    },
    qrIcon: {
        marginRight: ThemeConfig.spacing.md,
    },
    qrTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: 2,
    },
    qrSubtitle: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textSecondary,
    },
    qrWrapper: {
        alignItems: 'center',
        padding: ThemeConfig.spacing.lg,
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        marginBottom: ThemeConfig.spacing.base,
    },
    qrPlaceholder: {
        width: 220,
        height: 220,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderRadius: ThemeConfig.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ThemeConfig.borderWidth.base,
        borderColor: ThemeConfig.colors.border,
        borderStyle: 'dashed',
        gap: ThemeConfig.spacing.md,
    },
    placeholderText: {
        fontSize: ThemeConfig.fontSize.base,
        textAlign: 'center',
    },
    qrActions: {
        flexDirection: 'row',
        gap: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.base,
    },
    qrActionButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: ThemeConfig.spacing.md,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    qrActionButtonPrimary: {
        backgroundColor: ThemeConfig.colors.primary,
        borderColor: ThemeConfig.colors.primary,
    },
    qrActionText: {
        fontSize: ThemeConfig.fontSize.base - 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
    },
    qrActionTextPrimary: {
        color: ThemeConfig.colors.white,
    },
    qrActionButtonDisabled: {
        backgroundColor: ThemeConfig.colors.border,
        borderColor: ThemeConfig.colors.border,
    },
    qrActionTextDisabled: {
        color: ThemeConfig.colors.textDisabled,
    },
    qrInfo: {
        paddingTop: ThemeConfig.spacing.base,
        borderTopWidth: ThemeConfig.borderWidth.thin,
        borderTopColor: ThemeConfig.colors.backgroundTertiary,
        gap: ThemeConfig.spacing.sm,
    },
    qrInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    qrInfoText: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textSecondary,
    },
    scanSection: {
        marginBottom: ThemeConfig.spacing.base,
    },
    scanCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.xxxl - 8,
        alignItems: 'center',
        borderWidth: ThemeConfig.borderWidth.base,
        borderColor: ThemeConfig.colors.border,
        borderStyle: 'dashed',
    },
    scanIcon: {
        fontSize: 48,
        marginBottom: ThemeConfig.spacing.md,
    },
    scanTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: 6,
    },
    scanHint: {
        fontSize: ThemeConfig.fontSize.base - 1,
        color: ThemeConfig.colors.textTertiary,
    },
    scanModal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000000',
        zIndex: 1000,
    },
    closeButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
    },
    closeButtonText: {
        fontSize: ThemeConfig.fontSize.xxxl,
        color: ThemeConfig.colors.white,
        fontWeight: '300',
    },
    permissionView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: ThemeConfig.spacing.xxxl,
    },
    permissionIcon: {
        fontSize: 64,
        marginBottom: ThemeConfig.spacing.lg,
    },
    permissionTitle: {
        fontSize: ThemeConfig.fontSize.xl,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.white,
        marginBottom: ThemeConfig.spacing.md,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textTertiary,
        textAlign: 'center',
        marginBottom: ThemeConfig.spacing.xxxl - 16,
    },
    permissionButton: {
        paddingHorizontal: ThemeConfig.spacing.xxxl - 16,
        paddingVertical: ThemeConfig.spacing.md,
        backgroundColor: ThemeConfig.colors.primary,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
    },
    permissionButtonText: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.white,
    },
    cameraContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    camera: {
        width: 300,
        height: 300,
        borderRadius: ThemeConfig.borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: ThemeConfig.colors.primary,
    },
    cameraTipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: ThemeConfig.spacing.base,
        gap: 6,
    },
    cameraTipIcon: {
        marginRight: 4,
    },
    cameraTip: {
        color: ThemeConfig.colors.white,
        fontSize: ThemeConfig.fontSize.base,
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: ThemeConfig.spacing.lg,
        paddingVertical: ThemeConfig.spacing.base,
        backgroundColor: ThemeConfig.colors.background,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.border,
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.md,
    },
    modalTitle: {
        fontSize: ThemeConfig.fontSize.xxl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
    },
    modalCloseButton: {
        padding: ThemeConfig.spacing.sm,
    },
    modalContent: {
        flex: 1,
    },
    modalCardWrapper: {
        padding: ThemeConfig.spacing.base,
    },
    tagsSection: {
        marginTop: ThemeConfig.spacing.lg,
    },
    sectionLabel: {
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.md,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ThemeConfig.spacing.sm,
    },
    tagButton: {
        paddingHorizontal: ThemeConfig.spacing.base,
        paddingVertical: ThemeConfig.spacing.sm,
        borderRadius: ThemeConfig.borderRadius.lg,
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    tagButtonSelected: {
        backgroundColor: ThemeConfig.colors.primary,
        borderColor: ThemeConfig.colors.primary,
    },
    tagButtonText: {
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textSecondary,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    tagButtonTextSelected: {
        color: ThemeConfig.colors.white,
    },
    noteSection: {
        marginTop: ThemeConfig.spacing.lg,
    },
    noteInput: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.md,
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textPrimary,
        minHeight: 100,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    modalFooter: {
        padding: ThemeConfig.spacing.base,
        backgroundColor: ThemeConfig.colors.background,
        borderTopWidth: ThemeConfig.borderWidth.thin,
        borderTopColor: ThemeConfig.colors.border,
    },
    modalButton: {
        backgroundColor: ThemeConfig.colors.primary,
        paddingVertical: ThemeConfig.spacing.base,
        borderRadius: ThemeConfig.borderRadius.md,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.white,
    },
    scannedCardSection: {
        marginBottom: ThemeConfig.spacing.base,
    },
    scannedCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        marginBottom: ThemeConfig.spacing.md,
        gap: ThemeConfig.spacing.sm,
        ...ThemeConfig.shadow.sm,
    },
    scannedCardTitle: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.success,
    },
    closeScannedCard: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ExchangeScreen;
