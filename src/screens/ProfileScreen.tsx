import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, LayoutAnimation, Platform, UIManager, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { useCardStore, BusinessItem } from '../store/useCardStore';
import MyCard from '../components/MyCard';
import { ProfileStackParamList } from '../navigation/ProfileStack';
import { DataManager } from '../services/dataManager';
import { getIdentity } from '../services/identityService';
import MnemonicScreen from './MnemonicScreen';
import BackupRestoreScreen from './BackupRestoreScreen';
import AccessControlScreen from './AccessControlScreen';
import TutorialScreen from './TutorialScreen';
import FAQScreen from './FAQScreen';
import ContactScreen from './ContactScreen';
import DataStatsScreen from './DataStatsScreen';
import RevokeListScreen from './RevokeListScreen';
import TagManagementScreen from './TagManagementScreen';
import * as Clipboard from 'expo-clipboard';
import { ThemeConfig } from '../constants/theme';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

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

type Props = StackScreenProps<ProfileStackParamList, 'ProfileMain'> & {
    onEditPress: () => void;
};

const ProfileScreen = ({ navigation, route, onEditPress }: Props) => {
    const { cardData, updateCardData, clearAllData } = useCardStore();
    const [showMnemonic, setShowMnemonic] = useState(false);
    const [showBackupRestore, setShowBackupRestore] = useState(false);
    const [showAccessControl, setShowAccessControl] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showFAQ, setShowFAQ] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const [showDataStats, setShowDataStats] = useState(false);
    const [showRevokeList, setShowRevokeList] = useState(false);
    const [showTagManagement, setShowTagManagement] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const cardRef = useRef<View>(null);
    const [publicKey, setPublicKey] = useState<string>('');
    const [dataStats, setDataStats] = useState({
        chatDates: 0,
        myCardExists: false,
        exchangedCardsCount: 0,
        avatarsCount: 0,
        imagesCount: 0
    });
    
    useEffect(() => {
        loadDataStats();
        loadIdentity();
    }, []);
    
    // Handle navigation parameter to open access control
    useEffect(() => {
        if (route?.params?.openAccessControl === true) {
            // Use setTimeout to ensure the screen is fully mounted
            setTimeout(() => {
                setShowAccessControl(true);
            }, 100);
            // Clear the parameter after opening
            try {
                navigation.setParams({ openAccessControl: undefined } as any);
            } catch (error) {
                console.log('Failed to clear navigation params:', error);
            }
        }
    }, [route?.params?.openAccessControl]);
    
    const loadIdentity = async () => {
        try {
            const identity = await getIdentity();
            if (identity) {
                setPublicKey(identity.publicKey);
            }
        } catch (error) {
            console.error('Failed to load identity:', error);
        }
    };
    
    const loadDataStats = async () => {
        try {
            const stats = await DataManager.getDataStats();
            setDataStats(stats);
        } catch (error) {
            console.error('Failed to load data stats:', error);
        }
    };
    
    const handleClearAllData = () => {
        Alert.alert(
            '清除所有数据',
            '此操作将删除所有聊天记录、名片数据和图片文件。此操作不可恢复，确定要继续吗？',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '确定清除',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await DataManager.clearAllData();
                            await clearAllData();
                            await loadDataStats();
                            Alert.alert('成功', '所有数据已清除');
                        } catch (error) {
                            Alert.alert('错误', '清除数据失败，请重试');
                        }
                    }
                }
            ]
        );
    };
    
    const handleCopyPublicKey = async () => {
        if (publicKey) {
            await Clipboard.setStringAsync(publicKey);
            Alert.alert('已复制', '公钥地址已复制到剪贴板');
        }
    };
    
    const handleCardPress = () => {
        navigation.navigate('CardDetail', { cardData });
    };

    const handleExportCard = async () => {
        if (!cardRef.current) {
            Alert.alert('错误', '名片组件未准备好');
            return;
        }

        try {
            setIsExporting(true);

            // 请求媒体库权限
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('权限不足', '需要相册权限才能保存图片');
                setIsExporting(false);
                return;
            }

            // 捕获名片视图为图片
            const uri = await captureRef(cardRef);

            // 保存到相册
            await MediaLibrary.saveToLibraryAsync(uri);

            // 询问是否分享
            Alert.alert(
                '导出成功',
                '名片已保存到相册，是否立即分享？',
                [
                    { text: '稍后分享', style: 'cancel' },
                    {
                        text: '立即分享',
                        onPress: async () => {
                            const isAvailable = await Sharing.isAvailableAsync();
                            if (isAvailable) {
                                await Sharing.shareAsync(uri, {
                                    mimeType: 'image/png',
                                    dialogTitle: '分享我的名片',
                                });
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('导出名片失败:', error);
            Alert.alert('导出失败', '无法导出名片图片，请重试');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* 我的名片 */}
            <View style={styles.profileHeader}>
                <View ref={cardRef} collapsable={false} style={{ backgroundColor: 'transparent' }}>
                    <MyCard 
                        cardData={cardData} 
                        onPress={handleCardPress}
                        onAIAssistantPress={() => (navigation as any).navigate('AIAssistant')}
                    />
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* 公钥地址 */}
                {publicKey && (
                    <View style={styles.section}>
                        <View style={styles.publicKeyItem}>
                            <MaterialIcons name="account-balance-wallet" size={20} color="#64748b" style={styles.menuIcon} />
                            <View style={styles.publicKeyContent}>
                                <Text style={styles.publicKeyLabel}>我的公钥地址</Text>
                                <Text style={styles.publicKeyText} numberOfLines={1} ellipsizeMode="middle">
                                    {publicKey}
                                </Text>
                            </View>
                            <TouchableOpacity 
                                onPress={handleCopyPublicKey}
                                style={styles.copyIconButton}
                            >
                                <MaterialIcons name="content-copy" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* 名片管理 */}
                <View style={styles.section}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={onEditPress}
                    >
                        <MaterialIcons name="edit" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>编辑我的名片</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <MaterialIcons name="palette" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>名片模板选择</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={handleExportCard}
                        disabled={isExporting}
                    >
                        <MaterialIcons name="file-upload" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>
                            {isExporting ? '导出中...' : '导出名片'}
                        </Text>
                        {!isExporting && <Text style={styles.menuArrow}>›</Text>}
                        {isExporting && (
                            <MaterialIcons name="hourglass-empty" size={20} color="#64748b" />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setShowTagManagement(true)}
                    >
                        <MaterialIcons name="label" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>标签管理</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* 安全中心 */}
                <View style={styles.section}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setShowMnemonic(true)}
                    >
                        <MaterialIcons name="vpn-key" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>查看助记词</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setShowBackupRestore(true)}
                    >
                        <MaterialIcons name="backup" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>备份与恢复</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setShowAccessControl(true)}
                    >
                        <MaterialIcons name="security" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>数据访问控制</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setShowRevokeList(true)}
                    >
                        <MaterialIcons name="block" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>撤销列表</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* 数据管理 */}
                <View style={styles.section}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setShowDataStats(true)}
                    >
                        <MaterialIcons name="analytics" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>数据统计</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* 设置 */}
                {/* <View style={styles.section}>
                    <TouchableOpacity style={styles.menuItem}>
                        <MaterialIcons name="language" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>语言选择</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                </View> */}

                {/* 关于 */}
                <View style={styles.section}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setShowTutorial(true)}
                    >
                        <MaterialIcons name="menu-book" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>使用教程</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setShowFAQ(true)}
                    >
                        <MaterialIcons name="help-outline" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>常见问题</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setShowContact(true)}
                    >
                        <MaterialIcons name="email" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>联系我们</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                    <View style={styles.versionInfo}>
                        <Text style={styles.versionText}>版本 v1.0.0</Text>
                    </View>
                </View>

                <View style={styles.spacer} />
            </ScrollView>

            {/* 所有模态框 */}
            <Modal
                visible={showMnemonic}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <MnemonicScreen onClose={() => setShowMnemonic(false)} />
            </Modal>

            <Modal
                visible={showBackupRestore}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <BackupRestoreScreen onClose={() => setShowBackupRestore(false)} />
            </Modal>

            <Modal
                visible={showAccessControl}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <AccessControlScreen onClose={() => setShowAccessControl(false)} />
            </Modal>

            <Modal
                visible={showTutorial}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <TutorialScreen onClose={() => setShowTutorial(false)} />
            </Modal>

            <Modal
                visible={showFAQ}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <FAQScreen onClose={() => setShowFAQ(false)} />
            </Modal>

            <Modal
                visible={showContact}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <ContactScreen onClose={() => setShowContact(false)} />
            </Modal>

            <Modal
                visible={showDataStats}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <DataStatsScreen onClose={() => setShowDataStats(false)} />
            </Modal>

            <Modal
                visible={showRevokeList}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <RevokeListScreen onClose={() => setShowRevokeList(false)} />
            </Modal>

            <Modal
                visible={showTagManagement}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <TagManagementScreen onClose={() => setShowTagManagement(false)} />
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ThemeConfig.spacing.base,
        paddingBottom: ThemeConfig.spacing.md,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.backgroundTertiary,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.sm,
    },
    sectionEmoji: {
        fontSize: ThemeConfig.fontSize.base,
    },
    addEmoji: {
        fontSize: ThemeConfig.fontSize.xs,
    },
    deleteEmoji: {
        fontSize: ThemeConfig.fontSize.base,
        opacity: 0.2,
    },
    sectionTitle: {
        color: '#475569',
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
    addButton: {
        backgroundColor: ThemeConfig.colors.border,
        paddingHorizontal: ThemeConfig.spacing.md,
        paddingVertical: 6,
        borderRadius: ThemeConfig.borderRadius.base,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addButtonText: {
        color: ThemeConfig.colors.textSecondary,
        fontSize: ThemeConfig.fontSize.sm,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
    inputField: {
        marginBottom: ThemeConfig.spacing.base,
    },
    inputLabel: {
        color: ThemeConfig.colors.textSecondary,
        fontSize: ThemeConfig.fontSize.sm,
        fontWeight: ThemeConfig.fontWeight.medium,
        marginLeft: 4,
        marginBottom: 6,
    },
    input: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
        paddingHorizontal: 14,
        paddingVertical: ThemeConfig.spacing.md,
        color: ThemeConfig.colors.textPrimary,
        fontSize: ThemeConfig.fontSize.base,
    },
    multilineInput: {
        height: 80,
        paddingTop: ThemeConfig.spacing.md,
    },
    businessItemCard: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: 14,
        marginBottom: ThemeConfig.spacing.md,
    },
    businessItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ThemeConfig.spacing.md,
    },
    businessItemName: {
        flex: 1,
        color: ThemeConfig.colors.textPrimary,
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.border,
        paddingVertical: 6,
        marginRight: ThemeConfig.spacing.base,
    },
    deleteButton: {
        padding: ThemeConfig.spacing.sm,
    },
    businessItemDescription: {
        color: ThemeConfig.colors.textSecondary,
        fontSize: ThemeConfig.fontSize.base - 1,
        height: 48,
        lineHeight: 20,
        paddingTop: ThemeConfig.spacing.sm,
    },
    saveButton: {
        marginTop: ThemeConfig.spacing.sm,
        backgroundColor: ThemeConfig.colors.textSecondary,
        paddingVertical: ThemeConfig.spacing.base,
        borderRadius: ThemeConfig.borderRadius.md,
        alignItems: 'center',
        ...ThemeConfig.shadow.sm,
    },
    saveButtonText: {
        color: ThemeConfig.colors.white,
        fontWeight: ThemeConfig.fontWeight.semibold,
        fontSize: ThemeConfig.fontSize.md,
    },
    spacer: {
        height: 80,
    },
    // New styles for redesigned ProfileScreen
    profileHeader: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        paddingHorizontal: ThemeConfig.spacing.base,
        paddingTop: ThemeConfig.spacing.base,
        paddingBottom: ThemeConfig.spacing.sm,
    },
    myCardContainer: {
        marginBottom: ThemeConfig.spacing.sm,
    },
    myCardDisplay: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.xxxl - 16,
        borderWidth: 3,
        borderColor: ThemeConfig.colors.primary,
        ...ThemeConfig.shadow.primary,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarLarge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#e0e7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: ThemeConfig.spacing.base,
        borderWidth: ThemeConfig.borderWidth.base,
        borderColor: ThemeConfig.colors.primary,
    },
    avatarLargeText: {
        fontSize: 28,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.primary,
    },
    cardInfo: {
        flex: 1,
    },
    cardName: {
        fontSize: 22,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: 6,
    },
    cardPosition: {
        fontSize: ThemeConfig.fontSize.lg,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: 4,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    cardCompany: {
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textTertiary,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.base,
        marginBottom: ThemeConfig.spacing.base,
        ...ThemeConfig.shadow.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: ThemeConfig.spacing.md,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.backgroundTertiary,
    },
    menuIcon: {
        marginRight: ThemeConfig.spacing.md,
    },
    menuText: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textPrimary,
    },
    menuArrow: {
        fontSize: ThemeConfig.fontSize.xxl,
        color: ThemeConfig.colors.textDisabled,
    },
    versionInfo: {
        paddingTop: ThemeConfig.spacing.md,
        alignItems: 'center',
        borderTopWidth: ThemeConfig.borderWidth.thin,
        borderTopColor: ThemeConfig.colors.backgroundTertiary,
    },
    versionText: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textTertiary,
    },
    dataStatsContainer: {
        paddingBottom: ThemeConfig.spacing.base,
        marginBottom: ThemeConfig.spacing.md,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.backgroundTertiary,
    },
    dataStatsTitle: {
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.md,
    },
    dataStatsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    dataStatItem: {
        alignItems: 'center',
    },
    dataStatValue: {
        fontSize: ThemeConfig.fontSize.xxxl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.primary,
        marginBottom: 4,
    },
    dataStatLabel: {
        fontSize: ThemeConfig.fontSize.xs,
        color: ThemeConfig.colors.textSecondary,
        textAlign: 'center',
    },
    publicKeyItem: {
        backgroundColor: ThemeConfig.colors.background,
        paddingVertical: ThemeConfig.spacing.md,
        paddingHorizontal: ThemeConfig.spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.backgroundTertiary,
    },
    publicKeyContent: {
        flex: 1,
    },
    publicKeyLabel: {
        fontSize: ThemeConfig.fontSize.base - 1,
        fontWeight: ThemeConfig.fontWeight.medium,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: 4,
    },
    publicKeyText: {
        fontSize: ThemeConfig.fontSize.sm,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        color: ThemeConfig.colors.textTertiary,
    },
    copyIconButton: {
        padding: 4,
    },
});

export default ProfileScreen;
