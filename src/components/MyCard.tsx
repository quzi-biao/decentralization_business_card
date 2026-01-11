import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BusinessCardData } from '../store/useCardStore';

interface MyCardProps {
    cardData: BusinessCardData;
    onPress?: () => void;
}

const MyCard: React.FC<MyCardProps> = ({ cardData, onPress }) => {
    const CardWrapper = onPress ? TouchableOpacity : View;
    
    return (
        <CardWrapper 
            style={styles.myCard}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            {/* 顶部：基本信息 */}
            <View style={styles.topSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {cardData.realName?.charAt(0) || '👤'}
                    </Text>
                </View>
                <View style={styles.basicInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name} numberOfLines={1}>
                            {cardData.realName || '未设置姓名'}
                        </Text>
                        {cardData.phone && (
                            <Text style={styles.phoneInline} numberOfLines={1}>
                                📱 {cardData.phone}
                            </Text>
                        )}
                    </View>
                    <Text style={styles.position} numberOfLines={1}>
                        {cardData.position || '未设置职位'}
                    </Text>
                    <Text style={styles.company} numberOfLines={1}>
                        {cardData.companyName || '未设置公司'}
                    </Text>
                </View>
            </View>

            {/* 中部：业务信息 */}
            {(cardData.mainBusiness?.length > 0 || cardData.serviceNeeds?.length > 0) && (
                <View style={styles.middleSection}>
                    {cardData.mainBusiness && cardData.mainBusiness.length > 0 && (
                        <View style={styles.businessColumn}>
                            <Text style={styles.columnTitle}>💼 主营业务</Text>
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
                            <Text style={styles.columnTitle}>🎯 服务需求</Text>
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
    columnTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
        marginBottom: 6,
    },
    businessItem: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 3,
        paddingLeft: 4,
    },
    moreText: {
        fontSize: 10,
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: 2,
        paddingLeft: 4,
    },
});

export default MyCard;
