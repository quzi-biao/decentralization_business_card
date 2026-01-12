import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Share } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { DataManager } from '../services/dataManager';
import * as Clipboard from 'expo-clipboard';
import PageHeader from '../components/PageHeader';

interface Props {
    onClose: () => void;
}

const BackupRestoreScreen: React.FC<Props> = ({ onClose }) => {
    const [loading, setLoading] = useState(false);

    const handleBackup = async () => {
        Alert.alert(
            '备份数据',
            '将导出所有聊天记录、名片数据到 JSON 格式。您可以选择分享或复制。',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '开始备份',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const data = await DataManager.exportAllData();
                            const jsonString = JSON.stringify(data, null, 2);
                            
                            Alert.alert(
                                '备份成功',
                                '数据已导出，请选择操作：',
                                [
                                    {
                                        text: '复制到剪贴板',
                                        onPress: async () => {
                                            await Clipboard.setStringAsync(jsonString);
                                            Alert.alert('已复制', '备份数据已复制到剪贴板');
                                        }
                                    },
                                    {
                                        text: '分享',
                                        onPress: async () => {
                                            try {
                                                await Share.share({
                                                    message: jsonString,
                                                    title: '名片数据备份'
                                                });
                                            } catch (error) {
                                                console.error('Share failed:', error);
                                            }
                                        }
                                    },
                                    { text: '取消', style: 'cancel' }
                                ]
                            );
                        } catch (error) {
                            Alert.alert('错误', '备份失败，请重试');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleRestore = () => {
        Alert.alert(
            '恢复数据',
            '此功能将从备份文件恢复数据。当前数据将被覆盖。\n\n注意：此功能需要您手动粘贴备份的 JSON 数据。',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '从剪贴板恢复',
                    onPress: async () => {
                        try {
                            const clipboardContent = await Clipboard.getStringAsync();
                            if (!clipboardContent) {
                                Alert.alert('错误', '剪贴板为空');
                                return;
                            }

                            const data = JSON.parse(clipboardContent);
                            
                            Alert.alert(
                                '确认恢复',
                                `将恢复以下数据：\n\n• 聊天记录：${data.chats?.length || 0} 天\n• 我的名片：${data.myCard ? '是' : '否'}\n• 交换的名片：${data.exchangedCards?.length || 0} 张\n\n当前数据将被覆盖，确定继续吗？`,
                                [
                                    { text: '取消', style: 'cancel' },
                                    {
                                        text: '确定恢复',
                                        style: 'destructive',
                                        onPress: () => {
                                            Alert.alert('提示', '恢复功能开发中，敬请期待');
                                        }
                                    }
                                ]
                            );
                        } catch (error) {
                            Alert.alert('错误', '数据格式不正确，请检查备份文件');
                        }
                    }
                }
            ]
        );
    };

    const handleAutoBackup = () => {
        Alert.alert('提示', '自动备份功能开发中，敬请期待');
    };

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <PageHeader 
                    title="备份与恢复"
                    onBack={onClose}
                    backgroundColor="#f8fafc"
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.infoCard}>
                    <MaterialIcons name="info" size={24} color="#4F46E5" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>关于备份</Text>
                        <Text style={styles.infoText}>
                            定期备份可以防止数据丢失。备份包含您的聊天记录、名片数据等信息（不包含助记词和私钥）。
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>备份数据</Text>
                    <TouchableOpacity 
                        style={styles.actionCard}
                        onPress={handleBackup}
                        disabled={loading}
                    >
                        <View style={styles.actionIcon}>
                            <MaterialIcons name="backup" size={32} color="#4F46E5" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>立即备份</Text>
                            <Text style={styles.actionDescription}>
                                导出所有数据到 JSON 文件
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionCard}
                        onPress={handleAutoBackup}
                    >
                        <View style={styles.actionIcon}>
                            <MaterialIcons name="schedule" size={32} color="#10b981" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>自动备份设置</Text>
                            <Text style={styles.actionDescription}>
                                设置定期自动备份（开发中）
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>恢复数据</Text>
                    <TouchableOpacity 
                        style={styles.actionCard}
                        onPress={handleRestore}
                    >
                        <View style={styles.actionIcon}>
                            <MaterialIcons name="restore" size={32} color="#f59e0b" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>从备份恢复</Text>
                            <Text style={styles.actionDescription}>
                                从备份文件恢复数据
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>

                <View style={styles.warningCard}>
                    <MaterialIcons name="warning" size={20} color="#f59e0b" />
                    <Text style={styles.warningText}>
                        备份文件不包含助记词和私钥，请单独妥善保管助记词。
                    </Text>
                </View>
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
    infoCard: {
        backgroundColor: '#ede9fe',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#6366f1',
        lineHeight: 18,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
    },
    actionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    actionDescription: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
    },
    warningCard: {
        backgroundColor: '#fffbeb',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#78350f',
        lineHeight: 18,
    },
});

export default BackupRestoreScreen;
