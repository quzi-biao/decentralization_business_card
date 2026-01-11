import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { PremiumCard } from '../components/PremiumCard';
import { useCardStore } from '../store/useCardStore';
import { HomeStackParamList } from '../navigation/HomeStack';

const BusinessItemCard = ({ name, description }: any) => (
    <View style={styles.businessCard}>
        <Text style={styles.businessName}>{name}</Text>
        <Text style={styles.businessDescription}>{description}</Text>
    </View>
);

type Props = StackScreenProps<HomeStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const { cardData } = useCardStore();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 名片卡片 */}
                <TouchableOpacity 
                    style={styles.cardContainer}
                    onPress={() => navigation.navigate('CardDetail', { cardData })}
                    activeOpacity={0.9}
                >
                    <PremiumCard data={cardData} />
                </TouchableOpacity>

                {/* 个人简介卡片 */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📝 个人简介</Text>
                    <Text style={styles.bioText}>
                        {cardData.aboutMe || "暂无个人简介"}
                    </Text>
                </View>

                {/* 个人背景卡片 */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🎓 个人背景</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>家乡</Text>
                            <Text style={styles.infoValue}>{cardData.hometown || '未填写'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>常驻</Text>
                            <Text style={styles.infoValue}>{cardData.residence || '未填写'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>兴趣爱好</Text>
                            <Text style={styles.infoValue}>{cardData.hobbies || '未填写'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>性格特点</Text>
                            <Text style={styles.infoValue}>{cardData.personality || '未填写'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>关注行业</Text>
                            <Text style={styles.infoValue}>{cardData.focusIndustry || '未填写'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>圈层</Text>
                            <Text style={styles.infoValue}>{cardData.circles || '未填写'}</Text>
                        </View>
                    </View>
                </View>

                {/* 公司简介卡片 */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🏢 公司简介</Text>
                    <Text style={styles.bioText}>
                        {cardData.companyIntro || "暂无公司简介"}
                    </Text>
                </View>

                {/* 主营业务卡片 */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>💼 主营业务</Text>
                    {cardData.mainBusiness.length > 0 ? (
                        cardData.mainBusiness.map((item, idx) => (
                            <BusinessItemCard key={idx} name={item.name} description={item.description} />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>暂无</Text>
                    )}
                </View>

                {/* 资源需求卡片 */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🤝 资源需求</Text>
                    {cardData.serviceNeeds.length > 0 ? (
                        cardData.serviceNeeds.map((item, idx) => (
                            <BusinessItemCard key={idx} name={item.name} description={item.description} />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>暂无</Text>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        智能名片 · 个人与企业一体化展示
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    scrollContent: {
        padding: 16,
    },
    cardContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 12,
    },
    bioText: {
        color: '#64748b',
        fontSize: 14,
        lineHeight: 22,
    },
    businessCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    businessName: {
        color: '#1e293b',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 6,
    },
    businessDescription: {
        color: '#64748b',
        fontSize: 13,
        lineHeight: 20,
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 13,
        fontStyle: 'italic',
        paddingVertical: 8,
    },
    footer: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    footerText: {
        color: '#94a3b8',
        fontSize: 11,
        textAlign: 'center',
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    infoItem: {
        width: '48%',
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        padding: 12,
    },
    infoLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
});

export default HomeScreen;
