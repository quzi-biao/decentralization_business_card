import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PageHeader from '../components/PageHeader';
import { DataManager } from '../services/dataManager';
import { useCardStore } from '../store/useCardStore';
import { useExchangeStore } from '../store/useExchangeStore';
import { ThemeConfig } from '../constants/theme';

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
        Alert.alert(
            '⚠️ 危险操作',
            '您即将删除所有本地数据，包括：\n\n• 我的名片信息\n• 所有交换的名片\n• 聊天记录\n• 所有图片文件\n\n此操作不可撤销！',
            [
                {
                    text: '取消',
                    style: 'cancel',
                },
                {
                    text: '我确定要删除',
                    style: 'destructive',
                    onPress: () => {
                        // 二次确认
                        Alert.alert(
                            '最后确认',
                            '请再次确认您要删除所有数据？',
                            [
                                {
                                    text: '取消',
                                    style: 'cancel',
                                },
                                {
                                    text: '确定删除',
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                            // 先清除所有数据（包括持久化存储）
                                            await DataManager.clearAllData();
                                            // 然后重置 store 状态
                                            await clearAllData();
                                            // 重新加载统计数据
                                            await loadDataStats();
                                            // 显示成功提示
                                            Alert.alert('成功', '所有数据已清除', [
                                                {
                                                    text: '确定',
                                                    onPress: () => {
                                                        // 关闭当前页面，返回主界面
                                                        onClose();
                                                    }
                                                }
                                            ]);
                                        } catch (error) {
                                            console.error('Clear data error:', error);
                                            Alert.alert('错误', '清除数据失败，请重试');
                                        }
                                    },
                                },
                            ]
                        );
                    },
                },
            ]
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
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    scrollContent: {
        padding: ThemeConfig.spacing.base,
    },
    infoCard: {
        backgroundColor: '#ede9fe',
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        flexDirection: 'row',
        gap: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.xxxl - 16,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.primary,
        marginBottom: ThemeConfig.spacing.xs,
    },
    infoText: {
        fontSize: ThemeConfig.fontSize.base - 1,
        color: '#6366f1',
        lineHeight: 18,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.xxxl - 16,
    },
    statCard: {
        width: '48%',
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.lg,
        alignItems: 'center',
        ...ThemeConfig.shadow.sm,
    },
    statIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: ThemeConfig.spacing.md,
    },
    statValue: {
        fontSize: 28,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.xs,
    },
    statLabel: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textSecondary,
        textAlign: 'center',
    },
    statHint: {
        fontSize: ThemeConfig.fontSize.xs,
        color: ThemeConfig.colors.textTertiary,
        textAlign: 'center',
        marginTop: ThemeConfig.spacing.xs,
    },
    section: {
        marginBottom: ThemeConfig.spacing.xxxl - 16,
    },
    sectionTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.md,
    },
    detailCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        ...ThemeConfig.shadow.sm,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: ThemeConfig.spacing.md,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.borderLight,
    },
    detailLabel: {
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textSecondary,
    },
    detailValue: {
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
    },
    actionCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: ThemeConfig.spacing.md,
        ...ThemeConfig.shadow.sm,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.md,
        flex: 1,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: ThemeConfig.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: 2,
    },
    actionDescription: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textSecondary,
    },
    warningCard: {
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        flexDirection: 'row',
        gap: ThemeConfig.spacing.md,
    },
    warningText: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.base - 1,
        color: '#475569',
        lineHeight: 18,
    },
    deleteCard: {
        backgroundColor: '#fef2f2',
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.base,
        borderWidth: ThemeConfig.borderWidth.base,
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
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.error,
        marginBottom: 6,
    },
    deleteDescription: {
        fontSize: ThemeConfig.fontSize.base - 1,
        color: '#dc2626',
        marginBottom: ThemeConfig.spacing.xs,
        lineHeight: 18,
    },
    deleteWarning: {
        fontSize: ThemeConfig.fontSize.sm,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.warning,
        marginTop: ThemeConfig.spacing.xs,
    },
});

export default DataStatsScreen;
