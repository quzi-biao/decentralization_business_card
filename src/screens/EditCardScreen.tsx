import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, LayoutAnimation, Platform, UIManager, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCardStore, BusinessItem } from '../store/useCardStore';
import PageHeader from '../components/PageHeader';
import { LazyImage } from '../components/LazyImage';
import { fileManager } from '../services/fileManager';
import { ThemeConfig } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SectionHeader = ({ title, iconName }: any) => (
    <View style={styles.sectionHeader}>
        <MaterialIcons name={iconName} size={20} color={ThemeConfig.colors.primary} style={styles.sectionIcon} />
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
            placeholderTextColor={ThemeConfig.colors.textTertiary}
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
            placeholderTextColor={ThemeConfig.colors.textTertiary}
            style={styles.businessItemName}
        />
        <TextInput
            value={item.description}
            onChangeText={(text) => onUpdate({ description: text })}
            placeholder="描述..."
            placeholderTextColor={ThemeConfig.colors.textTertiary}
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
        const newItem = { id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, name: '', description: '' };
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

            setUploadingAvatar(true);
            
            try {
                const metadata = await fileManager.pickImage({
                    context: 'profile',
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                });

                if (metadata) {
                    // 删除旧头像
                    if (cardData.avatarId) {
                        await fileManager.deleteFile(cardData.avatarId);
                    }
                    
                    // 更新为新的图片ID
                    await updateCardData({ 
                        avatarId: metadata.id,
                        avatarUrl: undefined
                    });
                }
            } catch (error) {
                console.error('Error processing image:', error);
                Alert.alert('错误', '处理图片失败，请重试');
            } finally {
                setUploadingAvatar(false);
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
                        // 删除文件系统中的图片
                        if (cardData.avatarId) {
                            await fileManager.deleteFile(cardData.avatarId);
                        }
                        // 清除数据
                        await updateCardData({ 
                            avatarId: undefined,
                            avatarUrl: undefined 
                        });
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
                            {cardData.avatarId ? (
                                <LazyImage 
                                    imageId={cardData.avatarId}
                                    useThumbnail={false}
                                    style={styles.avatar}
                                />
                            ) : cardData.avatarUrl ? (
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
                            {(cardData.avatarId || cardData.avatarUrl) && (
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
                            key={`main-${item.id}-${Math.random().toString(36).substr(2, 9)}`}
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
                            key={`need-${item.id}-${Math.random().toString(36).substr(2, 9)}`}
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
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    scrollContent: {
        padding: ThemeConfig.spacing.base,
    },
    card: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.lg,
        marginBottom: ThemeConfig.spacing.base,
        ...ThemeConfig.shadow.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: ThemeConfig.spacing.base,
    },
    sectionIcon: {
        marginRight: ThemeConfig.spacing.sm,
    },
    sectionHeaderText: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
    },
    inputField: {
        marginBottom: ThemeConfig.spacing.base,
    },
    inputLabel: {
        fontSize: ThemeConfig.fontSize.base - 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: ThemeConfig.spacing.sm,
    },
    input: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
        paddingHorizontal: ThemeConfig.spacing.md,
        paddingVertical: ThemeConfig.spacing.md,
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textPrimary,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    multilineInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    businessItemCard: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.md,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    businessItemName: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.sm,
        paddingVertical: ThemeConfig.spacing.xs,
    },
    businessItemDescription: {
        color: ThemeConfig.colors.textSecondary,
        fontSize: ThemeConfig.fontSize.base - 1,
        height: 48,
        lineHeight: 20,
        paddingTop: ThemeConfig.spacing.sm,
    },
    deleteButton: {
        alignSelf: 'flex-end',
        paddingVertical: ThemeConfig.spacing.xs,
        paddingHorizontal: ThemeConfig.spacing.md,
        marginTop: ThemeConfig.spacing.xs,
    },
    deleteButtonText: {
        color: ThemeConfig.colors.error,
        fontSize: ThemeConfig.fontSize.base - 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
    addButton: {
        paddingVertical: ThemeConfig.spacing.md,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    addButtonText: {
        color: ThemeConfig.colors.primary,
        fontWeight: ThemeConfig.fontWeight.semibold,
        fontSize: ThemeConfig.fontSize.base,
    },
    spacer: {
        height: ThemeConfig.spacing.lg,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: ThemeConfig.spacing.sm + 2,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: ThemeConfig.spacing.base,
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
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 60,
        borderWidth: ThemeConfig.borderWidth.base,
        borderColor: ThemeConfig.colors.border,
        borderStyle: 'dashed',
    },
    avatarOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingVertical: ThemeConfig.spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarActions: {
        flexDirection: 'row',
        gap: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.md,
    },
    avatarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: ThemeConfig.spacing.sm + 2,
        paddingHorizontal: ThemeConfig.spacing.base,
        backgroundColor: '#ede9fe',
        borderRadius: ThemeConfig.borderRadius.base,
    },
    removeButton: {
        backgroundColor: '#fee2e2',
    },
    avatarButtonText: {
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.primary,
    },
    removeButtonText: {
        color: ThemeConfig.colors.error,
    },
    avatarHint: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textTertiary,
        textAlign: 'center',
        lineHeight: 16,
    },
});

export default EditCardScreen;
