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

    const filteredCards = activeExchanges.filter(exchange => {
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
        backgroundColor: '#F8FAFC',
    },
    searchSection: {
        paddingHorizontal: 16,
        paddingTop: 0,
        paddingBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    myCardSection: {
        padding: 16,
    },
    myCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        borderWidth: 3,
        borderColor: '#4F46E5',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
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
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#4F46E5',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#4F46E5',
    },
    myCardInfo: {
        flex: 1,
    },
    myCardName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 6,
    },
    myCardPosition: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 4,
        fontWeight: '500',
    },
    myCardCompany: {
        fontSize: 15,
        color: '#94a3b8',
    },
    myCardActions: {
        marginBottom: 16,
    },
    actionButton: {
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    primaryButtonText: {
        color: '#ffffff',
    },
    myCardFooter: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    encryptionStatus: {
        fontSize: 12,
        color: '#10B981',
        marginBottom: 4,
    },
    didText: {
        fontSize: 11,
        color: '#94a3b8',
        fontFamily: 'monospace',
    },
    collectionSection: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    filterButton: {
        fontSize: 13,
        color: '#4F46E5',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    emptyHint: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#4F46E5',
        borderRadius: 10,
    },
    emptyButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
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
        fontSize: 13,
        fontWeight: '600',
        color: '#4F46E5',
    },
    // 下拉框样式
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dropdownContainer: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '70%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    dropdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dropdownTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1e293b',
    },
    dropdownCloseText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
    },
    dropdownScroll: {
        maxHeight: 400,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    dropdownItemActive: {
        backgroundColor: '#f8fafc',
    },
    dropdownItemText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#1e293b',
    },
    dropdownItemTextActive: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    tagColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
});

export default CardsScreen;
