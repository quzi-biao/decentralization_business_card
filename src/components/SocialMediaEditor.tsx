import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SocialMediaAccount } from '../store/useCardStore';
import { 
    SOCIAL_MEDIA_PLATFORMS, 
    SocialMediaPlatform,
    getPlatformName,
    getPlatformIcon,
    getPlatformColor,
    validateAccountId
} from '../utils/socialMediaLinks';
import { ThemeConfig } from '../constants/theme';

interface SocialMediaEditorProps {
    accounts: SocialMediaAccount[];
    onUpdate: (accounts: SocialMediaAccount[]) => void;
}

export const SocialMediaEditor: React.FC<SocialMediaEditorProps> = ({ accounts, onUpdate }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<SocialMediaAccount | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<SocialMediaPlatform>('weibo');
    const [accountId, setAccountId] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [customUrl, setCustomUrl] = useState('');

    const handleAdd = () => {
        setEditingAccount(null);
        setSelectedPlatform('weibo');
        setAccountId('');
        setDisplayName('');
        setCustomUrl('');
        setShowAddModal(true);
    };

    const handleEdit = (account: SocialMediaAccount) => {
        setEditingAccount(account);
        setSelectedPlatform(account.platform);
        setAccountId(account.accountId);
        setDisplayName(account.displayName || '');
        setCustomUrl(account.url || '');
        setShowAddModal(true);
    };

    const handleSave = () => {
        if (!accountId.trim()) {
            Alert.alert('提示', '请输入账号ID');
            return;
        }

        if (!validateAccountId(selectedPlatform, accountId)) {
            Alert.alert('提示', '账号ID格式不正确，请检查后重试');
            return;
        }

        const newAccount: SocialMediaAccount = {
            id: editingAccount?.id || Date.now().toString(),
            platform: selectedPlatform,
            accountId: accountId.trim(),
            displayName: displayName.trim() || undefined,
            url: customUrl.trim() || undefined,
        };

        if (editingAccount) {
            // 更新现有账号
            onUpdate(accounts.map(acc => acc.id === editingAccount.id ? newAccount : acc));
        } else {
            // 添加新账号
            onUpdate([...accounts, newAccount]);
        }

        setShowAddModal(false);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            '删除账号',
            '确定要删除这个社交媒体账号吗？',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: () => onUpdate(accounts.filter(acc => acc.id !== id))
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {accounts.map((account) => (
                <View key={account.id} style={styles.accountCard}>
                    <View style={styles.accountIcon}>
                        <MaterialIcons 
                            name={getPlatformIcon(account.platform)} 
                            size={24} 
                            color={getPlatformColor(account.platform)} 
                        />
                    </View>
                    <View style={styles.accountInfo}>
                        <Text style={styles.accountPlatform}>
                            {account.displayName || getPlatformName(account.platform)}
                        </Text>
                        <Text style={styles.accountId}>{account.accountId}</Text>
                    </View>
                    <View style={styles.accountActions}>
                        <TouchableOpacity onPress={() => handleEdit(account)} style={styles.actionButton}>
                            <MaterialIcons name="edit" size={20} color={ThemeConfig.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(account.id)} style={styles.actionButton}>
                            <MaterialIcons name="delete" size={20} color={ThemeConfig.colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                <MaterialIcons name="add" size={20} color={ThemeConfig.colors.primary} />
                <Text style={styles.addButtonText}>添加社交媒体账号</Text>
            </TouchableOpacity>

            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingAccount ? '编辑账号' : '添加账号'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <MaterialIcons name="close" size={24} color={ThemeConfig.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.label}>选择平台</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformList}>
                                {(Object.keys(SOCIAL_MEDIA_PLATFORMS) as SocialMediaPlatform[]).map((platform) => (
                                    <TouchableOpacity
                                        key={platform}
                                        style={[
                                            styles.platformItem,
                                            selectedPlatform === platform && styles.platformItemSelected
                                        ]}
                                        onPress={() => setSelectedPlatform(platform)}
                                    >
                                        <MaterialIcons 
                                            name={getPlatformIcon(platform)} 
                                            size={24} 
                                            color={selectedPlatform === platform ? ThemeConfig.colors.white : getPlatformColor(platform)} 
                                        />
                                        <Text style={[
                                            styles.platformName,
                                            selectedPlatform === platform && styles.platformNameSelected
                                        ]}>
                                            {getPlatformName(platform)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.label}>账号ID *</Text>
                            <TextInput
                                style={styles.input}
                                value={accountId}
                                onChangeText={setAccountId}
                                placeholder="请输入账号ID或用户名"
                                placeholderTextColor={ThemeConfig.colors.textTertiary}
                            />

                            <Text style={styles.label}>显示名称（可选）</Text>
                            <TextInput
                                style={styles.input}
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="自定义显示名称"
                                placeholderTextColor={ThemeConfig.colors.textTertiary}
                            />

                            <Text style={styles.label}>自定义链接（可选）</Text>
                            <TextInput
                                style={styles.input}
                                value={customUrl}
                                onChangeText={setCustomUrl}
                                placeholder="https://..."
                                placeholderTextColor={ThemeConfig.colors.textTertiary}
                                autoCapitalize="none"
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]} 
                                onPress={() => setShowAddModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>取消</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.saveButton]} 
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>保存</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: ThemeConfig.spacing.sm,
    },
    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.sm,
        borderWidth: 1,
        borderColor: ThemeConfig.colors.border,
    },
    accountIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: ThemeConfig.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: ThemeConfig.spacing.md,
    },
    accountInfo: {
        flex: 1,
    },
    accountPlatform: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: 2,
    },
    accountId: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textSecondary,
    },
    accountActions: {
        flexDirection: 'row',
        gap: ThemeConfig.spacing.sm,
    },
    actionButton: {
        padding: ThemeConfig.spacing.xs,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: ThemeConfig.spacing.md,
        borderRadius: ThemeConfig.borderRadius.md,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: ThemeConfig.colors.border,
        borderStyle: 'dashed',
        gap: ThemeConfig.spacing.sm,
    },
    addButtonText: {
        color: ThemeConfig.colors.primary,
        fontWeight: ThemeConfig.fontWeight.semibold,
        fontSize: ThemeConfig.fontSize.base,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: ThemeConfig.colors.background,
        borderTopLeftRadius: ThemeConfig.borderRadius.xl,
        borderTopRightRadius: ThemeConfig.borderRadius.xl,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: ThemeConfig.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: ThemeConfig.colors.border,
    },
    modalTitle: {
        fontSize: ThemeConfig.fontSize.xl,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
    },
    modalBody: {
        padding: ThemeConfig.spacing.lg,
    },
    label: {
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: ThemeConfig.spacing.sm,
        marginTop: ThemeConfig.spacing.md,
    },
    platformList: {
        marginBottom: ThemeConfig.spacing.md,
    },
    platformItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: ThemeConfig.spacing.md,
        paddingVertical: ThemeConfig.spacing.sm,
        marginRight: ThemeConfig.spacing.sm,
        borderRadius: ThemeConfig.borderRadius.md,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderWidth: 2,
        borderColor: 'transparent',
        minWidth: 80,
    },
    platformItemSelected: {
        backgroundColor: ThemeConfig.colors.primary,
        borderColor: ThemeConfig.colors.primary,
    },
    platformName: {
        fontSize: ThemeConfig.fontSize.xs,
        color: ThemeConfig.colors.textSecondary,
        marginTop: 4,
    },
    platformNameSelected: {
        color: ThemeConfig.colors.white,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
    input: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderRadius: ThemeConfig.borderRadius.md,
        paddingHorizontal: ThemeConfig.spacing.md,
        paddingVertical: ThemeConfig.spacing.md,
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textPrimary,
        borderWidth: 1,
        borderColor: ThemeConfig.colors.border,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: ThemeConfig.spacing.lg,
        gap: ThemeConfig.spacing.md,
        borderTopWidth: 1,
        borderTopColor: ThemeConfig.colors.border,
    },
    modalButton: {
        flex: 1,
        paddingVertical: ThemeConfig.spacing.md,
        borderRadius: ThemeConfig.borderRadius.md,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    cancelButtonText: {
        color: ThemeConfig.colors.textSecondary,
        fontWeight: ThemeConfig.fontWeight.semibold,
        fontSize: ThemeConfig.fontSize.md,
    },
    saveButton: {
        backgroundColor: ThemeConfig.colors.primary,
    },
    saveButtonText: {
        color: ThemeConfig.colors.white,
        fontWeight: ThemeConfig.fontWeight.semibold,
        fontSize: ThemeConfig.fontSize.md,
    },
});
