import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FIELD_DISPLAY_NAMES } from '../constants/fieldNames';
import { ThemeConfig } from '../constants/theme';

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
                <MaterialIcons name="edit" size={18} color={ThemeConfig.colors.primary} />
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
                    <MaterialIcons name="check" size={18} color={ThemeConfig.colors.white} />
                    <Text style={styles.confirmButtonText}>确认更新</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={onCancel}
                >
                    <MaterialIcons name="close" size={18} color={ThemeConfig.colors.textSecondary} />
                    <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    updateCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        width: '100%',
        shadowColor: ThemeConfig.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    updateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.sm,
        marginBottom: ThemeConfig.spacing.md,
        paddingBottom: ThemeConfig.spacing.md,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.borderLight,
    },
    updateTitle: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.primary,
    },
    fieldItem: {
        marginBottom: ThemeConfig.spacing.md,
    },
    fieldLabel: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: ThemeConfig.spacing.xs,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    fieldValue: {
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textPrimary,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    confirmButtons: {
        flexDirection: 'row',
        marginTop: ThemeConfig.spacing.xs,
        gap: ThemeConfig.spacing.sm,
    },
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ThemeConfig.colors.primary,
        paddingHorizontal: ThemeConfig.spacing.base,
        paddingVertical: ThemeConfig.spacing.sm + 2,
        borderRadius: ThemeConfig.borderRadius.base,
        gap: 6,
    },
    confirmButtonText: {
        color: ThemeConfig.colors.white,
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
        paddingHorizontal: ThemeConfig.spacing.base,
        paddingVertical: ThemeConfig.spacing.sm + 2,
        borderRadius: ThemeConfig.borderRadius.base,
        gap: 6,
    },
    cancelButtonText: {
        color: ThemeConfig.colors.textSecondary,
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
});

export default UpdateConfirmCard;
