import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BusinessCardData } from '../store/useCardStore';
import { LazyImage } from './LazyImage';

interface MyCardProps {
    cardData: BusinessCardData;
    onPress?: () => void;
    onAIAssistantPress?: () => void;
}

const MyCard: React.FC<MyCardProps> = ({ cardData, onPress, onAIAssistantPress }) => {
    const CardWrapper = onPress ? TouchableOpacity : View;
    
    // 检查是否有任何名片内容（排除系统默认字段）
    const hasCardData = Boolean(
        cardData.realName || cardData.position || cardData.companyName || 
        cardData.industry || cardData.phone || cardData.email || 
        cardData.wechat || cardData.address || cardData.aboutMe ||
        cardData.hometown || cardData.residence || cardData.hobbies ||
        cardData.personality || cardData.focusIndustry || cardData.circles ||
        cardData.companyIntro || cardData.mainBusiness?.length > 0 || 
        cardData.serviceNeeds?.length > 0 ||
        cardData.avatarId || cardData.avatarUrl || cardData.wechatQrCodeId || 
        cardData.wechatQrCode || cardData.introVideoUrl || cardData.videoChannelId
    );
    
    // 如果没有任何内容，显示空状态
    if (!hasCardData) {
        return (
            <View style={styles.emptyCard}>
                <MaterialIcons name="badge" size={64} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>还没有名片</Text>
                <Text style={styles.emptyDescription}>
                    让 AI 助手帮您快速创建专属名片
                </Text>
                {onAIAssistantPress && (
                    <TouchableOpacity 
                        style={styles.aiButton}
                        onPress={onAIAssistantPress}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="smart-toy" size={20} color="#ffffff" />
                        <Text style={styles.aiButtonText}>AI 帮我填写</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }
    
    return (
        <CardWrapper 
            style={styles.myCard}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            {/* 顶部：基本信息 */}
            <View style={styles.topSection}>
                <View style={styles.avatar}>
                    {cardData.avatarId ? (
                        <LazyImage 
                            imageId={cardData.avatarId}
                            useThumbnail={true}
                            style={styles.avatarImage}
                        />
                    ) : cardData.avatarUrl && cardData.avatarUrl.length < 150000 ? (
                        <Image 
                            source={{ uri: cardData.avatarUrl }}
                            style={styles.avatarImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={styles.avatarText}>
                            {cardData.realName?.charAt(0) || '👤'}
                        </Text>
                    )}
                </View>
                <View style={styles.basicInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name} numberOfLines={1}>
                            {cardData.realName || '未填写姓名'}
                        </Text>
                        {cardData.phone && (
                            <View style={styles.phoneContainer}>
                                <MaterialIcons name="phone" size={14} color="#64748b" />
                                <Text style={styles.phoneInline} numberOfLines={1}>
                                    {cardData.phone}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.position} numberOfLines={1}>
                        {cardData.position || '未填写职位'}
                    </Text>
                    <Text style={styles.company} numberOfLines={1}>
                        {cardData.companyName || '未填写公司'}
                    </Text>
                </View>
            </View>

            {/* 中部：业务信息 */}
            {(cardData.mainBusiness?.length > 0 || cardData.serviceNeeds?.length > 0) && (
                <View style={styles.middleSection}>
                    {cardData.mainBusiness && cardData.mainBusiness.length > 0 && (
                        <View style={styles.businessColumn}>
                            <View style={styles.columnTitleRow}>
                                <MaterialIcons name="work-outline" size={14} color="#4F46E5" />
                                <Text style={styles.columnTitle}>主营业务</Text>
                            </View>
                            {cardData.mainBusiness.slice(0, 2).map((item, index) => (
                                <Text key={item.id || index} style={styles.businessItem} numberOfLines={1}>
                                    • {item.name}
                                </Text>
                            ))}
                            {cardData.mainBusiness.length > 2 && (
                                <Text style={styles.moreText}>+{cardData.mainBusiness.length - 2} 更多</Text>
                            )}
                        </View>
                    )}
                    
                    {cardData.serviceNeeds && cardData.serviceNeeds.length > 0 && (
                        <View style={styles.businessColumn}>
                            <View style={styles.columnTitleRow}>
                                <MaterialIcons name="flag" size={14} color="#4F46E5" />
                                <Text style={styles.columnTitle}>服务需求</Text>
                            </View>
                            {cardData.serviceNeeds.slice(0, 2).map((item, index) => (
                                <Text key={item.id || index} style={styles.businessItem} numberOfLines={1}>
                                    • {item.name}
                                </Text>
                            ))}
                            {cardData.serviceNeeds.length > 2 && (
                                <Text style={styles.moreText}>+{cardData.serviceNeeds.length - 2} 更多</Text>
                            )}
                        </View>
                    )}
                </View>
            )}
        </CardWrapper>
    );
};

const styles = StyleSheet.create({
    myCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 20,
        borderWidth: 3,
        borderColor: '#4F46E5',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 8,
        minHeight: 180,
    },
    // 顶部：基本信息
    topSection: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#e0e7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        borderWidth: 2.5,
        borderColor: '#4F46E5',
    },
    avatarText: {
        fontSize: 26,
        fontWeight: '700',
        color: '#4F46E5',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
    },
    avatarLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    basicInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 5,
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    phoneInline: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    position: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 3,
        fontWeight: '500',
    },
    company: {
        fontSize: 13,
        color: '#94a3b8',
    },
    // 中部：业务信息
    middleSection: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0'
    },
    businessColumn: {
        flex: 1,
    },
    columnTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    columnTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
    },
    businessItem: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 3,
        paddingLeft: 4,
    },
    moreText: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 4,
    },
    emptyCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        minHeight: 200,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4F46E5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    aiButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default MyCard;
