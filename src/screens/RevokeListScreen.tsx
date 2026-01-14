import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useExchangeStore } from '../store/useExchangeStore';

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
                    <MaterialIcons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>撤销列表</Text>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                    <MaterialIcons name="refresh" size={24} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* 说明 */}
                <View style={styles.infoCard}>
                    <MaterialIcons name="info-outline" size={20} color="#4F46E5" />
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
                        <MaterialIcons name="inbox" size={64} color="#cbd5e1" />
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
                                        <MaterialIcons name="delete-outline" size={24} color="#ef4444" />
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
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
        textAlign: 'center',
    },
    refreshButton: {
        padding: 8,
        marginRight: -8,
    },
    scrollView: {
        flex: 1,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 20,
    },
    statsCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#4F46E5',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    listContainer: {
        paddingHorizontal: 16,
    },
    exchangeItem: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    exchangeInfo: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e0e7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#4F46E5',
    },
    infoContent: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    position: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 2,
    },
    company: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 6,
    },
    exchangeTime: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 4,
    },
    did: {
        fontSize: 11,
        color: '#cbd5e1',
        fontFamily: 'monospace',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyHint: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    },
    spacer: {
        height: 24,
    },
});

export default RevokeListScreen;
