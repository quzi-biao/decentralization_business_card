import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, LayoutAnimation, Platform, UIManager, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCardStore, BusinessItem } from '../store/useCardStore';
import PageHeader from '../components/PageHeader';
import { FilePersistenceService } from '../services/filePersistence';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SectionHeader = ({ title, iconName }: any) => (
    <View style={styles.sectionHeader}>
        <MaterialIcons name={iconName} size={20} color="#4F46E5" style={styles.sectionIcon} />
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
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

    const handlePickAvatar = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (permissionResult.granted === false) {
                Alert.alert('需要权限', '请允许访问相册以选择头像');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images' as any,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets[0]) {
                setUploadingAvatar(true);
                const asset = result.assets[0];
                
                try {
                    // 读取图片为 base64
                    const response = await fetch(asset.uri);
                    const blob = await response.blob();
                    
                    // 使用 Promise 包装 FileReader
                    const base64data = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                    
                    // 保存到加密存储
                    const avatarKey = `avatar_${Date.now()}`;
                    await FilePersistenceService.saveImage(avatarKey, base64data);
                    
                    // 更新卡片数据 - 直接存储 base64 数据用于立即显示
                    updateCardData({ avatarUrl: base64data });
                    
                    setUploadingAvatar(false);
                } catch (error) {
                    console.error('Error processing image:', error);
                    Alert.alert('错误', '处理图片失败，请重试');
                    setUploadingAvatar(false);
                }
            }
        } catch (error) {
            console.error('Error picking avatar:', error);
            Alert.alert('错误', '选择头像失败，请重试');
            setUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = () => {
        Alert.alert(
            '移除头像',
            '确定要移除当前头像吗？',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '移除',
                    style: 'destructive',
                    onPress: async () => {
                        if (cardData.avatarUrl) {
                            await FilePersistenceService.deleteImage(cardData.avatarUrl);
                        }
                        updateCardData({ avatarUrl: undefined });
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <PageHeader 
                    title="编辑名片"
                    onBack={onClose}
                    rightButton={{
                        text: '完成',
                        onPress: handleSave
                    }}
                    backgroundColor="#f8fafc"
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 头像设置 */}
                <View style={styles.card}>
                    <SectionHeader title="头像" iconName="account-circle" />
                    <View style={styles.avatarSection}>
                        <TouchableOpacity 
                            style={styles.avatarContainer}
                            onPress={handlePickAvatar}
                            disabled={uploadingAvatar}
                        >
                            {cardData.avatarUrl ? (
                                <Image 
                                    source={{ uri: cardData.avatarUrl }}
                                    style={styles.avatar}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <MaterialIcons name="person" size={48} color="#cbd5e1" />
                                </View>
                            )}
                            <View style={styles.avatarOverlay}>
                                <MaterialIcons name="camera-alt" size={24} color="#ffffff" />
                            </View>
                        </TouchableOpacity>
                        <View style={styles.avatarActions}>
                            <TouchableOpacity 
                                style={styles.avatarButton}
                                onPress={handlePickAvatar}
                                disabled={uploadingAvatar}
                            >
                                <MaterialIcons name="photo-library" size={20} color="#4F46E5" />
                                <Text style={styles.avatarButtonText}>
                                    {uploadingAvatar ? '上传中...' : '选择头像'}
                                </Text>
                            </TouchableOpacity>
                            {cardData.avatarUrl && (
                                <TouchableOpacity 
                                    style={[styles.avatarButton, styles.removeButton]}
                                    onPress={handleRemoveAvatar}
                                >
                                    <MaterialIcons name="delete" size={20} color="#ef4444" />
                                    <Text style={[styles.avatarButtonText, styles.removeButtonText]}>移除</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.avatarHint}>支持 PNG、JPG、SVG 等格式，建议使用正方形图片</Text>
                    </View>
                </View>

                {/* 基本信息 */}
                <View style={styles.card}>
                    <SectionHeader title="基本信息" iconName="person" />
                    <InputField label="姓名" value={cardData.realName} onChangeText={(v: any) => updateCardData({ realName: v })} placeholder="请输入姓名" />
                    <InputField label="职位" value={cardData.position} onChangeText={(v: any) => updateCardData({ position: v })} placeholder="请输入职位" />
                    <InputField label="公司名称" value={cardData.companyName} onChangeText={(v: any) => updateCardData({ companyName: v })} placeholder="请输入公司名称" />
                    <InputField label="行业领域" value={cardData.industry} onChangeText={(v: any) => updateCardData({ industry: v })} placeholder="请输入行业领域" />
                    <InputField label="关于我" value={cardData.aboutMe} onChangeText={(v: any) => updateCardData({ aboutMe: v })} placeholder="简单介绍一下自己" multiline={true} />
                </View>

                {/* 联系方式 */}
                <View style={styles.card}>
                    <SectionHeader title="联系方式" iconName="contact-mail" />
                    <InputField label="电话" value={cardData.phone} onChangeText={(v: any) => updateCardData({ phone: v })} placeholder="请输入电话" />
                    <InputField label="邮箱" value={cardData.email} onChangeText={(v: any) => updateCardData({ email: v })} placeholder="请输入邮箱" />
                    <InputField label="微信" value={cardData.wechat} onChangeText={(v: any) => updateCardData({ wechat: v })} placeholder="请输入微信号" />
                </View>

                {/* 主营业务 */}
                <View style={styles.card}>
                    <SectionHeader title="主营业务" iconName="work" />
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
                    <SectionHeader title="服务需求" iconName="flag" />
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
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
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
    sectionIcon: {
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
        height: 20,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    avatarOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    avatarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#ede9fe',
        borderRadius: 8,
    },
    removeButton: {
        backgroundColor: '#fee2e2',
    },
    avatarButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    removeButtonText: {
        color: '#ef4444',
    },
    avatarHint: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 16,
    },
});

export default EditCardScreen;
