import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

    useEffect(() => {
        checkInitialization();
    }, []);

    const checkInitialization = async () => {
        const initialized = await isInitialized();
        if (initialized) {
            onComplete();
        } else {
            setIsLoading(false);
        }
    };

    const handleInitialize = async () => {
        setIsLoading(true);
        try {
            await initializeIdentity();
            const mnemonicWords = await getMnemonic();
            if (mnemonicWords) {
                setMnemonic(mnemonicWords);
                setShowMnemonic(true);
            }
        } catch (error) {
            console.error('Failed to initialize:', error);
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
                    <ActivityIndicator size="large" color="#64748b" />
                    <Text style={styles.loadingText}>初始化中...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (showMnemonic) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>🔑 备份助记词</Text>
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
                        <Text style={styles.warningText}>⚠️ 重要提示</Text>
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
                <Text style={styles.emoji}>🔐</Text>
                <Text style={styles.title}>欢迎使用去中心化名片</Text>
                <Text style={styles.description}>
                    这是一个注重隐私和安全的名片交换系统{'\n\n'}
                    • 🔒 端到端加密保护您的数据{'\n'}
                    • 🔑 只有您控制自己的密钥{'\n'}
                    • 🚫 无需中心服务器存储明文{'\n'}
                    • 🤝 安全地与他人交换名片
                </Text>

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
        marginTop: 16,
        fontSize: 14,
        color: '#64748b',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 64,
        textAlign: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    description: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 26,
        marginBottom: 32,
    },
    mnemonicContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    mnemonicItem: {
        width: '30%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    mnemonicIndex: {
        fontSize: 11,
        color: '#94a3b8',
        marginRight: 8,
        width: 20,
    },
    mnemonicWord: {
        fontSize: 13,
        color: '#1e293b',
        fontWeight: '600',
    },
    warningBox: {
        backgroundColor: '#fef3c7',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    warningText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 8,
    },
    warningDetail: {
        fontSize: 12,
        color: '#92400e',
        lineHeight: 20,
    },
    initButton: {
        backgroundColor: '#64748b',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    initButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    completeButton: {
        backgroundColor: '#64748b',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    completeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    hint: {
        marginTop: 16,
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
    },
});

export default InitScreen;
