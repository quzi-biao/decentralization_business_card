import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useExchangeStore } from '../store/useExchangeStore';
import { ThemeConfig } from '../constants/theme';

interface RevokeListScreenProps {
    onClose: () => void;
}

/**
 * 撤销列表页面
 * 显示所有已交换的名片，允许用户删除/撤销交换
 */
const RevokeListScreen: React.FC<RevokeListScreenProps> = ({ onClose }) => {
    const { exchanges, exchangedCards, removeExchange, loadExchanges } = useExchangeStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadExchanges();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadExchanges();
        setRefreshing(false);
    };

    const handleDeleteExchange = (peerDid: string, name: string) => {
        Alert.alert(
            '删除名片',
            `确定要删除与 ${name} 的名片交换记录吗？\n\n此操作不可恢复，对方将无法再访问您的名片。`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeExchange(peerDid);
                            Alert.alert('成功', '名片交换记录已删除');
                        } catch (error) {
                            Alert.alert('错误', '删除失败，请重试');
                        }
                    }
                }
            ]
        );
    };

    const activeExchanges = exchanges.filter(e => e.status === 'active');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* 顶部导航栏 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={ThemeConfig.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>撤销列表</Text>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                    <MaterialIcons name="refresh" size={24} color={ThemeConfig.colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* 说明 */}
                <View style={styles.infoCard}>
                    <MaterialIcons name="info-outline" size={20} color={ThemeConfig.colors.primary} />
                    <Text style={styles.infoText}>
                        删除名片后，对方将无法再访问您的名片信息，且此操作不可恢复。
                    </Text>
                </View>

                {/* 统计信息 */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{activeExchanges.length}</Text>
                        <Text style={styles.statLabel}>已交换名片</Text>
                    </View>
                </View>

                {/* 名片列表 */}
                {activeExchanges.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="inbox" size={64} color={ThemeConfig.colors.textDisabled} />
                        <Text style={styles.emptyTitle}>暂无交换记录</Text>
                        <Text style={styles.emptyHint}>
                            去"交换"页面扫描对方的二维码来交换名片吧
                        </Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {activeExchanges.map((exchange) => {
                            const card = exchangedCards.get(exchange.peerDid);
                            const cardData = card?.cardData;
                            
                            return (
                                <View key={exchange.id} style={styles.exchangeItem}>
                                    <View style={styles.exchangeInfo}>
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>
                                                {cardData?.realName?.charAt(0) || '👤'}
                                            </Text>
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.name}>
                                                {cardData?.realName || '未知'}
                                            </Text>
                                            <Text style={styles.position}>
                                                {cardData?.position || '未知职位'}
                                            </Text>
                                            <Text style={styles.company}>
                                                {cardData?.companyName || '未知公司'}
                                            </Text>
                                            <Text style={styles.exchangeTime}>
                                                交换时间: {new Date(exchange.exchangedAt).toLocaleDateString('zh-CN')}
                                            </Text>
                                            <Text style={styles.did} numberOfLines={1} ellipsizeMode="middle">
                                                DID: {exchange.peerDid}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDeleteExchange(
                                            exchange.peerDid,
                                            cardData?.realName || '该用户'
                                        )}
                                    >
                                        <MaterialIcons name="delete-outline" size={24} color={ThemeConfig.colors.error} />
                                        <Text style={styles.deleteButtonText}>删除</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}

                <View style={styles.spacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: ThemeConfig.spacing.base,
        paddingVertical: ThemeConfig.spacing.md,
        backgroundColor: ThemeConfig.colors.background,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.borderLight,
    },
    backButton: {
        padding: ThemeConfig.spacing.sm,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: ThemeConfig.fontSize.lg + 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    refreshButton: {
        padding: ThemeConfig.spacing.sm,
        marginRight: -8,
    },
    scrollView: {
        flex: 1,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        margin: ThemeConfig.spacing.base,
        padding: ThemeConfig.spacing.base,
        borderRadius: ThemeConfig.borderRadius.md,
        gap: ThemeConfig.spacing.md,
    },
    infoText: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.base - 1,
        color: '#1e40af',
        lineHeight: 20,
    },
    statsCard: {
        backgroundColor: ThemeConfig.colors.background,
        marginHorizontal: ThemeConfig.spacing.base,
        marginBottom: ThemeConfig.spacing.base,
        padding: ThemeConfig.spacing.lg,
        borderRadius: ThemeConfig.borderRadius.md,
        ...ThemeConfig.shadow.sm,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 32,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.primary,
        marginBottom: ThemeConfig.spacing.xs,
    },
    statLabel: {
        fontSize: ThemeConfig.fontSize.base - 1,
        color: ThemeConfig.colors.textSecondary,
    },
    listContainer: {
        paddingHorizontal: ThemeConfig.spacing.base,
    },
    exchangeItem: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        marginBottom: ThemeConfig.spacing.md,
        ...ThemeConfig.shadow.sm,
    },
    exchangeInfo: {
        flexDirection: 'row',
        marginBottom: ThemeConfig.spacing.md,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e0e7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: ThemeConfig.spacing.md,
    },
    avatarText: {
        fontSize: ThemeConfig.fontSize.xxxl,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.primary,
    },
    infoContent: {
        flex: 1,
    },
    name: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.xs,
    },
    position: {
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: 2,
    },
    company: {
        fontSize: ThemeConfig.fontSize.base - 1,
        color: ThemeConfig.colors.textTertiary,
        marginBottom: 6,
    },
    exchangeTime: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textTertiary,
        marginBottom: ThemeConfig.spacing.xs,
    },
    did: {
        fontSize: ThemeConfig.fontSize.xs,
        color: ThemeConfig.colors.textDisabled,
        fontFamily: 'monospace',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        paddingVertical: ThemeConfig.spacing.sm + 2,
        paddingHorizontal: ThemeConfig.spacing.base,
        borderRadius: ThemeConfig.borderRadius.base,
        gap: 6,
    },
    deleteButtonText: {
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.error,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: ThemeConfig.spacing.xxxl - 8,
    },
    emptyTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
        marginTop: ThemeConfig.spacing.base,
        marginBottom: ThemeConfig.spacing.sm,
    },
    emptyHint: {
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
    spacer: {
        height: ThemeConfig.spacing.xxxl - 16,
    },
});

export default RevokeListScreen;
