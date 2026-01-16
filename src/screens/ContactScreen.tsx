import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import PageHeader from '../components/PageHeader';
import { ThemeConfig } from '../constants/theme';

interface Props {
    onClose: () => void;
}

const ContactScreen: React.FC<Props> = ({ onClose }) => {
    const email = '0xnomeans@gmail.com';

    const handleEmailPress = async () => {
        try {
            const url = `mailto:${email}`;
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                Alert.alert('提示', '无法打开邮件应用，邮箱地址已复制到剪贴板');
                await Clipboard.setStringAsync(email);
            }
        } catch (error) {
            Alert.alert('提示', '邮箱地址已复制到剪贴板');
            await Clipboard.setStringAsync(email);
        }
    };

    const handleCopyEmail = async () => {
        await Clipboard.setStringAsync(email);
        Alert.alert('已复制', '邮箱地址已复制到剪贴板');
    };

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <PageHeader 
                    title="联系我们"
                    onBack={onClose}
                    backgroundColor={ThemeConfig.colors.backgroundSecondary}
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroCard}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="email" size={48} color={ThemeConfig.colors.primary} />
                    </View>
                    <Text style={styles.heroTitle}>我们随时为您服务</Text>
                    <Text style={styles.heroDescription}>
                        如果您有任何问题、建议或反馈，欢迎随时与我们联系。我们会尽快回复您的邮件。
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>联系方式</Text>
                    
                    <TouchableOpacity 
                        style={styles.contactCard}
                        onPress={handleEmailPress}
                        activeOpacity={0.7}
                    >
                        <View style={styles.contactIcon}>
                            <MaterialIcons name="email" size={24} color={ThemeConfig.colors.primary} />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>电子邮箱</Text>
                            <Text style={styles.contactValue}>{email}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={ThemeConfig.colors.textDisabled} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={handleCopyEmail}
                    >
                        <MaterialIcons name="content-copy" size={20} color={ThemeConfig.colors.primary} />
                        <Text style={styles.actionButtonText}>复制邮箱地址</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>常见咨询类型</Text>
                    
                    <View style={styles.typeCard}>
                        <MaterialIcons name="bug-report" size={20} color={ThemeConfig.colors.error} />
                        <Text style={styles.typeText}>问题反馈与 Bug 报告</Text>
                    </View>

                    <View style={styles.typeCard}>
                        <MaterialIcons name="lightbulb" size={20} color={ThemeConfig.colors.warning} />
                        <Text style={styles.typeText}>功能建议与改进意见</Text>
                    </View>

                    <View style={styles.typeCard}>
                        <MaterialIcons name="help" size={20} color={ThemeConfig.colors.success} />
                        <Text style={styles.typeText}>使用帮助与技术支持</Text>
                    </View>

                    <View style={styles.typeCard}>
                        <MaterialIcons name="business" size={20} color="#6366f1" />
                        <Text style={styles.typeText}>商务合作与咨询</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>邮件建议</Text>
                    <View style={styles.tipsCard}>
                        <View style={styles.tipItem}>
                            <MaterialIcons name="check-circle" size={16} color={ThemeConfig.colors.success} />
                            <Text style={styles.tipText}>请在邮件主题中简要说明问题类型</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <MaterialIcons name="check-circle" size={16} color={ThemeConfig.colors.success} />
                            <Text style={styles.tipText}>详细描述您遇到的问题或建议</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <MaterialIcons name="check-circle" size={16} color={ThemeConfig.colors.success} />
                            <Text style={styles.tipText}>如有必要，请附上截图或错误信息</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <MaterialIcons name="check-circle" size={16} color={ThemeConfig.colors.success} />
                            <Text style={styles.tipText}>留下您的联系方式以便我们回复</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <MaterialIcons name="schedule" size={20} color={ThemeConfig.colors.textSecondary} />
                    <Text style={styles.infoText}>
                        我们通常会在 24-48 小时内回复您的邮件。感谢您的耐心等待。
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>智能名片 v1.0.0</Text>
                    <Text style={styles.footerSubtext}>让商务社交更简单</Text>
                </View>
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
    heroCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.xxxl - 8,
        alignItems: 'center',
        marginBottom: ThemeConfig.spacing.xxxl - 16,
        ...ThemeConfig.shadow.md,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#ede9fe',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: ThemeConfig.spacing.lg,
    },
    heroTitle: {
        fontSize: ThemeConfig.fontSize.xxxl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.md,
    },
    heroDescription: {
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
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
    contactCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.md,
        ...ThemeConfig.shadow.sm,
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: ThemeConfig.borderRadius.md,
        backgroundColor: '#ede9fe',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactContent: {
        flex: 1,
    },
    contactLabel: {
        fontSize: ThemeConfig.fontSize.base - 1,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: ThemeConfig.spacing.xs,
    },
    contactValue: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
    },
    actionButton: {
        backgroundColor: '#ede9fe',
        borderRadius: ThemeConfig.borderRadius.md,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: ThemeConfig.spacing.sm,
    },
    actionButtonText: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.primary,
    },
    typeCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.sm,
    },
    typeText: {
        fontSize: ThemeConfig.fontSize.base,
        color: '#475569',
    },
    tipsCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        gap: ThemeConfig.spacing.md,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: ThemeConfig.spacing.sm,
    },
    tipText: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.base - 1,
        color: '#475569',
        lineHeight: 18,
    },
    infoCard: {
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        flexDirection: 'row',
        gap: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.xxxl - 16,
    },
    infoText: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.base - 1,
        color: '#475569',
        lineHeight: 18,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: ThemeConfig.spacing.xxxl - 16,
    },
    footerText: {
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textTertiary,
        marginBottom: ThemeConfig.spacing.xs,
    },
    footerSubtext: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textDisabled,
    },
});

export default ContactScreen;
