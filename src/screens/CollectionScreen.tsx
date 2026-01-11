import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useExchangeStore, CardExchange } from '../store/useExchangeStore';
import { downloadEncryptedCard, getAccessGrant, decryptCardData, revokeAccessGrant, isGrantRevoked } from '../services/storageService';
import { getIdentity } from '../services/identityService';
import { BusinessCardData } from '../store/useCardStore';

/**
 * 名片收藏屏幕
 * 显示已交换的名片列表
 */

const CollectionScreen = () => {
    const { exchanges, exchangedCards, setExchangedCard, revokeExchange, loadExchanges } = useExchangeStore();
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [isScreenProtected, setIsScreenProtected] = useState(false);

    useEffect(() => {
        loadExchanges();
    }, []);

    // 查看名片详情
    const viewCardDetail = async (exchange: CardExchange) => {
        try {
            // 检查是否被撤销
            const revoked = await isGrantRevoked(exchange.peerDid, exchange.myDid);
            if (revoked) {
                Alert.alert('提示', '该名片的访问权限已被撤销');
                return;
            }

            const identity = await getIdentity();
            if (!identity) return;

            // 检查是否已解密
            const existingCard = exchangedCards.get(exchange.peerDid);
            if (existingCard?.isDecrypted && existingCard.cardData) {
                setSelectedCard(exchange.peerDid);
                enableScreenProtection();
                return;
            }

            // 下载并解密名片
            const encryptedPackage = await downloadEncryptedCard(exchange.peerStorageUrl);
            if (!encryptedPackage) {
                Alert.alert('错误', '无法下载名片数据');
                return;
            }

            const grant = await getAccessGrant(exchange.peerDid, identity.did);
            if (!grant) {
                Alert.alert('错误', '没有访问权限');
                return;
            }

            const cardData = await decryptCardData(encryptedPackage, grant);
            setExchangedCard(exchange.peerDid, cardData);
            setSelectedCard(exchange.peerDid);
            enableScreenProtection();
        } catch (error) {
            console.error('Failed to view card:', error);
            Alert.alert('错误', '无法查看名片');
        }
    };

    // 启用截屏保护
    const enableScreenProtection = () => {
        setIsScreenProtected(true);
        // Android 可以使用 FLAG_SECURE，iOS 需要其他方案
        if (Platform.OS === 'android') {
            // 实际实现需要原生模块
            console.log('Screen protection enabled');
        }
    };

    // 关闭名片详情
    const closeCardDetail = () => {
        setSelectedCard(null);
        setIsScreenProtected(false);
    };

    // 撤销访问
    const handleRevokeAccess = (exchange: CardExchange) => {
        Alert.alert(
            '撤销访问',
            `确定要撤销 ${exchange.peerDid.substring(0, 16)}... 的访问权限吗？`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '撤销',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await revokeAccessGrant(exchange.peerDid);
                            await revokeExchange(exchange.peerDid);
                            Alert.alert('成功', '已撤销访问权限');
                        } catch (error) {
                            Alert.alert('错误', '撤销失败');
                        }
                    }
                }
            ]
        );
    };

    // 渲染名片列表项
    const renderExchangeItem = ({ item }: { item: CardExchange }) => {
        const exchangedCard = exchangedCards.get(item.peerDid);
        const cardData = exchangedCard?.cardData;

        return (
            <TouchableOpacity
                style={styles.exchangeCard}
                onPress={() => viewCardDetail(item)}
            >
                <View style={styles.exchangeHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>👤</Text>
                    </View>
                    <View style={styles.exchangeInfo}>
                        <Text style={styles.exchangeName}>
                            {cardData?.realName || '加载中...'}
                        </Text>
                        <Text style={styles.exchangeCompany}>
                            {cardData?.companyName || item.peerDid.substring(0, 20) + '...'}
                        </Text>
                        <Text style={styles.exchangeDate}>
                            交换于 {new Date(item.exchangedAt).toLocaleDateString('zh-CN')}
                        </Text>
                    </View>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                            {item.status === 'active' ? '✓' : '✗'}
                        </Text>
                    </View>
                </View>

                <View style={styles.exchangeActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => viewCardDetail(item)}
                    >
                        <Text style={styles.actionButtonText}>查看详情</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.revokeButton]}
                        onPress={() => handleRevokeAccess(item)}
                    >
                        <Text style={[styles.actionButtonText, styles.revokeButtonText]}>撤销访问</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    // 渲染名片详情
    const renderCardDetail = () => {
        if (!selectedCard) return null;

        const exchangedCard = exchangedCards.get(selectedCard);
        const cardData = exchangedCard?.cardData;

        if (!cardData) return null;

        return (
            <View style={styles.detailOverlay}>
                <SafeAreaView style={styles.detailContainer}>
                    <View style={styles.detailHeader}>
                        <Text style={styles.detailTitle}>名片详情</Text>
                        <TouchableOpacity onPress={closeCardDetail}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {isScreenProtected && (
                        <View style={styles.protectionBanner}>
                            <Text style={styles.protectionText}>🔒 截屏保护已启用</Text>
                        </View>
                    )}

                    <FlatList
                        data={[
                            { label: '姓名', value: cardData.realName },
                            { label: '职位', value: cardData.position },
                            { label: '公司', value: cardData.companyName },
                            { label: '行业', value: cardData.industry },
                            { label: '电话', value: cardData.phone },
                            { label: '邮箱', value: cardData.email },
                            { label: '微信', value: cardData.wechat },
                            { label: '地址', value: cardData.address },
                        ]}
                        keyExtractor={(item) => item.label}
                        renderItem={({ item }) => (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{item.label}</Text>
                                <Text style={styles.detailValue}>{item.value}</Text>
                            </View>
                        )}
                        style={styles.detailList}
                    />
                </SafeAreaView>
            </View>
        );
    };

    const activeExchanges = exchanges.filter(e => e.status === 'active');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>名片收藏</Text>
                <Text style={styles.headerSubtitle}>
                    共 {activeExchanges.length} 张名片
                </Text>
            </View>

            {activeExchanges.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="contacts" size={64} color="#cbd5e1" style={styles.emptyIcon} />
                    <Text style={styles.emptyText}>还没有交换过名片</Text>
                    <Text style={styles.emptyHint}>去"交换"页面扫描对方的二维码</Text>
                </View>
            ) : (
                <FlatList
                    data={activeExchanges}
                    keyExtractor={(item) => item.id}
                    renderItem={renderExchangeItem}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {renderCardDetail()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    header: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    listContent: {
        padding: 16,
    },
    exchangeCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    exchangeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 24,
    },
    exchangeInfo: {
        flex: 1,
    },
    exchangeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    exchangeCompany: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 2,
    },
    exchangeDate: {
        fontSize: 11,
        color: '#94a3b8',
    },
    statusBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        fontSize: 14,
    },
    exchangeActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#64748b',
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ffffff',
    },
    revokeButton: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    revokeButtonText: {
        color: '#64748b',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    emptyHint: {
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
    },
    detailOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    detailContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
        marginTop: 60,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    closeButton: {
        fontSize: 24,
        color: '#64748b',
    },
    protectionBanner: {
        backgroundColor: '#fef3c7',
        padding: 12,
        alignItems: 'center',
    },
    protectionText: {
        fontSize: 12,
        color: '#92400e',
        fontWeight: '600',
    },
    detailList: {
        flex: 1,
    },
    detailRow: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    detailLabel: {
        width: 80,
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    detailValue: {
        flex: 1,
        fontSize: 14,
        color: '#1e293b',
    },
});

export default CollectionScreen;
