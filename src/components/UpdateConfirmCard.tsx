import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FIELD_DISPLAY_NAMES } from '../constants/fieldNames';

interface UpdateConfirmCardProps {
    formData: any;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * 更新确认卡片组件
 * 显示AI提取的表单数据，等待用户确认
 */
const UpdateConfirmCard: React.FC<UpdateConfirmCardProps> = ({
    formData,
    onConfirm,
    onCancel
}) => {
    return (
        <View style={styles.updateCard}>
            <View style={styles.updateHeader}>
                <MaterialIcons name="edit" size={18} color="#4F46E5" />
                <Text style={styles.updateTitle}>请确认以下信息</Text>
            </View>
            {Object.entries(formData).map(([key, value]) => {
                if (value === undefined || value === null) return null;
                
                const fieldName = FIELD_DISPLAY_NAMES[key] || key;
                
                // 格式化数组类型的值
                let displayValue: string;
                if (Array.isArray(value)) {
                    displayValue = value.map(item => 
                        typeof item === 'object' && item.name ? item.name : String(item)
                    ).join('、');
                } else {
                    displayValue = String(value);
                }
                
                return (
                    <View key={key} style={styles.fieldItem}>
                        <Text style={styles.fieldLabel}>{fieldName}</Text>
                        <Text style={styles.fieldValue}>{displayValue}</Text>
                    </View>
                );
            })}
            <View style={styles.confirmButtons}>
                <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={onConfirm}
                >
                    <MaterialIcons name="check" size={18} color="#ffffff" />
                    <Text style={styles.confirmButtonText}>确认更新</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={onCancel}
                >
                    <MaterialIcons name="close" size={18} color="#64748b" />
                    <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    updateCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    updateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    updateTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4F46E5',
    },
    fieldItem: {
        marginBottom: 12,
    },
    fieldLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 4,
        fontWeight: '500',
    },
    fieldValue: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    confirmButtons: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 8,
    },
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    confirmButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    cancelButtonText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default UpdateConfirmCard;
