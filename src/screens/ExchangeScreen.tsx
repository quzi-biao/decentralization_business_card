import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
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

    useEffect(() => {
        generateMyQRCode();
    }, []);


    // 生成我的二维码
    const generateMyQRCode = async () => {
        try {
            console.log('Step 1: Getting identity...');
            const identity = await getIdentity();
            if (!identity) {
                Alert.alert('错误', '请先初始化身份');
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
        <SafeAreaView style={styles.container}>
            {/* 模式切换 */}
            <View style={styles.modeSelector}>
                <TouchableOpacity
                    style={[styles.modeButton, mode === 'qr' && styles.modeButtonActive]}
                    onPress={() => setMode('qr')}
                >
                    <Text style={[styles.modeButtonText, mode === 'qr' && styles.modeButtonTextActive]}>
                        我的二维码
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, mode === 'scan' && styles.modeButtonActive]}
                    onPress={() => setMode('scan')}
                >
                    <Text style={[styles.modeButtonText, mode === 'scan' && styles.modeButtonTextActive]}>
                        扫描名片
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 内容区域 */}
            <ScrollView contentContainerStyle={styles.content}>
                {mode === 'qr' ? (
                    <View style={styles.qrContainer}>
                        <View style={styles.card}>
                            <Text style={styles.title}>📇 我的名片二维码</Text>
                            <Text style={styles.subtitle}>让对方扫描此二维码交换名片</Text>
                            
                            {qrData ? (
                                <View style={styles.qrWrapper}>
                                    <QRCode
                                        value={qrData}
                                        size={240}
                                        backgroundColor="white"
                                        color="#475569"
                                    />
                                </View>
                            ) : (
                                <View style={styles.qrPlaceholder}>
                                    <Text style={styles.placeholderText}>生成中...</Text>
                                </View>
                            )}

                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>🔒 您的名片数据已加密存储</Text>
                                <Text style={styles.infoText}>🔑 只有交换过的用户才能解密查看</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.scanContainer}>
                        {!permission ? (
                            <View style={styles.card}>
                                <Text style={styles.title}>请求相机权限...</Text>
                            </View>
                        ) : !permission.granted ? (
                            <View style={styles.card}>
                                <Text style={styles.title}>⚠️ 需要相机权限</Text>
                                <Text style={styles.subtitle}>请在设置中允许访问相机</Text>
                                <TouchableOpacity
                                    style={styles.permissionButton}
                                    onPress={requestPermission}
                                >
                                    <Text style={styles.permissionButtonText}>重新请求权限</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.scannerWrapper}>
                                <Text style={styles.scanTitle}>📷 扫描对方的二维码</Text>
                                <View style={styles.scanner}>
                                    <CameraView
                                        style={StyleSheet.absoluteFillObject}
                                        facing="back"
                                        barcodeScannerSettings={{
                                            barcodeTypes: ['qr'],
                                        }}
                                        onBarcodeScanned={isProcessing ? undefined : handleBarCodeScanned}
                                    />
                                </View>
                                <Text style={styles.scanHint}>
                                    {isProcessing ? '处理中...' : '将二维码对准扫描框'}
                                </Text>
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
        backgroundColor: '#f1f5f9',
    },
    modeSelector: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modeButtonActive: {
        backgroundColor: '#64748b',
        borderColor: '#64748b',
    },
    modeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    modeButtonTextActive: {
        color: '#ffffff',
    },
    content: {
        padding: 16,
    },
    qrContainer: {
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 24,
        textAlign: 'center',
    },
    qrWrapper: {
        padding: 20,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    qrPlaceholder: {
        width: 240,
        height: 240,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    infoBox: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        width: '100%',
        gap: 8,
    },
    infoText: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
    },
    scanContainer: {
        flex: 1,
    },
    scannerWrapper: {
        alignItems: 'center',
    },
    scanTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 20,
        textAlign: 'center',
    },
    scanner: {
        width: 300,
        height: 300,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#64748b',
    },
    scanHint: {
        marginTop: 20,
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
    permissionButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#64748b',
        borderRadius: 12,
    },
    permissionButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ExchangeScreen;
