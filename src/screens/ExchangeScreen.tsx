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
import { useCardStore, BusinessCardData } from '../store/useCardStore';
import { useExchangeStore } from '../store/useExchangeStore';
import { useTagStore, TAG_COLORS } from '../store/useTagStore';
import { getIdentity } from '../services/identityService';
import { uploadEncryptedCard, createAccessGrant, downloadEncryptedCard, getAccessGrant, decryptCardData } from '../services/storageService';
import { generateRandomId } from '../utils/crypto';
import MyCard from '../components/MyCard';

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
    const [scannedCard, setScannedCard] = useState<BusinessCardData | null>(null);
    const [scannedPeerDid, setScannedPeerDid] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const qrRef = useRef<ViewShot>(null);

    // 预设标签
    const availableTags = ['客户', '供应商', '合作伙伴', '朋友', '同事', '潜在客户'];

    useEffect(() => {
        // 延迟生成二维码，让页面先渲染
        const timer = setTimeout(() => {
            generateMyQRCode();
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);

    // 监听名片数据变化，自动重新生成二维码
    useEffect(() => {
        // 只有在已经生成过二维码后才重新生成
        if (qrData) {
            console.log('Card data changed, regenerating QR code...');
            generateMyQRCode();
        }
    }, [cardData]);


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

            // 每次都重新上传加密的名片数据，确保使用最新的名片信息
            console.log('Step 3: Uploading latest encrypted card...');
            const encryptedPackage = await uploadEncryptedCard(cardData);
            console.log('Step 4: Card uploaded successfully to:', encryptedPackage.storageUrl);

            // 获取新生成的 AES 密钥（用于二维码中）
            const aesKey = await AsyncStorage.getItem(`encrypted_card_${identity.did}_key`);
            if (!aesKey) {
                throw new Error('AES key not found');
            }

            // 生成二维码数据（包含 AES 密钥）
            const qrPayload = {
                did: identity.did,
                publicKey: identity.publicKey,
                storageUrl: encryptedPackage.storageUrl,
                aesKey: aesKey, // 直接包含 AES 密钥
                signature: encryptedPackage.signature,
                timestamp: Date.now()
            };

            console.log('Step 5: Setting QR data...');
            setQrData(JSON.stringify(qrPayload));
            console.log('Step 6: QR code generated successfully with latest card data');
        } catch (error: any) {
            console.error('Failed to generate QR code:', error);
            console.error('Error stack:', error.stack);
            Alert.alert('错误', `生成二维码失败: ${error.message}`);
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
        // 防止重复扫描：检查是否正在处理
        if (isProcessing) return;
        
        // 防止重复扫描：检查是否是相同的二维码
        if (data === lastScannedData) return;
        
        // 防止重复扫描：添加冷却时间（2秒内不处理相同或新的扫描）
        const now = Date.now();
        if (now - lastScanTime < 2000) return;
        
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
                
                // 保存 AES 密钥以便后续使用
                await AsyncStorage.setItem(`encrypted_card_${peerDid}_key`, aesKey);
            } catch (error: any) {
                console.error('Failed to get peer card:', error);
                Alert.alert('错误', `无法获取对方名片: ${error.message}\n\n${isUpdate ? '更新' : '交换'}已取消`);
                setIsProcessing(false);
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
                setMode('qr');
                setScannedCard(peerCardData);
                setScannedPeerDid(peerDid);
            }
        } catch (error) {
            console.error('Failed to exchange card:', error);
            Alert.alert('错误', '名片交换失败，请重试');
        } finally {
            setIsProcessing(false);
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
                                        <ActivityIndicator size="large" color="#4F46E5" />
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
                            // 重置扫描状态，允许重新扫描
                            setLastScannedData('');
                            setLastScanTime(0);
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
                                // 重置扫描状态
                                setLastScannedData('');
                                setLastScanTime(0);
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
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingTop: 8,
    },
    qrSection: {
        marginBottom: 16,
    },
    qrCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e0e7ff',
    },
    qrHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    qrIcon: {
        marginRight: 12,
    },
    qrTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    qrSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    qrWrapper: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginBottom: 16,
    },
    qrPlaceholder: {
        width: 220,
        height: 220,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        gap: 12,
    },
    placeholderText: {
        fontSize: 14,
        textAlign: 'center',
    },
    qrActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    qrActionButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    qrActionButtonPrimary: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    qrActionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    qrActionTextPrimary: {
        color: '#ffffff',
    },
    qrActionButtonDisabled: {
        backgroundColor: '#e2e8f0',
        borderColor: '#e2e8f0',
    },
    qrActionTextDisabled: {
        color: '#cbd5e1',
    },
    qrInfo: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        gap: 8,
    },
    qrInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    qrInfoText: {
        fontSize: 12,
        color: '#64748b',
    },
    scanSection: {
        marginBottom: 16,
    },
    scanCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    scanIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    scanTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 6,
    },
    scanHint: {
        fontSize: 13,
        color: '#94a3b8',
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
        fontSize: 24,
        color: '#ffffff',
        fontWeight: '300',
    },
    permissionView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    permissionIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    permissionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 12,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 24,
    },
    permissionButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#4F46E5',
        borderRadius: 10,
    },
    permissionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
    cameraContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    camera: {
        width: 300,
        height: 300,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#4F46E5',
    },
    cameraTipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 6,
    },
    cameraTipIcon: {
        marginRight: 4,
    },
    cameraTip: {
        color: '#ffffff',
        fontSize: 14,
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    modalCloseButton: {
        padding: 8,
    },
    modalContent: {
        flex: 1,
    },
    modalCardWrapper: {
        padding: 16,
    },
    tagsSection: {
        marginTop: 20,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    tagButtonSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    tagButtonText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    tagButtonTextSelected: {
        color: '#ffffff',
    },
    noteSection: {
        marginTop: 20,
    },
    noteInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: '#1e293b',
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modalFooter: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    modalButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    scannedCardSection: {
        marginBottom: 16,
    },
    scannedCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    scannedCardTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#10b981',
    },
    closeScannedCard: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ExchangeScreen;
