import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getMnemonic } from '../services/identityService';
import * as Clipboard from 'expo-clipboard';
import PageHeader from '../components/PageHeader';

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
                    backgroundColor="#f8fafc"
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.warningCard}>
                    <MaterialIcons name="warning" size={32} color="#f59e0b" />
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
                        <MaterialIcons name="visibility" size={24} color="#ffffff" />
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
                            <MaterialIcons name="content-copy" size={20} color="#4F46E5" />
                            <Text style={styles.copyButtonText}>复制助记词</Text>
                        </TouchableOpacity>

                        <View style={styles.infoCard}>
                            <MaterialIcons name="info" size={20} color="#64748b" />
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
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: 16,
    },
    warningCard: {
        backgroundColor: '#fffbeb',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#fef3c7',
        alignItems: 'center',
    },
    warningTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#92400e',
        marginTop: 12,
        marginBottom: 8,
    },
    warningText: {
        fontSize: 14,
        color: '#78350f',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 20,
    },
    warningList: {
        alignSelf: 'stretch',
        marginTop: 8,
    },
    warningItem: {
        fontSize: 13,
        color: '#78350f',
        marginBottom: 6,
        lineHeight: 18,
    },
    revealButton: {
        backgroundColor: '#4F46E5',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    revealButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    mnemonicContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#4F46E5',
    },
    mnemonicGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    wordCard: {
        width: '31%',
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    wordIndex: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    wordText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
    },
    copyButton: {
        backgroundColor: '#ede9fe',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    copyButtonText: {
        color: '#4F46E5',
        fontSize: 15,
        fontWeight: '600',
    },
    infoCard: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
});

export default MnemonicScreen;
