import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeConfig } from '../constants/theme';

interface PrivacyHelpModalProps {
    visible: boolean;
    onClose: () => void;
    onNavigateToSettings?: () => void;
}

/**
 * 隐私保护说明模态框
 * 显示默认隐私字段和工作原理
 */
const PrivacyHelpModal: React.FC<PrivacyHelpModalProps> = ({ visible, onClose, onNavigateToSettings }) => {
    const handleNavigateToSettings = () => {
        onClose();
        if (onNavigateToSettings) {
            onNavigateToSettings();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <MaterialIcons name="lock" size={24} color={ThemeConfig.colors.primary} />
                        <Text style={styles.modalTitle}>隐私保护说明</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <MaterialIcons name="close" size={24} color={ThemeConfig.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalText}>
                            为了保护您的隐私，某些敏感字段可以设置为"隐私内容"。设置为隐私内容后，AI 助手将无法看到这些字段的具体内容。
                        </Text>
                        
                        <Text style={styles.sectionTitle}>默认隐私字段</Text>
                        <View style={styles.fieldList}>
                            <View style={styles.fieldItem}>
                                <MaterialIcons name="person" size={16} color={ThemeConfig.colors.textSecondary} />
                                <Text style={styles.fieldText}>姓名</Text>
                            </View>
                            <View style={styles.fieldItem}>
                                <MaterialIcons name="phone" size={16} color={ThemeConfig.colors.textSecondary} />
                                <Text style={styles.fieldText}>电话</Text>
                            </View>
                            <View style={styles.fieldItem}>
                                <MaterialIcons name="email" size={16} color={ThemeConfig.colors.textSecondary} />
                                <Text style={styles.fieldText}>邮箱</Text>
                            </View>
                            <View style={styles.fieldItem}>
                                <MaterialIcons name="chat" size={16} color={ThemeConfig.colors.textSecondary} />
                                <Text style={styles.fieldText}>微信号</Text>
                            </View>
                            <View style={styles.fieldItem}>
                                <MaterialIcons name="location-on" size={16} color={ThemeConfig.colors.textSecondary} />
                                <Text style={styles.fieldText}>地址</Text>
                            </View>
                        </View>
                        
                        <Text style={styles.sectionTitle}>工作原理</Text>
                        <Text style={styles.modalText}>
                            • AI 助手仍然知道隐私字段是否已填写{'\n'}
                            • AI 助手看不到隐私字段的具体内容{'\n'}
                            • 隐私字段会显示为"[已填写，隐私内容]"
                        </Text>
                        
                        <View style={styles.instructionBox}>
                            <MaterialIcons name="info-outline" size={20} color={ThemeConfig.colors.primary} />
                            <Text style={styles.instructionText}>
                                如需自定义隐私设置，请前往底部导航栏的{' '}
                                <Text style={styles.boldText}>"我的"</Text> 标签页，点击{' '}
                                <Text style={styles.boldText}>"数据访问控制"</Text> 进行设置。
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: ThemeConfig.spacing.lg,
    },
    modalContent: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        shadowColor: ThemeConfig.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: ThemeConfig.spacing.lg,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.border,
        gap: ThemeConfig.spacing.md,
    },
    modalTitle: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.xl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
    },
    closeButton: {
        padding: ThemeConfig.spacing.xs,
    },
    modalBody: {
        padding: ThemeConfig.spacing.lg,
    },
    modalText: {
        fontSize: ThemeConfig.fontSize.base,
        lineHeight: 22,
        color: '#475569',
        marginBottom: ThemeConfig.spacing.base,
    },
    sectionTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginTop: ThemeConfig.spacing.sm,
        marginBottom: ThemeConfig.spacing.md,
    },
    fieldList: {
        gap: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.lg,
    },
    fieldItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.sm,
        paddingVertical: ThemeConfig.spacing.sm,
        paddingHorizontal: ThemeConfig.spacing.md,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderRadius: ThemeConfig.borderRadius.base,
    },
    fieldText: {
        fontSize: ThemeConfig.fontSize.base,
        color: '#475569',
    },
    instructionBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: ThemeConfig.spacing.md,
        backgroundColor: '#EEF2FF',
        padding: ThemeConfig.spacing.base,
        borderRadius: ThemeConfig.borderRadius.base,
        borderLeftWidth: 3,
        borderLeftColor: ThemeConfig.colors.primary,
        marginTop: ThemeConfig.spacing.sm,
    },
    instructionText: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.base,
        lineHeight: 20,
        color: '#475569',
    },
    boldText: {
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
    },
});

export default PrivacyHelpModal;
