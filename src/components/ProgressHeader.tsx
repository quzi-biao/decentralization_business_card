import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CardEvaluation from './CardEvaluation';
import { BusinessCardData } from '../store/useCardStore';
import { EvaluationResult } from '../services/evaluationPersistence';

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
        if (score >= 90) return '#10b981'; // 优秀 - 绿色
        if (score >= 80) return '#3b82f6'; // 良好 - 蓝色
        if (score >= 70) return '#8b5cf6'; // 中等偏上 - 紫色
        if (score >= 60) return '#f59e0b'; // 中等 - 橙色
        if (score >= 50) return '#f97316'; // 中等偏下 - 深橙色
        return '#ef4444'; // 不及格 - 红色
    };

    // 处理评分加载
    const handleEvaluationLoaded = (loadedEvaluation: EvaluationResult | null) => {
        setEvaluation(loadedEvaluation);
    };
    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <MaterialIcons name="smart-toy" size={24} color="#4F46E5" />
                <Text style={styles.headerTitle}>AI 名片助手</Text>
                {onHelpPress && (
                    <TouchableOpacity 
                        onPress={onHelpPress}
                        style={styles.helpButton}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="help-outline" size={20} color="#64748b" />
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
                    {evaluation && (
                        <TouchableOpacity
                            style={[
                                styles.scoreBadge,
                                { backgroundColor: getScoreColor(evaluation.totalScore) + '20' }
                            ]}
                            onPress={() => setShowEvaluationModal(true)}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons 
                                name="star" 
                                size={14} 
                                color={getScoreColor(evaluation.totalScore)} 
                            />
                            <Text style={[
                                styles.scoreText,
                                { color: getScoreColor(evaluation.totalScore) }
                            ]}>
                                {evaluation.totalScore}分
                            </Text>
                        </TouchableOpacity>
                    )}
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginLeft: 8,
    },
    helpButton: {
        padding: 4,
        marginLeft: 4,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressContainer: {
        alignItems: 'flex-end',
        gap: 4,
    },
    progressInfo: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    progressText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#4F46E5',
    },
    progressLabel: {
        fontSize: 11,
        color: '#64748b',
    },
    progressBarContainer: {
        width: 80,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4F46E5',
        borderRadius: 2,
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    scoreText: {
        fontSize: 11,
        fontWeight: '600',
    },
});

export default ProgressHeader;
