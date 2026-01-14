import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { initializeIdentity, isInitialized, getMnemonic } from '../services/identityService';

/**
 * 初始化屏幕
 * 首次使用时生成密钥对和身份
 */

interface InitScreenProps {
    onComplete: () => void;
}

const InitScreen: React.FC<InitScreenProps> = ({ onComplete }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [mnemonic, setMnemonic] = useState<string[]>([]);
    const [showMnemonic, setShowMnemonic] = useState(false);
    const [error, setError] = useState<string>('');
    const [loadingMessage, setLoadingMessage] = useState('检查初始化状态...');

    useEffect(() => {
        checkInitialization();
    }, []);

    const checkInitialization = async () => {
        try {
            console.log('Checking initialization...');
            const initialized = await isInitialized();
            console.log('Initialized:', initialized);
            if (initialized) {
                onComplete();
            } else {
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error checking initialization:', error);
            setError('检查初始化状态失败');
            setIsLoading(false);
        }
    };

    const handleInitialize = async () => {
        setIsLoading(true);
        setError('');
        try {
            setLoadingMessage('生成密钥对...');
            console.log('Starting identity initialization...');
            await initializeIdentity();
            console.log('Identity initialized');
            
            setLoadingMessage('获取助记词...');
            const mnemonicWords = await getMnemonic();
            console.log('Mnemonic retrieved:', mnemonicWords ? 'success' : 'failed');
            
            if (mnemonicWords) {
                setMnemonic(mnemonicWords);
                setShowMnemonic(true);
            } else {
                throw new Error('Failed to get mnemonic');
            }
        } catch (error) {
            console.error('Failed to initialize:', error);
            setError('初始化失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = () => {
        onComplete();
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <MaterialIcons name="lock" size={64} color="#64748b" style={styles.loadingIcon} />
                    <ActivityIndicator size="large" color="#64748b" />
                    <Text style={styles.loadingText}>{loadingMessage}</Text>
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity 
                                style={styles.retryButton}
                                onPress={() => {
                                    setError('');
                                    setIsLoading(false);
                                }}
                            >
                                <Text style={styles.retryButtonText}>返回</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    if (showMnemonic) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.titleContainer}>
                        <MaterialIcons name="vpn-key" size={28} color="#1e293b" />
                        <Text style={styles.title}>备份助记词</Text>
                    </View>
                    <Text style={styles.subtitle}>
                        请妥善保管这12个词，它们是恢复您身份的唯一方式
                    </Text>

                    <View style={styles.mnemonicContainer}>
                        {mnemonic.map((word, index) => (
                            <View key={index} style={styles.mnemonicItem}>
                                <Text style={styles.mnemonicIndex}>{index + 1}</Text>
                                <Text style={styles.mnemonicWord}>{word}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.warningBox}>
                        <View style={styles.warningHeader}>
                            <MaterialIcons name="warning" size={20} color="#92400e" />
                            <Text style={styles.warningText}>重要提示</Text>
                        </View>
                        <Text style={styles.warningDetail}>
                            • 请将助记词抄写在纸上保存{'\n'}
                            • 不要截屏或拍照{'\n'}
                            • 不要分享给任何人{'\n'}
                            • 丢失助记词将无法恢复身份
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.completeButton}
                        onPress={handleComplete}
                    >
                        <Text style={styles.completeButtonText}>我已备份，开始使用</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <MaterialIcons name="security" size={80} color="#64748b" style={styles.mainIcon} />
                <Text style={styles.title}>欢迎使用去中心化名片</Text>
                <Text style={styles.description}>
                    这是一个注重隐私和安全的名片交换系统
                </Text>
                
                <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="lock" size={24} color="#64748b" />
                        <Text style={styles.featureText}>端到端加密保护您的数据</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="vpn-key" size={24} color="#64748b" />
                        <Text style={styles.featureText}>只有您控制自己的密钥</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="cloud-off" size={24} color="#64748b" />
                        <Text style={styles.featureText}>无需中心服务器存储明文</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="handshake" size={24} color="#64748b" />
                        <Text style={styles.featureText}>安全地与他人交换名片</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.initButton}
                    onPress={handleInitialize}
                >
                    <Text style={styles.initButtonText}>创建我的身份</Text>
                </TouchableOpacity>

                <Text style={styles.hint}>
                    首次使用需要生成密钥对，请稍候...
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 15,
        color: '#64748b',
        lineHeight: 22,
    },
    content: {
        flex: 1,
        padding: 32,
        justifyContent: 'center',
    },
    mainIcon: {
        alignSelf: 'center',
        marginBottom: 32,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 24,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
        letterSpacing: 0.3,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        paddingHorizontal: 8,
    },
    description: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        paddingHorizontal: 8,
    },
    featureList: {
        gap: 20,
        marginBottom: 40,
        alignItems: 'center',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        maxWidth: 320,
    },
    featureText: {
        fontSize: 16,
        color: '#475569',
        flex: 1,
        lineHeight: 24,
    },
    mnemonicContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    mnemonicItem: {
        width: '30%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    mnemonicIndex: {
        fontSize: 12,
        color: '#94a3b8',
        marginRight: 6,
        width: 18,
        fontWeight: '500',
    },
    mnemonicWord: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '600',
    },
    warningBox: {
        backgroundColor: '#fef3c7',
        padding: 20,
        borderRadius: 12,
        marginBottom: 32,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    warningText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#92400e',
    },
    warningDetail: {
        fontSize: 14,
        color: '#92400e',
        lineHeight: 24,
    },
    initButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    initButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#ffffff',
        letterSpacing: 0.3,
    },
    completeButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    completeButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#ffffff',
        letterSpacing: 0.3,
    },
    hint: {
        marginTop: 20,
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    },
    loadingIcon: {
        marginBottom: 24,
    },
    errorContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 15,
        color: '#dc2626',
        marginBottom: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 10,
    },
    retryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
});

export default InitScreen;
