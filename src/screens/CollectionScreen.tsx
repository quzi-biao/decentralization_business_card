import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { useExchangeStore, CardExchange } from '../store/useExchangeStore';
import { downloadEncryptedCard, getAccessGrant, decryptCardData, revokeAccessGrant, isGrantRevoked } from '../services/storageService';
import { getIdentity } from '../services/identityService';
import { CollectionStackParamList } from '../navigation/CollectionStack';
import { ThemeConfig } from '../constants/theme';

/**
 * 名片收藏屏幕
 * 显示已交换的名片列表
 */

type Props = StackScreenProps<CollectionStackParamList, 'CollectionList'>;

const CollectionScreen: React.FC<Props> = ({ navigation }) => {
    const { exchanges, exchangedCards, setExchangedCard, revokeExchange, loadExchanges } = useExchangeStore();
    const [loading, setLoading] = useState(false);

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
                navigation.navigate('CardDetail', { cardData: existingCard.cardData });
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
            navigation.navigate('CardDetail', { cardData });
        } catch (error) {
            console.error('Failed to view card:', error);
            Alert.alert('错误', '无法查看名片');
        }
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
    },
    header: {
        padding: ThemeConfig.spacing.base,
        backgroundColor: ThemeConfig.colors.background,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.border,
    },
    headerTitle: {
        fontSize: ThemeConfig.fontSize.xxl,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textSecondary,
        marginTop: ThemeConfig.spacing.xs,
    },
    listContent: {
        padding: ThemeConfig.spacing.base,
    },
    exchangeCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.base,
        marginBottom: ThemeConfig.spacing.md,
        ...ThemeConfig.shadow.sm,
    },
    exchangeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: ThemeConfig.spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: ThemeConfig.spacing.md,
    },
    avatarText: {
        fontSize: ThemeConfig.fontSize.xxxl,
    },
    exchangeInfo: {
        flex: 1,
    },
    exchangeName: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.xs,
    },
    exchangeCompany: {
        fontSize: ThemeConfig.fontSize.base - 1,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: 2,
    },
    exchangeDate: {
        fontSize: ThemeConfig.fontSize.xs,
        color: ThemeConfig.colors.textTertiary,
    },
    statusBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        fontSize: ThemeConfig.fontSize.base,
    },
    exchangeActions: {
        flexDirection: 'row',
        gap: ThemeConfig.spacing.sm,
    },
    actionButton: {
        flex: 1,
        paddingVertical: ThemeConfig.spacing.sm + 2,
        borderRadius: ThemeConfig.borderRadius.base,
        backgroundColor: ThemeConfig.colors.textSecondary,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: ThemeConfig.fontSize.base - 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.white,
    },
    revokeButton: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    revokeButtonText: {
        color: ThemeConfig.colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: ThemeConfig.spacing.xxxl,
    },
    emptyIcon: {
        marginBottom: ThemeConfig.spacing.base,
    },
    emptyText: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: ThemeConfig.spacing.sm,
    },
    emptyHint: {
        fontSize: ThemeConfig.fontSize.base - 1,
        color: ThemeConfig.colors.textTertiary,
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
        backgroundColor: ThemeConfig.colors.background,
        marginTop: 60,
        borderTopLeftRadius: ThemeConfig.borderRadius.lg,
        borderTopRightRadius: ThemeConfig.borderRadius.lg,
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: ThemeConfig.spacing.lg,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.border,
    },
    detailTitle: {
        fontSize: ThemeConfig.fontSize.xl,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
    },
    closeButton: {
        fontSize: ThemeConfig.fontSize.xxxl,
        color: ThemeConfig.colors.textSecondary,
    },
    protectionBanner: {
        backgroundColor: '#fef3c7',
        padding: ThemeConfig.spacing.md,
        alignItems: 'center',
    },
    protectionText: {
        fontSize: ThemeConfig.fontSize.sm,
        color: '#92400e',
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
    detailList: {
        flex: 1,
    },
    detailRow: {
        flexDirection: 'row',
        padding: ThemeConfig.spacing.base,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.backgroundTertiary,
    },
    detailLabel: {
        width: 80,
        fontSize: ThemeConfig.fontSize.base - 1,
        color: ThemeConfig.colors.textSecondary,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    detailValue: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textPrimary,
    },
});

export default CollectionScreen;
