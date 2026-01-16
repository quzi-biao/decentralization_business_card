import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BusinessCardData } from '../store/useCardStore';
import { FIELD_METADATA, getCategories } from '../constants/fieldNames';
import { ThemeConfig } from '../constants/theme';

interface ProgressDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    cardData: BusinessCardData;
    progress: number;
    filledCount: number;
    totalCount: number;
}

const ProgressDetailsModal: React.FC<ProgressDetailsModalProps> = ({
    visible,
    onClose,
    cardData,
    progress,
    filledCount,
    totalCount
}) => {
    // 使用统一的字段元数据，只显示有分类信息的字段
    const fields = FIELD_METADATA.filter(f => f.category);

    // 获取所有分类
    const categories = getCategories();

    // 检查字段是否已填写
    const isFieldFilled = (key: string): boolean => {
        const value = (cardData as any)[key];
        return value !== undefined && value !== null && value.toString().trim() !== '';
    };

    // 计算每个类别的完成度
    const getCategoryProgress = (category: string) => {
        const categoryFields = fields.filter(f => f.category === category);
        const filledFields = categoryFields.filter(f => isFieldFilled(f.key));
        return {
            filled: filledFields.length,
            total: categoryFields.length,
            percentage: Math.round((filledFields.length / categoryFields.length) * 100)
        };
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* 头部 */}
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <MaterialIcons name="analytics" size={28} color={ThemeConfig.colors.primary} />
                        <Text style={styles.title}>完成度详情</Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <MaterialIcons name="close" size={24} color={ThemeConfig.colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {/* 总体进度卡片 */}
                    <View style={styles.overallCard}>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressNumber}>{progress}%</Text>
                        </View>
                        <View style={styles.overallInfo}>
                            <Text style={styles.overallTitle}>总体完成度</Text>
                            <Text style={styles.overallText}>
                                已填写 {filledCount} / {totalCount} 项
                            </Text>
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBar, { width: `${progress}%` }]} />
                            </View>
                        </View>
                    </View>

                    {/* 各类别详情 */}
                    {categories.map(category => {
                        const categoryFields = fields.filter(f => f.category === category);
                        const categoryProgress = getCategoryProgress(category);
                        
                        return (
                            <View key={category} style={styles.categoryCard}>
                                <View style={styles.categoryHeader}>
                                    <Text style={styles.categoryTitle}>{category}</Text>
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryBadgeText}>
                                            {categoryProgress.filled}/{categoryProgress.total}
                                        </Text>
                                    </View>
                                </View>
                                
                                <View style={styles.categoryProgressBar}>
                                    <View style={[
                                        styles.categoryProgressFill,
                                        { width: `${categoryProgress.percentage}%` }
                                    ]} />
                                </View>

                                <View style={styles.fieldsList}>
                                    {categoryFields.map(field => {
                                        const filled = isFieldFilled(field.key);
                                        return (
                                            <View key={field.key} style={styles.fieldItem}>
                                                <MaterialIcons 
                                                    name={filled ? "check-circle" : "radio-button-unchecked"}
                                                    size={20}
                                                    color={filled ? ThemeConfig.colors.success : ThemeConfig.colors.textDisabled}
                                                />
                                                <Text style={[
                                                    styles.fieldLabel,
                                                    filled && styles.fieldLabelFilled
                                                ]}>
                                                    {field.label}
                                                </Text>
                                                {filled && (
                                                    <View style={styles.filledBadge}>
                                                        <Text style={styles.filledBadgeText}>已填写</Text>
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}

                    {/* 提示信息 */}
                    <View style={styles.tipCard}>
                        <MaterialIcons name="lightbulb" size={20} color={ThemeConfig.colors.warning} />
                        <Text style={styles.tipText}>
                            完善名片信息可以提高名片质量评分，让您的名片更具吸引力
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: ThemeConfig.spacing.lg,
        paddingVertical: ThemeConfig.spacing.base,
        backgroundColor: ThemeConfig.colors.background,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.border,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: ThemeConfig.fontSize.xxl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
        marginLeft: ThemeConfig.spacing.md,
    },
    closeButton: {
        padding: ThemeConfig.spacing.xs,
    },
    content: {
        flex: 1,
        padding: ThemeConfig.spacing.base,
    },
    overallCard: {
        flexDirection: 'row',
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.lg,
        marginBottom: ThemeConfig.spacing.base,
        shadowColor: ThemeConfig.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    progressCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EEF2FF',
        borderWidth: 4,
        borderColor: ThemeConfig.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: ThemeConfig.spacing.base,
    },
    progressNumber: {
        fontSize: ThemeConfig.fontSize.xxxl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.primary,
    },
    overallInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    overallTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.xs,
    },
    overallText: {
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: ThemeConfig.spacing.sm,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: ThemeConfig.colors.border,
        borderRadius: ThemeConfig.borderRadius.sm,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: ThemeConfig.colors.primary,
        borderRadius: ThemeConfig.borderRadius.sm,
    },
    categoryCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.base,
        marginBottom: ThemeConfig.spacing.md,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: ThemeConfig.spacing.md,
    },
    categoryTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
    },
    categoryBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: ThemeConfig.spacing.sm,
        paddingVertical: ThemeConfig.spacing.xs,
        borderRadius: ThemeConfig.borderRadius.base,
    },
    categoryBadgeText: {
        fontSize: ThemeConfig.fontSize.sm,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.primary,
    },
    categoryProgressBar: {
        height: 6,
        backgroundColor: ThemeConfig.colors.border,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: ThemeConfig.spacing.md,
    },
    categoryProgressFill: {
        height: '100%',
        backgroundColor: ThemeConfig.colors.primary,
        borderRadius: 3,
    },
    fieldsList: {
        gap: ThemeConfig.spacing.sm,
    },
    fieldItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: ThemeConfig.spacing.sm,
    },
    fieldLabel: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textSecondary,
        marginLeft: ThemeConfig.spacing.sm,
    },
    fieldLabelFilled: {
        color: ThemeConfig.colors.textPrimary,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    filledBadge: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: ThemeConfig.spacing.sm,
        paddingVertical: 2,
        borderRadius: ThemeConfig.borderRadius.sm,
    },
    filledBadgeText: {
        fontSize: ThemeConfig.fontSize.xs,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.success,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        marginTop: ThemeConfig.spacing.sm,
        marginBottom: ThemeConfig.spacing.xxxl - 16,
    },
    tipText: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.base - 1,
        color: '#92400e',
        marginLeft: ThemeConfig.spacing.md,
        lineHeight: 18,
    },
});

export default ProgressDetailsModal;
