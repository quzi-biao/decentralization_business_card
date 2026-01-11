import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useCardStore } from '../store/useCardStore';
import { useExchangeStore } from '../store/useExchangeStore';
import MyCard from '../components/MyCard';
import { getIdentity } from '../services/identityService';

/**
 * 名片夹屏幕 - 主页面
 * 展示我的名片和已收藏的名片
 */

const CardsScreen = () => {
    const { cardData } = useCardStore();
    const { exchanges, exchangedCards, loadExchanges } = useExchangeStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [myDid, setMyDid] = useState('');

    useEffect(() => {
        loadExchanges();
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
        
        const searchLower = searchQuery.toLowerCase();
        return (
            card.cardData.realName?.toLowerCase().includes(searchLower) ||
            card.cardData.companyName?.toLowerCase().includes(searchLower) ||
            card.cardData.position?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 我的名片卡片 */}
                <View style={styles.myCardSection}>
                    <MyCard cardData={cardData} />
                </View>

                {/* 搜索栏 */}
                <View style={styles.searchSection}>
                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="搜索姓名、公司、职位"
                            placeholderTextColor="#94a3b8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* 名片列表 */}
                <View style={styles.collectionSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <MaterialIcons name="contacts" size={18} color="#1e293b" />
                            <Text style={styles.sectionTitle}>
                                名片列表 ({activeExchanges.length})
                            </Text>
                        </View>
                        {activeExchanges.length > 0 && (
                            <TouchableOpacity>
                                <Text style={styles.filterButton}>筛选 ▼</Text>
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
                                <TouchableOpacity style={styles.emptyButton}>
                                    <Text style={styles.emptyButtonText}>去交换名片</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.cardGrid}>
                            {filteredCards.map((exchange) => {
                                const card = exchangedCards.get(exchange.peerDid);
                                const cardData = card?.cardData;
                                
                                return (
                                    <TouchableOpacity 
                                        key={exchange.id} 
                                        style={styles.cardItem}
                                    >
                                        <View style={styles.cardAvatar}>
                                            <Text style={styles.cardAvatarText}>
                                                {cardData?.realName?.charAt(0) || '👤'}
                                            </Text>
                                        </View>
                                        <Text style={styles.cardName} numberOfLines={1}>
                                            {cardData?.realName || '未知'}
                                        </Text>
                                        <Text style={styles.cardPosition} numberOfLines={1}>
                                            {cardData?.position || '未知职位'}
                                        </Text>
                                        <Text style={styles.cardCompany} numberOfLines={1}>
                                            {cardData?.companyName || '未知公司'}
                                        </Text>
                                        <Text style={styles.cardTime}>
                                            {formatTime(exchange.exchangedAt)}
                                        </Text>
                                    </TouchableOpacity>
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
        gap: 12,
    },
    cardItem: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cardAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    cardAvatarText: {
        fontSize: 20,
    },
    cardName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    cardPosition: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 2,
    },
    cardCompany: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 8,
    },
    cardTime: {
        fontSize: 11,
        color: '#cbd5e1',
    },
});

export default CardsScreen;
