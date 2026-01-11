import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCardStore, BusinessItem } from '../store/useCardStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SectionHeader = ({ title, emoji }: any) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderEmoji}>{emoji}</Text>
        <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
);

const InputField = ({ label, value, onChangeText, placeholder, multiline = false }: any) => (
    <View style={styles.inputField}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            multiline={multiline}
            style={[styles.input, multiline && styles.multilineInput]}
        />
    </View>
);

const BusinessItemCard = ({ item, onUpdate, onDelete }: any) => (
    <View style={styles.businessItemCard}>
        <TextInput
            value={item.name}
            onChangeText={(text) => onUpdate({ name: text })}
            placeholder="项目名称"
            placeholderTextColor="#94a3b8"
            style={styles.businessItemName}
        />
        <TextInput
            value={item.description}
            onChangeText={(text) => onUpdate({ description: text })}
            placeholder="描述..."
            placeholderTextColor="#94a3b8"
            multiline={true}
            style={styles.businessItemDescription}
        />
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>删除</Text>
        </TouchableOpacity>
    </View>
);

const EditCardScreen = ({ onClose }: any) => {
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

    const handleSave = () => {
        onClose();
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* 顶部导航栏 */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Text style={styles.backButtonText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>编辑名片</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.saveHeaderButton}>
                        <Text style={styles.saveHeaderButtonText}>完成</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 基本信息 */}
                <View style={styles.card}>
                    <SectionHeader title="基本信息" emoji="👤" />
                    <InputField label="姓名" value={cardData.realName} onChangeText={(v: any) => updateCardData({ realName: v })} placeholder="请输入姓名" />
                    <InputField label="职位" value={cardData.position} onChangeText={(v: any) => updateCardData({ position: v })} placeholder="请输入职位" />
                    <InputField label="公司名称" value={cardData.companyName} onChangeText={(v: any) => updateCardData({ companyName: v })} placeholder="请输入公司名称" />
                    <InputField label="行业领域" value={cardData.industry} onChangeText={(v: any) => updateCardData({ industry: v })} placeholder="请输入行业领域" />
                    <InputField label="关于我" value={cardData.aboutMe} onChangeText={(v: any) => updateCardData({ aboutMe: v })} placeholder="简单介绍一下自己" multiline={true} />
                </View>

                {/* 联系方式 */}
                <View style={styles.card}>
                    <SectionHeader title="联系方式" emoji="📧" />
                    <InputField label="电话" value={cardData.phone} onChangeText={(v: any) => updateCardData({ phone: v })} placeholder="请输入电话" />
                    <InputField label="邮箱" value={cardData.email} onChangeText={(v: any) => updateCardData({ email: v })} placeholder="请输入邮箱" />
                    <InputField label="微信" value={cardData.wechat} onChangeText={(v: any) => updateCardData({ wechat: v })} placeholder="请输入微信号" />
                </View>

                {/* 主营业务 */}
                <View style={styles.card}>
                    <SectionHeader title="主营业务" emoji="💼" />
                    {cardData.mainBusiness.map(item => (
                        <BusinessItemCard
                            key={item.id}
                            item={item}
                            onUpdate={(data: any) => handleUpdateItem('mainBusiness', item.id, data)}
                            onDelete={() => handleDeleteItem('mainBusiness', item.id)}
                        />
                    ))}
                    <TouchableOpacity style={styles.addButton} onPress={() => handleAddItem('mainBusiness')}>
                        <Text style={styles.addButtonText}>+ 添加业务</Text>
                    </TouchableOpacity>
                </View>

                {/* 服务需求 */}
                <View style={styles.card}>
                    <SectionHeader title="服务需求" emoji="🎯" />
                    {cardData.serviceNeeds.map(item => (
                        <BusinessItemCard
                            key={item.id}
                            item={item}
                            onUpdate={(data: any) => handleUpdateItem('serviceNeeds', item.id, data)}
                            onDelete={() => handleDeleteItem('serviceNeeds', item.id)}
                        />
                    ))}
                    <TouchableOpacity style={styles.addButton} onPress={() => handleAddItem('serviceNeeds')}>
                        <Text style={styles.addButtonText}>+ 添加需求</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.spacer} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    safeArea: {
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    backButtonText: {
        fontSize: 20,
        color: '#64748b',
        fontWeight: '400',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1e293b',
    },
    saveHeaderButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#4F46E5',
        borderRadius: 22,
        minWidth: 60,
        alignItems: 'center',
    },
    saveHeaderButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionHeaderEmoji: {
        fontSize: 20,
        marginRight: 8,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    inputField: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1e293b',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    multilineInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    businessItemCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    businessItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
        paddingVertical: 4,
    },
    businessItemDescription: {
        color: '#64748b',
        fontSize: 13,
        height: 48,
        lineHeight: 20,
        paddingTop: 8,
    },
    deleteButton: {
        alignSelf: 'flex-end',
        paddingVertical: 4,
        paddingHorizontal: 12,
        marginTop: 4,
    },
    deleteButtonText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '600',
    },
    addButton: {
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#4F46E5',
        fontWeight: '600',
        fontSize: 14,
    },
    spacer: {
        height: 40,
    },
});

export default EditCardScreen;
