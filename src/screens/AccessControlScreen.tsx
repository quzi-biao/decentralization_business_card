import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PageHeader from '../components/PageHeader';

interface Props {
    onClose: () => void;
}

interface AccessRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    icon: string;
}

const AccessControlScreen: React.FC<Props> = ({ onClose }) => {
    const [accessRules, setAccessRules] = useState<AccessRule[]>([
        {
            id: 'location',
            name: '位置信息',
            description: '允许访问您的位置信息用于附近名片交换',
            enabled: false,
            icon: 'location-on'
        },
        {
            id: 'camera',
            name: '相机权限',
            description: '用于扫描二维码和拍摄名片照片',
            enabled: true,
            icon: 'camera-alt'
        },
        {
            id: 'photos',
            name: '相册权限',
            description: '用于选择和保存名片图片',
            enabled: true,
            icon: 'photo-library'
        },
        {
            id: 'contacts',
            name: '通讯录',
            description: '用于导入联系人信息（可选）',
            enabled: false,
            icon: 'contacts'
        },
        {
            id: 'notifications',
            name: '通知权限',
            description: '接收名片交换和消息通知',
            enabled: true,
            icon: 'notifications'
        },
        {
            id: 'bluetooth',
            name: '蓝牙',
            description: '用于近场名片交换（NFC）',
            enabled: false,
            icon: 'bluetooth'
        }
    ]);

    const toggleRule = (id: string) => {
        setAccessRules(prev => 
            prev.map(rule => 
                rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
            )
        );
    };

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <PageHeader 
                    title="访问权限管理"
                    onBack={onClose}
                    backgroundColor="#f8fafc"
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.infoCard}>
                    <MaterialIcons name="security" size={24} color="#4F46E5" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>隐私保护</Text>
                        <Text style={styles.infoText}>
                            您可以随时控制应用的访问权限。关闭某些权限可能会影响部分功能的使用。
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>系统权限</Text>
                    {accessRules.map(rule => (
                        <View key={rule.id} style={styles.ruleCard}>
                            <View style={styles.ruleIcon}>
                                <MaterialIcons 
                                    name={rule.icon as any} 
                                    size={24} 
                                    color={rule.enabled ? '#4F46E5' : '#94a3b8'} 
                                />
                            </View>
                            <View style={styles.ruleContent}>
                                <Text style={styles.ruleName}>{rule.name}</Text>
                                <Text style={styles.ruleDescription}>{rule.description}</Text>
                            </View>
                            <Switch
                                value={rule.enabled}
                                onValueChange={() => toggleRule(rule.id)}
                                trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
                                thumbColor={rule.enabled ? '#4F46E5' : '#f1f5f9'}
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>数据访问控制</Text>
                    
                    <TouchableOpacity style={styles.actionCard}>
                        <View style={styles.actionLeft}>
                            <MaterialIcons name="visibility" size={20} color="#64748b" />
                            <Text style={styles.actionText}>名片可见性设置</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={styles.actionLeft}>
                            <MaterialIcons name="lock" size={20} color="#64748b" />
                            <Text style={styles.actionText}>隐私字段管理</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={styles.actionLeft}>
                            <MaterialIcons name="block" size={20} color="#64748b" />
                            <Text style={styles.actionText}>黑名单管理</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>

                <View style={styles.warningCard}>
                    <MaterialIcons name="info" size={20} color="#64748b" />
                    <Text style={styles.warningText}>
                        某些权限需要在系统设置中开启。如果无法切换，请前往系统设置 → 应用权限进行配置。
                    </Text>
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
    infoCard: {
        backgroundColor: '#ede9fe',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#6366f1',
        lineHeight: 18,
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
    ruleCard: {
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
    ruleIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ruleContent: {
        flex: 1,
    },
    ruleName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    ruleDescription: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
    },
    actionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionText: {
        fontSize: 15,
        color: '#1e293b',
    },
    warningCard: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
});

export default AccessControlScreen;
