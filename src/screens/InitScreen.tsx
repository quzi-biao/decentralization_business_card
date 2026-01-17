import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { initializeIdentity, isInitialized, getMnemonic } from '../services/identityService';
import { ThemeConfig } from '../constants/theme';

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
                    点击按钮后将生成您的身份密钥
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: ThemeConfig.spacing.lg,
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textSecondary,
        lineHeight: 22,
    },
    content: {
        flex: 1,
        padding: ThemeConfig.spacing.xxxl - 8,
        justifyContent: 'center',
    },
    mainIcon: {
        alignSelf: 'center',
        marginBottom: ThemeConfig.spacing.xxxl - 8,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.xxxl - 16,
    },
    title: {
        fontSize: 26,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
        textAlign: 'center',
        letterSpacing: 0.3,
        marginBottom: ThemeConfig.spacing.md,
    },
    subtitle: {
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textSecondary,
        textAlign: 'center',
        marginBottom: ThemeConfig.spacing.xxxl - 8,
        lineHeight: 24,
        paddingHorizontal: ThemeConfig.spacing.sm,
    },
    description: {
        fontSize: ThemeConfig.fontSize.lg,
        color: ThemeConfig.colors.textSecondary,
        textAlign: 'center',
        marginBottom: ThemeConfig.spacing.xxxl - 8,
        lineHeight: 24,
        paddingHorizontal: ThemeConfig.spacing.sm,
    },
    featureList: {
        gap: ThemeConfig.spacing.lg,
        marginBottom: ThemeConfig.spacing.xxxl,
        alignItems: 'center',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.base,
        width: '100%',
        maxWidth: 320,
        marginLeft: 64,
        alignSelf: 'center',
    },
    featureText: {
        fontSize: ThemeConfig.fontSize.lg,
        color: '#475569',
        flex: 1,
        lineHeight: 24,
    },
    mnemonicContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.xxxl - 8,
    },
    mnemonicItem: {
        width: '30%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ThemeConfig.colors.background,
        padding: 14,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    mnemonicIndex: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textTertiary,
        marginRight: 6,
        width: 18,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    mnemonicWord: {
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textPrimary,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
    warningBox: {
        backgroundColor: '#fef3c7',
        padding: ThemeConfig.spacing.lg,
        borderRadius: ThemeConfig.borderRadius.md,
        marginBottom: ThemeConfig.spacing.xxxl - 8,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.sm + 2,
        marginBottom: ThemeConfig.spacing.md,
    },
    warningText: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: '#92400e',
    },
    warningDetail: {
        fontSize: ThemeConfig.fontSize.base,
        color: '#92400e',
        lineHeight: 24,
    },
    initButton: {
        backgroundColor: ThemeConfig.colors.primary,
        paddingVertical: ThemeConfig.spacing.md,
        paddingHorizontal: ThemeConfig.spacing.xl,
        borderRadius: ThemeConfig.borderRadius.md,
        alignItems: 'center',
        alignSelf: 'center',
        ...ThemeConfig.shadow.primary,
    },
    initButtonText: {
        fontSize: ThemeConfig.fontSize.lg + 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.white,
        letterSpacing: 0.3,
    },
    completeButton: {
        backgroundColor: ThemeConfig.colors.primary,
        paddingVertical: ThemeConfig.spacing.md,
        paddingHorizontal: ThemeConfig.spacing.xl,
        borderRadius: ThemeConfig.borderRadius.md,
        alignItems: 'center',
        alignSelf: 'center',
        ...ThemeConfig.shadow.primary,
    },
    completeButtonText: {
        fontSize: ThemeConfig.fontSize.lg + 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.white,
        letterSpacing: 0.3,
    },
    hint: {
        marginTop: ThemeConfig.spacing.lg,
        fontSize: ThemeConfig.fontSize.base - 1,
        color: ThemeConfig.colors.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
    loadingIcon: {
        marginBottom: ThemeConfig.spacing.xxxl - 16,
    },
    errorContainer: {
        marginTop: ThemeConfig.spacing.xxxl - 8,
        alignItems: 'center',
    },
    errorText: {
        fontSize: ThemeConfig.fontSize.md,
        color: '#dc2626',
        marginBottom: ThemeConfig.spacing.base,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: ThemeConfig.colors.primary,
        paddingHorizontal: ThemeConfig.spacing.xxxl - 8,
        paddingVertical: ThemeConfig.spacing.md,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
    },
    retryButtonText: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.white,
    },
});

export default InitScreen;
