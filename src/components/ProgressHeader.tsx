import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CardEvaluation from './CardEvaluation';
import { BusinessCardData } from '../store/useCardStore';
import { EvaluationResult } from '../services/evaluationPersistence';
import { ThemeConfig } from '../constants/theme';

interface ProgressHeaderProps {
    progress: number;
    filledCount: number;
    totalCount: number;
    onPress: () => void;
    cardData: BusinessCardData;
    sessionId: string;
    autoEvaluate?: boolean;
    onHelpPress?: () => void;
}

/**
 * 进度显示头部组件
 * 显示名片填写进度和质量评分
 */
const ProgressHeader: React.FC<ProgressHeaderProps> = ({
    progress,
    filledCount,
    totalCount,
    onPress,
    cardData,
    sessionId,
    autoEvaluate = false,
    onHelpPress
}) => {
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);

    // 获取评分颜色
    const getScoreColor = (score: number): string => {
        if (score >= 90) return ThemeConfig.colors.success; // 优秀 - 绿色
        if (score >= 80) return ThemeConfig.colors.info; // 良好 - 蓝色
        if (score >= 70) return '#8b5cf6'; // 中等偏上 - 紫色
        if (score >= 60) return ThemeConfig.colors.warning; // 中等 - 橙色
        if (score >= 50) return '#f97316'; // 中等偏下 - 深橙色
        return ThemeConfig.colors.error; // 不及格 - 红色
    };

    // 处理评分加载
    const handleEvaluationLoaded = (loadedEvaluation: EvaluationResult | null) => {
        setEvaluation(loadedEvaluation);
    };
    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <MaterialIcons name="smart-toy" size={24} color={ThemeConfig.colors.primary} />
                <Text style={styles.headerTitle}>AI 名片助手</Text>
                {onHelpPress && (
                    <TouchableOpacity 
                        onPress={onHelpPress}
                        style={styles.helpButton}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="help-outline" size={20} color={ThemeConfig.colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.headerRight}>
                <View style={styles.progressContainer}>
                    <TouchableOpacity 
                        style={styles.progressInfo}
                        onPress={onPress}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.progressText}>{progress}%</Text>
                        <Text style={styles.progressLabel}>完成度</Text>
                    </TouchableOpacity>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.scoreBadge,
                            { backgroundColor: getScoreColor(evaluation?.totalScore || 0) + '20' }
                        ]}
                        onPress={() => setShowEvaluationModal(true)}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons 
                            name="star" 
                            size={14} 
                            color={getScoreColor(evaluation?.totalScore || 0)} 
                        />
                        <Text style={[
                            styles.scoreText,
                            { color: getScoreColor(evaluation?.totalScore || 0) }
                        ]}>
                            {evaluation?.totalScore || 0}分
                        </Text>
                    </TouchableOpacity>
                </View>
                <CardEvaluation 
                    cardData={cardData} 
                    sessionId={sessionId}
                    onEvaluationLoaded={handleEvaluationLoaded}
                    autoEvaluate={autoEvaluate}
                    visible={showEvaluationModal}
                    onClose={() => setShowEvaluationModal(false)}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: ThemeConfig.spacing.lg,
        paddingVertical: ThemeConfig.spacing.base,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.md,
    },
    headerTitle: {
        fontSize: ThemeConfig.fontSize.xl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
        marginLeft: ThemeConfig.spacing.sm,
    },
    helpButton: {
        padding: ThemeConfig.spacing.xs,
        marginLeft: ThemeConfig.spacing.xs,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.md,
    },
    progressContainer: {
        alignItems: 'flex-end',
        gap: ThemeConfig.spacing.xs,
    },
    progressInfo: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: ThemeConfig.spacing.xs,
    },
    progressText: {
        fontSize: ThemeConfig.fontSize.xxl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.primary,
    },
    progressLabel: {
        fontSize: ThemeConfig.fontSize.xs,
        color: ThemeConfig.colors.textSecondary,
    },
    progressBarContainer: {
        width: 80,
        height: 4,
        backgroundColor: ThemeConfig.colors.border,
        borderRadius: ThemeConfig.borderRadius.sm,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: ThemeConfig.colors.primary,
        borderRadius: ThemeConfig.borderRadius.sm,
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: ThemeConfig.borderRadius.sm,
        marginTop: ThemeConfig.spacing.xs,
    },
    scoreText: {
        fontSize: ThemeConfig.fontSize.xs,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
});

export default ProgressHeader;
