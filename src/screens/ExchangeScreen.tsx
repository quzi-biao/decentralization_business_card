import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useCardStore } from '../store/useCardStore';
import { useExchangeStore } from '../store/useExchangeStore';
import { getIdentity } from '../services/identityService';
import { uploadEncryptedCard, createAccessGrant, downloadEncryptedCard, getAccessGrant, decryptCardData } from '../services/storageService';
import { generateRandomId } from '../utils/crypto';

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

    useEffect(() => {
        // 延迟生成二维码，让页面先渲染
        const timer = setTimeout(() => {
            generateMyQRCode();
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);


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

            // 上传加密的名片数据
            console.log('Step 3: Uploading encrypted card...');
            const encryptedPackage = await uploadEncryptedCard(cardData);
            console.log('Step 4: Card uploaded successfully');

            // 生成二维码数据
            const qrPayload = {
                did: identity.did,
                publicKey: identity.publicKey,
                storageUrl: encryptedPackage.storageUrl,
                signature: encryptedPackage.signature,
                timestamp: Date.now()
            };

            console.log('Step 5: Setting QR data...');
            setQrData(JSON.stringify(qrPayload));
            console.log('Step 6: QR code generated successfully');
        } catch (error: any) {
            console.error('Failed to generate QR code:', error);
            console.error('Error stack:', error.stack);
            Alert.alert('错误', `生成二维码失败: ${error.message}`);
        } finally {
            setIsGeneratingQR(false);
        }
    };

    // 处理扫描结果
    const handleBarCodeScanned = async ({ data }: any) => {
        if (isProcessing) return;
        
        setIsProcessing(true);
        
        try {
            const qrPayload = JSON.parse(data);
            const { did: peerDid, publicKey: peerPublicKey, storageUrl: peerStorageUrl } = qrPayload;

            const identity = await getIdentity();
            if (!identity) {
                Alert.alert('错误', '请先初始化身份');
                return;
            }

            // 检查是否已经交换过
            const existingExchange = useExchangeStore.getState().getExchange(peerDid);
            if (existingExchange) {
                Alert.alert('提示', '已经与该用户交换过名片');
                setIsProcessing(false);
                return;
            }

            // 创建访问授权（让对方能访问我的名片）
            await createAccessGrant(peerDid, peerPublicKey);

            // 创建交换记录
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

            // 尝试下载并解密对方的名片
            try {
                const encryptedPackage = await downloadEncryptedCard(peerStorageUrl);
                if (encryptedPackage) {
                    const grant = await getAccessGrant(peerDid, identity.did);
                    if (grant) {
                        const peerCardData = await decryptCardData(encryptedPackage, grant);
                        setExchangedCard(peerDid, peerCardData);
                    }
                }
            } catch (error) {
                console.error('Failed to decrypt peer card:', error);
            }

            Alert.alert('成功', '名片交换成功！', [
                { text: '确定', onPress: () => setMode('qr') }
            ]);
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

                        <View style={styles.qrActions}>
                            <TouchableOpacity style={styles.qrActionButton}>
                                <MaterialIcons name="save-alt" size={18} color="#64748b" />
                                <Text style={styles.qrActionText}>保存图片</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.qrActionButton, styles.qrActionButtonPrimary]}>
                                <MaterialIcons name="share" size={18} color="#ffffff" />
                                <Text style={[styles.qrActionText, styles.qrActionTextPrimary]}>分享</Text>
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
                        onPress={() => setMode('scan')}
                    >
                        <MaterialIcons name="qr-code-scanner" size={48} color="#4F46E5" style={styles.scanIcon} />
                        <Text style={styles.scanTitle}>扫描对方二维码</Text>
                        <Text style={styles.scanHint}>点击开始扫描</Text>
                    </TouchableOpacity>
                </View>

                {/* 扫描模态框 */}
                {mode === 'scan' && (
                    <View style={styles.scanModal}>
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => setMode('qr')}
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
});

export default ExchangeScreen;
