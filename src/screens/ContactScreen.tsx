import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import PageHeader from '../components/PageHeader';

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
                    backgroundColor="#f8fafc"
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroCard}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="email" size={48} color="#4F46E5" />
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
                            <MaterialIcons name="email" size={24} color="#4F46E5" />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>电子邮箱</Text>
                            <Text style={styles.contactValue}>{email}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={handleCopyEmail}
                    >
                        <MaterialIcons name="content-copy" size={20} color="#4F46E5" />
                        <Text style={styles.actionButtonText}>复制邮箱地址</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>常见咨询类型</Text>
                    
                    <View style={styles.typeCard}>
                        <MaterialIcons name="bug-report" size={20} color="#ef4444" />
                        <Text style={styles.typeText}>问题反馈与 Bug 报告</Text>
                    </View>

                    <View style={styles.typeCard}>
                        <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
                        <Text style={styles.typeText}>功能建议与改进意见</Text>
                    </View>

                    <View style={styles.typeCard}>
                        <MaterialIcons name="help" size={20} color="#10b981" />
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
                            <MaterialIcons name="check-circle" size={16} color="#10b981" />
                            <Text style={styles.tipText}>请在邮件主题中简要说明问题类型</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <MaterialIcons name="check-circle" size={16} color="#10b981" />
                            <Text style={styles.tipText}>详细描述您遇到的问题或建议</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <MaterialIcons name="check-circle" size={16} color="#10b981" />
                            <Text style={styles.tipText}>如有必要，请附上截图或错误信息</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <MaterialIcons name="check-circle" size={16} color="#10b981" />
                            <Text style={styles.tipText}>留下您的联系方式以便我们回复</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <MaterialIcons name="schedule" size={20} color="#64748b" />
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
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: 16,
    },
    heroCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#ede9fe',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
    },
    heroDescription: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
    },
    contactCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#ede9fe',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactContent: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 4,
    },
    contactValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    actionButton: {
        backgroundColor: '#ede9fe',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4F46E5',
    },
    typeCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    typeText: {
        fontSize: 14,
        color: '#475569',
    },
    tipsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
    infoCard: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    footerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 12,
        color: '#cbd5e1',
    },
});

export default ContactScreen;
