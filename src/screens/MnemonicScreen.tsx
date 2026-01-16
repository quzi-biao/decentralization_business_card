import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getMnemonic } from '../services/identityService';
import * as Clipboard from 'expo-clipboard';
import PageHeader from '../components/PageHeader';
import { ThemeConfig } from '../constants/theme';

interface Props {
    onClose: () => void;
}

const MnemonicScreen: React.FC<Props> = ({ onClose }) => {
    const [mnemonic, setMnemonic] = useState<string[]>([]);
    const [isRevealed, setIsRevealed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReveal = () => {
        Alert.alert(
            '安全提示',
            '助记词是恢复您账户的唯一凭证，请确保：\n\n1. 周围没有他人或摄像头\n2. 不要截图或拍照\n3. 妥善保管，不要泄露给任何人\n\n确定要查看吗？',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '我已了解，继续查看',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const words = await getMnemonic();
                            if (words) {
                                setMnemonic(words);
                                setIsRevealed(true);
                            } else {
                                Alert.alert('错误', '无法获取助记词');
                            }
                        } catch (error) {
                            Alert.alert('错误', '获取助记词失败');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCopy = async () => {
        if (mnemonic.length === 0) return;
        
        Alert.alert(
            '复制助记词',
            '复制后请立即粘贴到安全的地方，并清空剪贴板。确定要复制吗？',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '确定复制',
                    onPress: async () => {
                        await Clipboard.setStringAsync(mnemonic.join(' '));
                        Alert.alert('已复制', '助记词已复制到剪贴板，请妥善保管');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <PageHeader 
                    title="助记词"
                    onBack={onClose}
                    backgroundColor={ThemeConfig.colors.backgroundSecondary}
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.warningCard}>
                    <MaterialIcons name="warning" size={32} color={ThemeConfig.colors.warning} />
                    <Text style={styles.warningTitle}>重要提示</Text>
                    <Text style={styles.warningText}>
                        助记词是恢复您账户的唯一凭证，一旦丢失将无法找回。请务必：
                    </Text>
                    <View style={styles.warningList}>
                        <Text style={styles.warningItem}>• 抄写在纸上，保存在安全的地方</Text>
                        <Text style={styles.warningItem}>• 不要截图、拍照或保存在云端</Text>
                        <Text style={styles.warningItem}>• 不要通过网络传输或分享给他人</Text>
                        <Text style={styles.warningItem}>• 定期检查备份是否完好</Text>
                    </View>
                </View>

                {!isRevealed ? (
                    <TouchableOpacity 
                        style={styles.revealButton}
                        onPress={handleReveal}
                        disabled={loading}
                    >
                        <MaterialIcons name="visibility" size={24} color={ThemeConfig.colors.white} />
                        <Text style={styles.revealButtonText}>
                            {loading ? '加载中...' : '点击查看助记词'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <View style={styles.mnemonicContainer}>
                            <View style={styles.mnemonicGrid}>
                                {mnemonic.map((word, index) => (
                                    <View key={index} style={styles.wordCard}>
                                        <Text style={styles.wordIndex}>{index + 1}</Text>
                                        <Text style={styles.wordText}>{word}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.copyButton}
                            onPress={handleCopy}
                        >
                            <MaterialIcons name="content-copy" size={20} color={ThemeConfig.colors.primary} />
                            <Text style={styles.copyButtonText}>复制助记词</Text>
                        </TouchableOpacity>

                        <View style={styles.infoCard}>
                            <MaterialIcons name="info" size={20} color={ThemeConfig.colors.textSecondary} />
                            <Text style={styles.infoText}>
                                建议将助记词按顺序抄写在纸上，并保存在安全的地方。不要依赖电子设备存储。
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
            </View>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    scrollContent: {
        padding: ThemeConfig.spacing.base,
    },
    warningCard: {
        backgroundColor: '#fffbeb',
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.lg,
        marginBottom: ThemeConfig.spacing.xxxl - 16,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: '#fef3c7',
        alignItems: 'center',
    },
    warningTitle: {
        fontSize: ThemeConfig.fontSize.xl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: '#92400e',
        marginTop: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.sm,
    },
    warningText: {
        fontSize: ThemeConfig.fontSize.base,
        color: '#78350f',
        textAlign: 'center',
        marginBottom: ThemeConfig.spacing.md,
        lineHeight: 20,
    },
    warningList: {
        alignSelf: 'stretch',
        marginTop: ThemeConfig.spacing.sm,
    },
    warningItem: {
        fontSize: ThemeConfig.fontSize.base - 1,
        color: '#78350f',
        marginBottom: 6,
        lineHeight: 18,
    },
    revealButton: {
        backgroundColor: ThemeConfig.colors.primary,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ThemeConfig.spacing.sm,
    },
    revealButtonText: {
        color: ThemeConfig.colors.white,
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
    mnemonicContainer: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        marginBottom: ThemeConfig.spacing.base,
        borderWidth: ThemeConfig.borderWidth.base,
        borderColor: ThemeConfig.colors.primary,
    },
    mnemonicGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ThemeConfig.spacing.sm,
    },
    wordCard: {
        width: '31%',
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
        borderRadius: ThemeConfig.borderRadius.base,
        padding: ThemeConfig.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.sm,
    },
    wordIndex: {
        fontSize: ThemeConfig.fontSize.sm,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
    },
    wordText: {
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        flex: 1,
    },
    copyButton: {
        backgroundColor: '#ede9fe',
        borderRadius: ThemeConfig.borderRadius.md,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ThemeConfig.spacing.sm,
        marginBottom: ThemeConfig.spacing.base,
    },
    copyButtonText: {
        color: ThemeConfig.colors.primary,
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
    infoCard: {
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        flexDirection: 'row',
        gap: ThemeConfig.spacing.md,
    },
    infoText: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.base - 1,
        color: '#475569',
        lineHeight: 18,
    },
});

export default MnemonicScreen;
