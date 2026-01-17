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
import { SocialMediaEditor } from '../components/SocialMediaEditor';
import { ImageUploadGrid } from '../components/ImageUploadGrid';

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
    const [uploadingQrCode, setUploadingQrCode] = useState(false);

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
                    <InputField label="地址" value={cardData.address} onChangeText={(v: any) => updateCardData({ address: v })} placeholder="请输入地址" />
                    
                    {/* 微信二维码 */}
                    <View style={styles.qrCodeSection}>
                        <Text style={styles.inputLabel}>微信二维码</Text>
                        {cardData.wechatQrCodeId ? (
                            <View style={styles.qrCodeContainer}>
                                <LazyImage 
                                    imageId={cardData.wechatQrCodeId}
                                    useThumbnail={false}
                                    style={styles.qrCodeImage}
                                />
                                <TouchableOpacity 
                                    style={styles.removeQrButton}
                                    onPress={async () => {
                                        if (cardData.wechatQrCodeId) {
                                            await fileManager.deleteFile(cardData.wechatQrCodeId);
                                        }
                                        updateCardData({ wechatQrCodeId: undefined, wechatQrCode: undefined });
                                    }}
                                >
                                    <MaterialIcons name="close" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={styles.uploadQrButton}
                                onPress={async () => {
                                    try {
                                        setUploadingQrCode(true);
                                        const metadata = await fileManager.pickImage({
                                            context: 'card',
                                            allowsEditing: true,
                                            aspect: [1, 1],
                                            quality: 0.9,
                                        });
                                        if (metadata) {
                                            updateCardData({ wechatQrCodeId: metadata.id });
                                        }
                                    } catch (error) {
                                        Alert.alert('错误', '上传二维码失败');
                                    } finally {
                                        setUploadingQrCode(false);
                                    }
                                }}
                                disabled={uploadingQrCode}
                            >
                                <MaterialIcons name="qr-code" size={32} color={ThemeConfig.colors.textTertiary} />
                                <Text style={styles.uploadQrText}>
                                    {uploadingQrCode ? '上传中...' : '上传微信二维码'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* 个人背景 */}
                <View style={styles.card}>
                    <SectionHeader title="个人背景" iconName="person-outline" />
                    <InputField label="家乡" value={cardData.hometown} onChangeText={(v: any) => updateCardData({ hometown: v })} placeholder="如：浙江杭州" />
                    <InputField label="常驻" value={cardData.residence} onChangeText={(v: any) => updateCardData({ residence: v })} placeholder="如：北京朝阳" />
                    <InputField label="兴趣爱好" value={cardData.hobbies} onChangeText={(v: any) => updateCardData({ hobbies: v })} placeholder="如：阅读、跑步、摄影" />
                    <InputField label="性格特点" value={cardData.personality} onChangeText={(v: any) => updateCardData({ personality: v })} placeholder="如：务实、创新、善于沟通" />
                    <InputField label="关注行业" value={cardData.focusIndustry} onChangeText={(v: any) => updateCardData({ focusIndustry: v })} placeholder="如：人工智能、金融科技" />
                    <InputField label="加入的圈层" value={cardData.circles} onChangeText={(v: any) => updateCardData({ circles: v })} placeholder="如：清华校友会、AI产品经理社群" />
                </View>

                {/* 企业信息 */}
                <View style={styles.card}>
                    <SectionHeader title="企业信息" iconName="business" />
                    <InputField label="公司简介" value={cardData.companyIntro} onChangeText={(v: any) => updateCardData({ companyIntro: v })} placeholder="请输入公司简介" multiline={true} />
                    
                    {/* 企业图片 */}
                    <View style={styles.companyImagesSection}>
                        <Text style={styles.inputLabel}>公司图片</Text>
                        <ImageUploadGrid 
                            imageIds={cardData.companyImageIds || []}
                            onUpdate={(ids) => updateCardData({ companyImageIds: ids })}
                            maxImages={9}
                            title="公司图片"
                        />
                    </View>
                </View>

                {/* 社交媒体 */}
                <View style={styles.card}>
                    <SectionHeader title="社交媒体" iconName="share" />
                    <SocialMediaEditor 
                        accounts={cardData.socialMedia || []}
                        onUpdate={(accounts) => updateCardData({ socialMedia: accounts })}
                    />
                </View>

                {/* 多媒体 */}
                <View style={styles.card}>
                    <SectionHeader title="多媒体" iconName="video-library" />
                    <InputField label="个人介绍视频URL" value={cardData.introVideoUrl || ''} onChangeText={(v: any) => updateCardData({ introVideoUrl: v })} placeholder="https://..." />
                    <InputField label="视频号ID" value={cardData.videoChannelId || ''} onChangeText={(v: any) => updateCardData({ videoChannelId: v })} placeholder="请输入视频号ID" />
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
    qrCodeSection: {
        marginTop: ThemeConfig.spacing.md,
    },
    qrCodeContainer: {
        width: 150,
        height: 150,
        borderRadius: ThemeConfig.borderRadius.md,
        position: 'relative',
        overflow: 'hidden',
    },
    qrCodeImage: {
        width: '100%',
        height: '100%',
    },
    removeQrButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadQrButton: {
        width: 150,
        height: 150,
        borderRadius: ThemeConfig.borderRadius.md,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderWidth: 2,
        borderColor: ThemeConfig.colors.border,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadQrText: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textTertiary,
        marginTop: 8,
    },
    companyImagesSection: {
        marginTop: ThemeConfig.spacing.md,
    },
});

export default EditCardScreen;
