import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PageHeader from '../components/PageHeader';
import { DataAccessControlService, CardField } from '../services/dataAccessControl';
import { ThemeConfig } from '../constants/theme';

interface Props {
    onClose: () => void;
}

type ViewMode = 'main' | 'visibility' | 'privacy';

const CATEGORY_NAMES: Record<string, string> = {
    basic: '基本信息',
    contact: '联系方式',
    personal: '个人信息',
    business: '企业信息',
    media: '多媒体'
};

const AccessControlScreen: React.FC<Props> = ({ onClose }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('main');
    const [fields, setFields] = useState<CardField[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        setLoading(true);
        const loadedFields = await DataAccessControlService.loadFieldVisibility();
        setFields(loadedFields);
        setLoading(false);
    };

    const toggleFieldVisibility = async (fieldId: string) => {
        const field = fields.find(f => f.id === fieldId);
        if (!field) return;

        await DataAccessControlService.updateFieldVisibility(fieldId, !field.isVisible);
        await loadFields();
    };

    const toggleFieldPrivacy = async (fieldId: string) => {
        const field = fields.find(f => f.id === fieldId);
        if (!field) return;

        await DataAccessControlService.updateFieldPrivacy(fieldId, !field.isPrivate);
        await loadFields();
    };

    const handleResetToDefault = () => {
        Alert.alert(
            '重置配置',
            '确定要重置为默认配置吗？',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '重置',
                    style: 'destructive',
                    onPress: async () => {
                        await DataAccessControlService.resetToDefault();
                        await loadFields();
                        Alert.alert('成功', '已重置为默认配置');
                    }
                }
            ]
        );
    };

    const getFieldsByCategory = (category: string) => {
        return fields.filter(f => f.category === category);
    };

    const renderMainView = () => (
        <>
            <View style={styles.infoCard}>
                <MaterialIcons name="security" size={24} color="#4F46E5" />
                <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>数据访问控制</Text>
                    <Text style={styles.infoText}>
                        控制名片交换时的字段可见性，以及 AI 助手访问时的隐私保护。
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <TouchableOpacity 
                    style={styles.actionCard}
                    onPress={() => setViewMode('visibility')}
                >
                    <View style={styles.actionLeft}>
                        <MaterialIcons name="visibility" size={20} color="#64748b" />
                        <Text style={styles.actionText}>名片可见性设置</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
                </TouchableOpacity>
                <Text style={styles.actionHint}>
                    控制名片交换时哪些字段会被分享给对方
                </Text>

                <TouchableOpacity 
                    style={styles.actionCard}
                    onPress={() => setViewMode('privacy')}
                >
                    <View style={styles.actionLeft}>
                        <MaterialIcons name="lock" size={20} color="#64748b" />
                        <Text style={styles.actionText}>隐私字段管理</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
                </TouchableOpacity>
                <Text style={styles.actionHint}>
                    设置 AI 助手使用虚拟值的字段（默认：姓名和联系方式）
                </Text>
            </View>

            <TouchableOpacity 
                style={styles.resetButton}
                onPress={handleResetToDefault}
            >
                <MaterialIcons name="refresh" size={20} color="#64748b" />
                <Text style={styles.resetButtonText}>重置为默认配置</Text>
            </TouchableOpacity>
        </>
    );

    const renderVisibilityView = () => (
        <>
            <View style={styles.infoCard}>
                <MaterialIcons name="visibility" size={24} color="#4F46E5" />
                <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>名片可见性设置</Text>
                    <Text style={styles.infoText}>
                        关闭的字段在交换名片时不会被分享。默认所有字段都开启。
                    </Text>
                </View>
            </View>

            {Object.keys(CATEGORY_NAMES).map(category => {
                const categoryFields = getFieldsByCategory(category);
                if (categoryFields.length === 0) return null;

                return (
                    <View key={category} style={styles.section}>
                        <Text style={styles.sectionTitle}>{CATEGORY_NAMES[category]}</Text>
                        {categoryFields.map(field => (
                            <View key={field.id} style={styles.fieldCard}>
                                <Text style={styles.fieldName}>{field.name}</Text>
                                <Switch
                                    value={field.isVisible}
                                    onValueChange={() => toggleFieldVisibility(field.id)}
                                    trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
                                    thumbColor={field.isVisible ? '#4F46E5' : '#f1f5f9'}
                                />
                            </View>
                        ))}
                    </View>
                );
            })}
        </>
    );

    const renderPrivacyView = () => (
        <>
            <View style={styles.infoCard}>
                <MaterialIcons name="lock" size={24} color="#4F46E5" />
                <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>隐私字段管理</Text>
                    <Text style={styles.infoText}>
                        开启的字段在使用 AI 助手时会使用虚拟值代替真实值，保护您的隐私。
                    </Text>
                </View>
            </View>

            {Object.keys(CATEGORY_NAMES).map(category => {
                const categoryFields = getFieldsByCategory(category);
                if (categoryFields.length === 0) return null;

                return (
                    <View key={category} style={styles.section}>
                        <Text style={styles.sectionTitle}>{CATEGORY_NAMES[category]}</Text>
                        {categoryFields.map(field => (
                            <View key={field.id} style={styles.fieldCard}>
                                <Text style={styles.fieldName}>{field.name}</Text>
                                <Switch
                                    value={field.isPrivate}
                                    onValueChange={() => toggleFieldPrivacy(field.id)}
                                    trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
                                    thumbColor={field.isPrivate ? '#4F46E5' : '#f1f5f9'}
                                />
                            </View>
                        ))}
                    </View>
                );
            })}
        </>
    );

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <PageHeader 
                    title={viewMode === 'main' ? '数据访问控制' : viewMode === 'visibility' ? '名片可见性设置' : '隐私字段管理'}
                    onBack={viewMode === 'main' ? onClose : () => setViewMode('main')}
                    backgroundColor="#f8fafc"
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>加载中...</Text>
                        </View>
                    ) : (
                        <>
                            {viewMode === 'main' && renderMainView()}
                            {viewMode === 'visibility' && renderVisibilityView()}
                            {viewMode === 'privacy' && renderPrivacyView()}
                        </>
                    )}
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
    loadingContainer: {
        padding: ThemeConfig.spacing.xxxl,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textSecondary,
    },
    infoCard: {
        backgroundColor: '#ede9fe',
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        flexDirection: 'row',
        gap: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.xxxl - 16,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.primary,
        marginBottom: ThemeConfig.spacing.xs,
    },
    infoText: {
        fontSize: ThemeConfig.fontSize.base - 1,
        color: '#6366f1',
        lineHeight: 18,
    },
    section: {
        marginBottom: ThemeConfig.spacing.xxxl - 16,
    },
    sectionTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.md,
    },
    actionCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: ThemeConfig.spacing.sm,
        ...ThemeConfig.shadow.sm,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.md,
    },
    actionText: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.medium,
        color: ThemeConfig.colors.textPrimary,
    },
    actionHint: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: ThemeConfig.spacing.base,
        marginLeft: ThemeConfig.spacing.xs,
    },
    fieldCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: ThemeConfig.spacing.sm,
        ...ThemeConfig.shadow.sm,
    },
    fieldName: {
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textPrimary,
    },
    resetButton: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ThemeConfig.spacing.sm,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    resetButtonText: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.medium,
        color: ThemeConfig.colors.textSecondary,
    },
});

export default AccessControlScreen;
