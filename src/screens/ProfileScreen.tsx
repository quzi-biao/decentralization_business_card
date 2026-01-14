import React, { useState, useEffect } from 'react';
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
import * as Clipboard from 'expo-clipboard';

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

const ProfileScreen = ({ navigation, onEditPress }: Props) => {
    const { cardData, updateCardData, clearAllData } = useCardStore();
    const [showMnemonic, setShowMnemonic] = useState(false);
    const [showBackupRestore, setShowBackupRestore] = useState(false);
    const [showAccessControl, setShowAccessControl] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showFAQ, setShowFAQ] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const [showDataStats, setShowDataStats] = useState(false);
    const [showRevokeList, setShowRevokeList] = useState(false);
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
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* 我的名片 */}
            <View style={styles.profileHeader}>
                <MyCard 
                    cardData={cardData} 
                    onPress={handleCardPress}
                    onAIAssistantPress={() => (navigation as any).navigate('AIAssistant')}
                />
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
                    <TouchableOpacity style={styles.menuItem}>
                        <MaterialIcons name="file-upload" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>导出名片</Text>
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
                        <Text style={styles.menuText}>访问权限管理</Text>
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
                <View style={styles.section}>
                    <TouchableOpacity style={styles.menuItem}>
                        <MaterialIcons name="language" size={20} color="#64748b" style={styles.menuIcon} />
                        <Text style={styles.menuText}>语言选择</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                </View>

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
    // New styles for redesigned ProfileScreen
    profileHeader: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    myCardContainer: {
        marginBottom: 8,
    },
    myCardDisplay: {
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
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#4F46E5',
    },
    avatarLargeText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#4F46E5',
    },
    cardInfo: {
        flex: 1,
    },
    cardName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 6,
    },
    cardPosition: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 4,
        fontWeight: '500',
    },
    cardCompany: {
        fontSize: 15,
        color: '#94a3b8',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    menuIcon: {
        marginRight: 12,
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
    },
    menuArrow: {
        fontSize: 20,
        color: '#cbd5e1',
    },
    versionInfo: {
        paddingTop: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    versionText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    dataStatsContainer: {
        paddingBottom: 16,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dataStatsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
    },
    dataStatsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    dataStatItem: {
        alignItems: 'center',
    },
    dataStatValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#4F46E5',
        marginBottom: 4,
    },
    dataStatLabel: {
        fontSize: 11,
        color: '#64748b',
        textAlign: 'center',
    },
    publicKeyItem: {
        backgroundColor: '#ffffff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    publicKeyContent: {
        flex: 1,
    },
    publicKeyLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
        marginBottom: 4,
    },
    publicKeyText: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        color: '#94a3b8',
    },
    copyIconButton: {
        padding: 4,
    },
});

export default ProfileScreen;
