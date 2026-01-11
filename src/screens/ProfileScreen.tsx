import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCardStore, BusinessItem } from '../store/useCardStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SectionHeader = ({ title, emoji, onAdd }: any) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionEmoji}>{emoji}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {onAdd && (
            <TouchableOpacity onPress={onAdd} style={styles.addButton}>
                <Text style={styles.addEmoji}>➕</Text>
                <Text style={styles.addButtonText}>添加项目</Text>
            </TouchableOpacity>
        )}
    </View>
);

const InputField = ({ label, value, onChangeText, placeholder, multiline = false }: any) => (
    <View style={styles.inputField}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.1)"
            multiline={multiline}
            style={[styles.input, multiline && styles.multilineInput]}
        />
    </View>
);

const BusinessItemCard = ({ item, onUpdate, onDelete }: { item: BusinessItem, onUpdate: (data: Partial<BusinessItem>) => void, onDelete: () => void }) => (
    <View style={styles.businessItemCard}>
        <View style={styles.businessItemHeader}>
            <TextInput
                value={item.name}
                onChangeText={(v) => onUpdate({ name: v })}
                placeholder="业务/需求名称"
                placeholderTextColor="rgba(255,255,255,0.2)"
                style={styles.businessItemName}
            />
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
                <Text style={styles.deleteEmoji}>🗑️</Text>
            </TouchableOpacity>
        </View>
        <TextInput
            value={item.description}
            onChangeText={(v) => onUpdate({ description: v })}
            placeholder="描述..."
            placeholderTextColor="rgba(255,255,255,0.1)"
            multiline={true}
            style={styles.businessItemDescription}
        />
    </View>
);

const ProfileScreen = () => {
    const { cardData, updateCardData } = useCardStore();

    const handleUpdateItem = (field: 'mainBusiness' | 'serviceNeeds', id: string, data: Partial<BusinessItem>) => {
        const newList = cardData[field].map(item => item.id === id ? { ...item, ...data } : item);
        updateCardData({ [field]: newList });
    };

    const handleAddItem = (field: 'mainBusiness' | 'serviceNeeds') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newItem = { id: Math.random().toString(36).substr(2, 9), name: '', description: '' };
        updateCardData({ [field]: [...cardData[field], newItem] });
    };

    const handleDeleteItem = (field: 'mainBusiness' | 'serviceNeeds', id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        updateCardData({ [field]: cardData[field].filter(item => item.id !== id) });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 基本信息卡片 */}
                <View style={styles.card}>
                    <SectionHeader title="基本信息" emoji="👤" />
                    <InputField label="姓名" value={cardData.realName} onChangeText={(v: any) => updateCardData({ realName: v })} />
                    <InputField label="职位" value={cardData.position} onChangeText={(v: any) => updateCardData({ position: v })} />
                    <InputField label="公司名称" value={cardData.companyName} onChangeText={(v: any) => updateCardData({ companyName: v })} />
                    <InputField label="行业领域" value={cardData.industry} onChangeText={(v: any) => updateCardData({ industry: v })} />
                    <InputField label="关于我" value={cardData.aboutMe} onChangeText={(v: any) => updateCardData({ aboutMe: v })} multiline={true} />
                </View>

                {/* 联系方式卡片 */}
                <View style={styles.card}>
                    <SectionHeader title="联系方式" emoji="📧" />
                    <InputField label="电话" value={cardData.phone} onChangeText={(v: any) => updateCardData({ phone: v })} />
                    <InputField label="邮箱" value={cardData.email} onChangeText={(v: any) => updateCardData({ email: v })} />
                    <InputField label="微信" value={cardData.wechat} onChangeText={(v: any) => updateCardData({ wechat: v })} />
                    <InputField label="地址" value={cardData.address} onChangeText={(v: any) => updateCardData({ address: v })} />
                </View>

                {/* 个人背景卡片 */}
                <View style={styles.card}>
                    <SectionHeader title="个人背景" emoji="🎓" />
                    <InputField label="家乡" value={cardData.hometown} onChangeText={(v: any) => updateCardData({ hometown: v })} />
                    <InputField label="常驻" value={cardData.residence} onChangeText={(v: any) => updateCardData({ residence: v })} />
                    <InputField label="兴趣爱好" value={cardData.hobbies} onChangeText={(v: any) => updateCardData({ hobbies: v })} />
                    <InputField label="性格特点" value={cardData.personality} onChangeText={(v: any) => updateCardData({ personality: v })} />
                    <InputField label="关注行业" value={cardData.focusIndustry} onChangeText={(v: any) => updateCardData({ focusIndustry: v })} />
                    <InputField label="圈层" value={cardData.circles} onChangeText={(v: any) => updateCardData({ circles: v })} />
                </View>

                {/* 企业信息卡片 */}
                <View style={styles.card}>
                    <SectionHeader title="企业信息" emoji="🏢" />
                    <InputField label="公司简介" value={cardData.companyIntro} onChangeText={(v: any) => updateCardData({ companyIntro: v })} multiline={true} />
                </View>

                {/* 主营业务卡片 */}
                <View style={styles.card}>
                    <SectionHeader title="主营业务" emoji="💼" onAdd={() => handleAddItem('mainBusiness')} />
                    {cardData.mainBusiness.map(item => (
                        <BusinessItemCard
                            key={item.id}
                            item={item}
                            onUpdate={(data) => handleUpdateItem('mainBusiness', item.id, data)}
                            onDelete={() => handleDeleteItem('mainBusiness', item.id)}
                        />
                    ))}
                </View>

                {/* 资源需求卡片 */}
                <View style={styles.card}>
                    <SectionHeader title="资源需求" emoji="🤝" onAdd={() => handleAddItem('serviceNeeds')} />
                    {cardData.serviceNeeds.map(item => (
                        <BusinessItemCard
                            key={item.id}
                            item={item}
                            onUpdate={(data) => handleUpdateItem('serviceNeeds', item.id, data)}
                            onDelete={() => handleDeleteItem('serviceNeeds', item.id)}
                        />
                    ))}
                </View>

                {/* 保存按钮 */}
                <TouchableOpacity style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>保存更改</Text>
                </TouchableOpacity>

                <View style={styles.spacer} />
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionEmoji: {
        fontSize: 14,
    },
    addEmoji: {
        fontSize: 10,
    },
    deleteEmoji: {
        fontSize: 14,
        opacity: 0.2,
    },
    sectionTitle: {
        color: '#475569',
        fontSize: 15,
        fontWeight: '600',
    },
    addButton: {
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addButtonText: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
    },
    inputField: {
        marginBottom: 16,
    },
    inputLabel: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#1e293b',
        fontSize: 14,
    },
    multilineInput: {
        height: 80,
        paddingTop: 12,
    },
    businessItemCard: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
    },
    businessItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    businessItemName: {
        flex: 1,
        color: '#1e293b',
        fontSize: 14,
        fontWeight: '600',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 6,
        marginRight: 16,
    },
    deleteButton: {
        padding: 8,
    },
    businessItemDescription: {
        color: '#64748b',
        fontSize: 13,
        height: 48,
        lineHeight: 20,
        paddingTop: 8,
    },
    saveButton: {
        marginTop: 8,
        backgroundColor: '#64748b',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    saveButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 15,
    },
    spacer: {
        height: 80,
    },
});

export default ProfileScreen;
