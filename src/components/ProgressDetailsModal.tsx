import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BusinessCardData } from '../store/useCardStore';
import { FIELD_METADATA, getCategories } from '../constants/fieldNames';

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
                        <MaterialIcons name="analytics" size={28} color="#4F46E5" />
                        <Text style={styles.title}>完成度详情</Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <MaterialIcons name="close" size={24} color="#64748b" />
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
                                                    color={filled ? "#10b981" : "#cbd5e1"}
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
                        <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
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
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginLeft: 12,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    overallCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#4F46E5',
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
        borderColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    progressNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#4F46E5',
    },
    overallInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    overallTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    overallText: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4F46E5',
        borderRadius: 4,
    },
    categoryCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    categoryBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
    },
    categoryProgressBar: {
        height: 6,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 12,
    },
    categoryProgressFill: {
        height: '100%',
        backgroundColor: '#4F46E5',
        borderRadius: 3,
    },
    fieldsList: {
        gap: 8,
    },
    fieldItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    fieldLabel: {
        flex: 1,
        fontSize: 14,
        color: '#64748b',
        marginLeft: 8,
    },
    fieldLabelFilled: {
        color: '#1e293b',
        fontWeight: '500',
    },
    filledBadge: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    filledBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#10b981',
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        marginBottom: 24,
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        color: '#92400e',
        marginLeft: 12,
        lineHeight: 18,
    },
});

export default ProgressDetailsModal;
