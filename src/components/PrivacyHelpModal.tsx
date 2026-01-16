import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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
                        <MaterialIcons name="lock" size={24} color="#4F46E5" />
                        <Text style={styles.modalTitle}>隐私保护说明</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <MaterialIcons name="close" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalText}>
                            为了保护您的隐私，某些敏感字段可以设置为"隐私内容"。设置为隐私内容后，AI 助手将无法看到这些字段的具体内容。
                        </Text>
                        
                        <Text style={styles.sectionTitle}>默认隐私字段</Text>
                        <View style={styles.fieldList}>
                            <View style={styles.fieldItem}>
                                <MaterialIcons name="person" size={16} color="#64748b" />
                                <Text style={styles.fieldText}>姓名</Text>
                            </View>
                            <View style={styles.fieldItem}>
                                <MaterialIcons name="phone" size={16} color="#64748b" />
                                <Text style={styles.fieldText}>电话</Text>
                            </View>
                            <View style={styles.fieldItem}>
                                <MaterialIcons name="email" size={16} color="#64748b" />
                                <Text style={styles.fieldText}>邮箱</Text>
                            </View>
                            <View style={styles.fieldItem}>
                                <MaterialIcons name="chat" size={16} color="#64748b" />
                                <Text style={styles.fieldText}>微信号</Text>
                            </View>
                            <View style={styles.fieldItem}>
                                <MaterialIcons name="location-on" size={16} color="#64748b" />
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
                            <MaterialIcons name="info-outline" size={20} color="#4F46E5" />
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        gap: 12,
    },
    modalTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },
    modalText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#475569',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginTop: 8,
        marginBottom: 12,
    },
    fieldList: {
        gap: 12,
        marginBottom: 20,
    },
    fieldItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
    },
    fieldText: {
        fontSize: 14,
        color: '#475569',
    },
    instructionBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: '#EEF2FF',
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#4F46E5',
        marginTop: 8,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        color: '#475569',
    },
    boldText: {
        fontWeight: '700',
        color: '#1e293b',
    },
});

export default PrivacyHelpModal;
