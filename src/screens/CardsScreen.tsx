import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useCardStore } from '../store/useCardStore';
import { useExchangeStore } from '../store/useExchangeStore';
import { useTagStore } from '../store/useTagStore';
import MyCard from '../components/MyCard';
import ContactCard from '../components/ContactCard';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { CardsStackParamList } from '../navigation/CardsStack';
import { getIdentity } from '../services/identityService';
import { ThemeConfig } from '../constants/theme';

/**
 * 名片夹屏幕 - 主页面
 * 展示我的名片和已收藏的名片
 */

type Props = StackScreenProps<CardsStackParamList, 'CardsList'>;

const CardsScreen: React.FC<Props> = ({ navigation }) => {
    const { cardData } = useCardStore();
    const { exchanges, exchangedCards, loadExchanges } = useExchangeStore();
    const { tags, cardMetadata, loadTags, loadCardMetadata } = useTagStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [myDid, setMyDid] = useState('');
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    useEffect(() => {
        loadExchanges();
        loadTags();
        loadCardMetadata();
        loadIdentity();
    }, []);

    const loadIdentity = async () => {
        const identity = await getIdentity();
        if (identity) {
            setMyDid(identity.did);
        }
    };

    const activeExchanges = exchanges.filter(e => e.status === 'active');

    const filteredCards = activeExchanges
        .filter(exchange => {
            const card = exchangedCards.get(exchange.peerDid);
            if (!card?.cardData) return false;
            
            // 按标签筛选
            if (selectedTagId) {
                const metadata = cardMetadata.get(exchange.peerDid);
                if (!metadata || !metadata.tags.includes(selectedTagId)) {
                    return false;
                }
            }
            
            // 按关键词搜索
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const metadata = cardMetadata.get(exchange.peerDid);
                return (
                    card.cardData.realName?.toLowerCase().includes(searchLower) ||
                    card.cardData.companyName?.toLowerCase().includes(searchLower) ||
                    card.cardData.position?.toLowerCase().includes(searchLower) ||
                    metadata?.note?.toLowerCase().includes(searchLower)
                );
            }
            
            return true;
        })
        .sort((a, b) => {
            // 按重要度降序排序
            const metadataA = cardMetadata.get(a.peerDid);
            const metadataB = cardMetadata.get(b.peerDid);
            const importanceA = metadataA?.importance ?? 20;
            const importanceB = metadataB?.importance ?? 20;
            return importanceB - importanceA;
        });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 我的名片卡片 */}
                <View style={styles.myCardSection}>
                    <MyCard 
                        cardData={cardData} 
                        onPress={() => navigation.navigate('CardDetail', { cardData })}
                        onAIAssistantPress={() => (navigation as any).navigate('AIAssistant')}
                    />
                </View>

                {/* 搜索栏 */}
                <View style={styles.searchSection}>
                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="搜索姓名、公司、职位、备注"
                            placeholderTextColor="#94a3b8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* 标签筛选下拉框 */}
                <Modal
                    visible={showTagDropdown}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowTagDropdown(false)}
                >
                    <TouchableOpacity 
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowTagDropdown(false)}
                    >
                        <View style={styles.dropdownContainer}>
                            <View style={styles.dropdownHeader}>
                                <Text style={styles.dropdownTitle}>选择标签</Text>
                                <TouchableOpacity onPress={() => setShowTagDropdown(false)}>
                                    <MaterialIcons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.dropdownScroll}>
                                <TouchableOpacity
                                    style={[
                                        styles.dropdownItem,
                                        !selectedTagId && styles.dropdownItemActive
                                    ]}
                                    onPress={() => {
                                        setSelectedTagId(null);
                                        setShowTagDropdown(false);
                                    }}
                                >
                                    <MaterialIcons 
                                        name="label-outline" 
                                        size={20} 
                                        color={!selectedTagId ? '#4F46E5' : '#94a3b8'} 
                                    />
                                    <Text style={[
                                        styles.dropdownItemText,
                                        !selectedTagId && styles.dropdownItemTextActive
                                    ]}>
                                        全部标签
                                    </Text>
                                    {!selectedTagId && (
                                        <MaterialIcons name="check" size={20} color="#4F46E5" />
                                    )}
                                </TouchableOpacity>
                                {tags.map((tag) => (
                                    <TouchableOpacity
                                        key={tag.id}
                                        style={[
                                            styles.dropdownItem,
                                            selectedTagId === tag.id && styles.dropdownItemActive
                                        ]}
                                        onPress={() => {
                                            setSelectedTagId(tag.id);
                                            setShowTagDropdown(false);
                                        }}
                                    >
                                        <View style={[styles.tagColorDot, { backgroundColor: tag.color }]} />
                                        <Text style={[
                                            styles.dropdownItemText,
                                            selectedTagId === tag.id && styles.dropdownItemTextActive
                                        ]}>
                                            {tag.name}
                                        </Text>
                                        {selectedTagId === tag.id && (
                                            <MaterialIcons name="check" size={20} color="#4F46E5" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* 名片列表 */}
                <View style={styles.collectionSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <MaterialIcons name="contacts" size={18} color="#1e293b" />
                            <Text style={styles.sectionTitle}>
                                名片列表 ({activeExchanges.length})
                            </Text>
                        </View>
                        {activeExchanges.length > 0 && tags.length > 0 && (
                            <TouchableOpacity 
                                style={styles.tagFilterLink}
                                onPress={() => setShowTagDropdown(true)}
                            >
                                <Text style={styles.tagFilterLinkText}>
                                    {selectedTagId ? tags.find(t => t.id === selectedTagId)?.name : '全部'}
                                </Text>
                                <MaterialIcons name="arrow-drop-down" size={16} color="#4F46E5" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {filteredCards.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="contacts" size={64} color="#cbd5e1" style={styles.emptyIcon} />
                            <Text style={styles.emptyTitle}>
                                {searchQuery ? '没有找到相关名片' : '还没有收藏的名片'}
                            </Text>
                            <Text style={styles.emptyHint}>
                                {searchQuery 
                                    ? '试试其他关键词' 
                                    : '去"交换"页面扫描对方的二维码来交换名片吧'}
                            </Text>
                            {!searchQuery && (
                                <TouchableOpacity 
                                    style={styles.emptyButton}
                                    onPress={() => (navigation as any).navigate('Exchange')}
                                >
                                    <Text style={styles.emptyButtonText}>去交换名片</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.cardGrid}>
                            {filteredCards.map((exchange) => {
                                const card = exchangedCards.get(exchange.peerDid);
                                const cardData = card?.cardData;
                                const metadata = cardMetadata.get(exchange.peerDid);
                                const cardTags = metadata?.tags.map(tagId => tags.find(t => t.id === tagId)).filter(Boolean) || [];
                                
                                return (
                                    <ContactCard
                                        key={exchange.id}
                                        avatarId={cardData?.avatarId}
                                        avatarUrl={cardData?.avatarUrl}
                                        realName={cardData?.realName}
                                        position={cardData?.position}
                                        companyName={cardData?.companyName}
                                        tags={cardTags as any}
                                        note={metadata?.note}
                                        onPress={() => cardData && navigation.navigate('CardDetail', { 
                                            cardData, 
                                            peerDid: exchange.peerDid,
                                            exchangedAt: exchange.exchangedAt
                                        })}
                                    />
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// 格式化时间
function formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    searchSection: {
        paddingHorizontal: ThemeConfig.spacing.base,
        paddingTop: 0,
        paddingBottom: ThemeConfig.spacing.base,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        paddingHorizontal: ThemeConfig.spacing.md,
        height: 44,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
        ...ThemeConfig.shadow.xs,
    },
    searchIcon: {
        marginRight: ThemeConfig.spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textPrimary,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    content: {
        flex: 1,
    },
    myCardSection: {
        padding: ThemeConfig.spacing.base,
    },
    myCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.xxxl - 16,
        borderWidth: 3,
        borderColor: ThemeConfig.colors.primary,
        ...ThemeConfig.shadow.primary,
    },
    myCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#e0e7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: ThemeConfig.spacing.base,
        borderWidth: ThemeConfig.borderWidth.base,
        borderColor: ThemeConfig.colors.primary,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.primary,
    },
    myCardInfo: {
        flex: 1,
    },
    myCardName: {
        fontSize: 22,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: 6,
    },
    myCardPosition: {
        fontSize: ThemeConfig.fontSize.lg,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: 4,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    myCardCompany: {
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textTertiary,
    },
    myCardActions: {
        marginBottom: ThemeConfig.spacing.base,
    },
    actionButton: {
        paddingVertical: ThemeConfig.spacing.md,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: ThemeConfig.colors.primary,
        borderColor: ThemeConfig.colors.primary,
    },
    actionButtonText: {
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
    },
    primaryButtonText: {
        color: ThemeConfig.colors.white,
    },
    myCardFooter: {
        paddingTop: ThemeConfig.spacing.base,
        borderTopWidth: ThemeConfig.borderWidth.thin,
        borderTopColor: ThemeConfig.colors.backgroundTertiary,
    },
    encryptionStatus: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.success,
        marginBottom: 4,
    },
    didText: {
        fontSize: ThemeConfig.fontSize.xs,
        color: ThemeConfig.colors.textTertiary,
        fontFamily: 'monospace',
    },
    collectionSection: {
        padding: ThemeConfig.spacing.base,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ThemeConfig.spacing.base,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.sm,
    },
    sectionTitle: {
        fontSize: ThemeConfig.fontSize.xl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
    },
    filterButton: {
        fontSize: ThemeConfig.fontSize.base - 1,
        color: ThemeConfig.colors.primary,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        marginBottom: ThemeConfig.spacing.base,
    },
    emptyTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: ThemeConfig.spacing.sm,
    },
    emptyHint: {
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textTertiary,
        textAlign: 'center',
        marginBottom: ThemeConfig.spacing.xxxl - 16,
    },
    emptyButton: {
        paddingHorizontal: ThemeConfig.spacing.xxxl - 16,
        paddingVertical: ThemeConfig.spacing.md,
        backgroundColor: ThemeConfig.colors.primary,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
    },
    emptyButtonText: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.white,
    },
    cardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    // 标签筛选链接样式
    tagFilterLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    tagFilterLinkText: {
        fontSize: ThemeConfig.fontSize.base - 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.primary,
    },
    // 下拉框样式
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: ThemeConfig.spacing.lg,
    },
    dropdownContainer: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '70%',
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        ...ThemeConfig.shadow.md,
    },
    dropdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: ThemeConfig.spacing.base,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.backgroundTertiary,
    },
    dropdownTitle: {
        fontSize: ThemeConfig.fontSize.lg + 1,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
    },
    dropdownCloseText: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
    },
    dropdownScroll: {
        maxHeight: 400,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: ThemeConfig.spacing.base,
        gap: ThemeConfig.spacing.md,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.backgroundSecondary,
    },
    dropdownItemActive: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    dropdownItemText: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.medium,
        color: ThemeConfig.colors.textPrimary,
    },
    dropdownItemTextActive: {
        color: ThemeConfig.colors.primary,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
    tagColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
});

export default CardsScreen;
