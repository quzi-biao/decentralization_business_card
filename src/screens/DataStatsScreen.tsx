import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PageHeader from '../components/PageHeader';
import { DataManager } from '../services/dataManager';
import { useCardStore } from '../store/useCardStore';

interface Props {
    onClose: () => void;
}

const DataStatsScreen: React.FC<Props> = ({ onClose }) => {
    const { clearAllData } = useCardStore();
    const [dataStats, setDataStats] = useState({
        chatDates: 0,
        myCardExists: false,
        exchangedCardsCount: 0,
        avatarsCount: 0,
        imagesCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [tapCount, setTapCount] = useState(0);
    const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadDataStats();
    }, []);

    const loadDataStats = async () => {
        try {
            setLoading(true);
            const stats = await DataManager.getDataStats();
            setDataStats(stats);
        } catch (error) {
            console.error('Failed to load data stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteButtonPress = () => {
        const newTapCount = tapCount + 1;
        setTapCount(newTapCount);

        if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
        }

        if (newTapCount === 1) {
            tapTimeoutRef.current = setTimeout(() => {
                setTapCount(0);
            }, 500);
        } else if (newTapCount === 2) {
            setTapCount(0);
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
            }
            showDeleteConfirmation();
        }
    };

    const showDeleteConfirmation = () => {
        Alert.prompt(
            '确认删除所有数据',
            '删除将导致数据不可还原。\n\n请输入「我确定删除数据」以确认删除：',
            [
                {
                    text: '取消',
                    style: 'cancel',
                },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: async (inputText) => {
                        if (inputText === '我确定删除数据') {
                            try {
                                await DataManager.clearAllData();
                                await clearAllData();
                                await loadDataStats();
                                Alert.alert('成功', '所有数据已清除');
                            } catch (error) {
                                Alert.alert('错误', '清除数据失败，请重试');
                            }
                        } else {
                            Alert.alert('错误', '输入的确认文字不正确，删除已取消');
                        }
                    },
                },
            ],
            'plain-text'
        );
    };

    const handleClearChatHistory = () => {
        if (dataStats.chatDates === 0) {
            Alert.alert('提示', '没有聊天记录需要清除');
            return;
        }

        Alert.alert(
            '清除聊天记录',
            `确定要清除所有 ${dataStats.chatDates} 天的聊天记录吗？此操作不可恢复。`,
            [
                {
                    text: '取消',
                    style: 'cancel',
                },
                {
                    text: '清除',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await DataManager.clearChatHistory();
                            await loadDataStats();
                            Alert.alert('成功', '聊天记录已清除');
                        } catch (error) {
                            Alert.alert('错误', '清除聊天记录失败，请重试');
                        }
                    },
                },
            ]
        );
    };

    const handleClearImages = () => {
        const totalImages = dataStats.avatarsCount + dataStats.imagesCount;
        if (totalImages === 0) {
            Alert.alert('提示', '没有图片文件需要清除');
            return;
        }

        Alert.alert(
            '清除图片文件',
            `确定要清除所有 ${totalImages} 个图片文件吗？此操作不可恢复。`,
            [
                {
                    text: '取消',
                    style: 'cancel',
                },
                {
                    text: '清除',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await DataManager.clearAllImages();
                            await loadDataStats();
                            Alert.alert('成功', '图片文件已清除');
                        } catch (error) {
                            Alert.alert('错误', '清除图片文件失败，请重试');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <PageHeader 
                    title="数据统计"
                    onBack={onClose}
                    backgroundColor="#f8fafc"
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.infoCard}>
                        <MaterialIcons name="analytics" size={24} color="#4F46E5" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>数据概览</Text>
                            <Text style={styles.infoText}>
                                查看您在应用中存储的所有数据统计信息
                            </Text>
                        </View>
                    </View>

                    {/* 数据统计卡片 */}
                    <View style={styles.statsGrid}>
                        <TouchableOpacity 
                            style={styles.statCard}
                            onPress={handleClearChatHistory}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                                <MaterialIcons name="chat" size={28} color="#3b82f6" />
                            </View>
                            <Text style={styles.statValue}>{dataStats.chatDates}</Text>
                            <Text style={styles.statLabel}>聊天记录天数</Text>
                            <Text style={styles.statHint}>点击清除</Text>
                        </TouchableOpacity>

                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                                <MaterialIcons name="badge" size={28} color="#22c55e" />
                            </View>
                            <Text style={styles.statValue}>{dataStats.myCardExists ? '1' : '0'}</Text>
                            <Text style={styles.statLabel}>我的名片</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                                <MaterialIcons name="contacts" size={28} color="#f59e0b" />
                            </View>
                            <Text style={styles.statValue}>{dataStats.exchangedCardsCount}</Text>
                            <Text style={styles.statLabel}>交换的名片</Text>
                        </View>

                        <TouchableOpacity 
                            style={styles.statCard}
                            onPress={handleClearImages}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.statIcon, { backgroundColor: '#fce7f3' }]}>
                                <MaterialIcons name="image" size={28} color="#ec4899" />
                            </View>
                            <Text style={styles.statValue}>{dataStats.avatarsCount + dataStats.imagesCount}</Text>
                            <Text style={styles.statLabel}>图片文件</Text>
                            <Text style={styles.statHint}>点击清除</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 详细信息 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>详细信息</Text>
                        
                        <View style={styles.detailCard}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>聊天记录</Text>
                                <Text style={styles.detailValue}>{dataStats.chatDates} 天</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>我的名片</Text>
                                <Text style={styles.detailValue}>{dataStats.myCardExists ? '已创建' : '未创建'}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>交换的名片</Text>
                                <Text style={styles.detailValue}>{dataStats.exchangedCardsCount} 张</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>头像图片</Text>
                                <Text style={styles.detailValue}>{dataStats.avatarsCount} 个</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>其他图片</Text>
                                <Text style={styles.detailValue}>{dataStats.imagesCount} 个</Text>
                            </View>
                        </View>
                    </View>

                    {/* 数据管理操作 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>危险操作</Text>
                        
                        <TouchableOpacity 
                            style={styles.deleteCard}
                            onPress={handleDeleteButtonPress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.deleteIcon}>
                                <MaterialIcons name="delete-forever" size={32} color="#ef4444" />
                            </View>
                            <View style={styles.deleteContent}>
                                <Text style={styles.deleteTitle}>清除所有数据</Text>
                                <Text style={styles.deleteDescription}>双击此按钮以删除所有本地数据</Text>
                                <Text style={styles.deleteWarning}>⚠️ 删除后数据不可恢复</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.warningCard}>
                        <MaterialIcons name="info" size={20} color="#64748b" />
                        <Text style={styles.warningText}>
                            所有数据均加密存储在本地设备，不会上传到云端。建议定期备份重要数据。
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
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
    },
    statHint: {
        fontSize: 10,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 4,
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
    detailCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    detailLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    actionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
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
        marginBottom: 2,
    },
    actionDescription: {
        fontSize: 12,
        color: '#64748b',
    },
    warningCard: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
    deleteCard: {
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 2,
        borderColor: '#fecaca',
        borderStyle: 'dashed',
    },
    deleteIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fee2e2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteContent: {
        flex: 1,
    },
    deleteTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ef4444',
        marginBottom: 6,
    },
    deleteDescription: {
        fontSize: 13,
        color: '#dc2626',
        marginBottom: 4,
        lineHeight: 18,
    },
    deleteWarning: {
        fontSize: 12,
        fontWeight: '600',
        color: '#f59e0b',
        marginTop: 4,
    },
});

export default DataStatsScreen;
