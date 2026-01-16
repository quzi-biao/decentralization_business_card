import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BusinessCardData } from '../store/useCardStore';
import { callN8NAgent } from '../services/n8nService';
import { N8N_CONFIG } from '../config/n8n.config';
import { EvaluationPersistenceService, EvaluationResult, EvaluationScore } from '../services/evaluationPersistence';
import { FIELD_METADATA } from '../constants/fieldNames';

interface CardEvaluationProps {
    cardData: BusinessCardData;
    sessionId: string;
    onEvaluationLoaded?: (evaluation: EvaluationResult | null) => void;
    autoEvaluate?: boolean; // 是否自动评分（首次加载时）
    visible?: boolean; // 控制弹窗显示
    onClose?: () => void; // 关闭弹窗回调
}

const CardEvaluation: React.FC<CardEvaluationProps> = ({ cardData, sessionId, onEvaluationLoaded, autoEvaluate = false, visible = false, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
    const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
    const [lastEvaluationTime, setLastEvaluationTime] = useState<number>(0);
    
    const EVALUATION_COOLDOWN = 60000; // 60秒冷却时间

    // 加载持久化的评分数据
    useEffect(() => {
        loadEvaluationFromStorage();
    }, []);

    // 从存储加载评分数据
    const loadEvaluationFromStorage = async () => {
        try {
            const savedEvaluation = await EvaluationPersistenceService.loadEvaluation();
            if (savedEvaluation) {
                setEvaluation(savedEvaluation);
                onEvaluationLoaded?.(savedEvaluation);
                console.log('✓ 已加载保存的评分数据');
            } else if (autoEvaluate) {
                // 如果没有评分数据且设置了自动评分，则自动获取评分
                console.log('未找到评分数据，自动获取评分...');
                await fetchEvaluation();
            } else {
                onEvaluationLoaded?.(null);
            }
            setHasLoadedFromStorage(true);
        } catch (error) {
            console.error('加载评分数据失败:', error);
            setHasLoadedFromStorage(true);
        }
    };

    // 构建名片信息文本
    const buildCardInfoText = (): string => {
        const info: string[] = [];
        
        FIELD_METADATA.forEach(field => {
            const value = (cardData as any)[field.key];
            
            // 跳过空值
            if (value === undefined || value === null || value === '') {
                return;
            }
            
            // 处理不同类型的字段值
            let displayValue: string;
            
            // 头像和二维码字段显示"已上传"
            if (['avatar', 'avatarId', 'avatarUrl', 'wechatQrCode', 'wechatQrCodeId'].includes(field.key)) {
                displayValue = '已上传';
            }
            // 数组类型字段（主营业务、服务需求）
            else if (Array.isArray(value)) {
                if (value.length === 0) return;
                displayValue = value.map(item => 
                    typeof item === 'object' && item.name ? item.name : String(item)
                ).join('、');
            }
            // 公司图片数组
            else if (field.key === 'companyImageIds' || field.key === 'companyImages') {
                if (Array.isArray(value) && value.length > 0) {
                    displayValue = `已上传 ${value.length} 张`;
                } else {
                    return;
                }
            }
            // 视频URL显示"已上传"
            else if (field.key === 'introVideoUrl') {
                displayValue = '已上传';
            }
            // 普通字段直接显示值
            else {
                displayValue = String(value).trim();
                if (!displayValue) return;
            }
            
            info.push(`${field.label}：${displayValue}`);
        });
        
        return info.join('\n');
    };

    // 获取评分
    const fetchEvaluation = async () => {
        // 检查冷却时间
        const now = Date.now();
        const timeSinceLastEvaluation = now - lastEvaluationTime;
        
        if (timeSinceLastEvaluation < EVALUATION_COOLDOWN) {
            const remainingSeconds = Math.ceil((EVALUATION_COOLDOWN - timeSinceLastEvaluation) / 1000);
            console.log(`评分接口冷却中，还需等待 ${remainingSeconds} 秒`);
            Alert.alert(
                '请稍候', 
                `评分功能需要间隔使用，请 ${remainingSeconds} 秒后再试`,
                [{ text: '确定' }]
            );
            return;
        }
        
        setLoading(true);
        setLastEvaluationTime(now);
        
        try {
            const cardInfoText = buildCardInfoText();
            const message = `请对以下名片内容进行评分：\n\n${cardInfoText}`;
            
            // 调用 n8n AI Agent，传递 evaluation="1" 参数
            const response = await callN8NAgent(
                N8N_CONFIG.agentWebhookPath,
                message,
                sessionId,
                false,
                undefined,
                "1" // 评分模式
            );
            
            // 检查返回是否为空
            if (!response.output || response.output.trim() === '') {
                console.warn('评分接口返回为空');
                Alert.alert(
                    '服务繁忙', 
                    '评分服务当前繁忙，请稍后再试',
                    [{ text: '确定' }]
                );
                return;
            }
            
            // 解析返回的 JSON 结果
            try {
                console.log('AI 响应:', response.output);
                
                // 尝试多种方式提取 JSON
                let jsonStr = null;
                
                // 方式1: 提取 ```json 代码块
                const jsonBlockMatch = response.output.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonBlockMatch) {
                    jsonStr = jsonBlockMatch[1];
                }
                
                // 方式2: 查找平衡的 JSON 对象（从第一个 { 开始）
                if (!jsonStr) {
                    const firstBraceIndex = response.output.indexOf('{');
                    if (firstBraceIndex >= 0) {
                        let braceCount = 0;
                        let inString = false;
                        let escapeNext = false;
                        
                        for (let i = firstBraceIndex; i < response.output.length; i++) {
                            const char = response.output[i];
                            
                            if (escapeNext) {
                                escapeNext = false;
                                continue;
                            }
                            
                            if (char === '\\') {
                                escapeNext = true;
                                continue;
                            }
                            
                            if (char === '"') {
                                inString = !inString;
                                continue;
                            }
                            
                            if (!inString) {
                                if (char === '{') {
                                    braceCount++;
                                } else if (char === '}') {
                                    braceCount--;
                                    if (braceCount === 0) {
                                        // 找到完整的 JSON 对象
                                        jsonStr = response.output.substring(firstBraceIndex, i + 1);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                
                if (jsonStr) {
                    const result = JSON.parse(jsonStr);
                    
                    // 验证结果格式
                    if (result.scores && result.totalScore !== undefined) {
                        setEvaluation(result);
                        // 保存到持久化存储
                        await EvaluationPersistenceService.saveEvaluation(result);
                        onEvaluationLoaded?.(result);
                    } else {
                        // 格式不完整，视为服务繁忙
                        console.warn('评分结果格式不完整');
                        Alert.alert(
                            '服务繁忙', 
                            '评分服务当前繁忙，请稍后再试',
                            [{ text: '确定' }]
                        );
                    }
                } else {
                    // 如果没有找到 JSON，视为服务繁忙
                    console.warn('未找到 JSON 格式的评分结果');
                    Alert.alert(
                        '服务繁忙', 
                        '评分服务当前繁忙，请稍后再试',
                        [{ text: '确定' }]
                    );
                }
            } catch (parseError) {
                console.error('解析评分结果失败:', parseError);
                console.error('原始响应:', response.output);
                Alert.alert(
                    '服务繁忙', 
                    '评分服务当前繁忙，请稍后再试',
                    [{ text: '确定' }]
                );
            }
        } catch (error) {
            console.error('获取评分失败:', error);
            Alert.alert('错误', '获取评分失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    // 当弹窗打开时，如果没有评分数据则自动获取
    useEffect(() => {
        if (visible && !evaluation && !loading && hasLoadedFromStorage) {
            fetchEvaluation();
        }
    }, [visible]);

    // 刷新评分
    const handleRefresh = async () => {
        console.log('手动刷新评分...');
        // 不立即清除评分数据，保留旧数据直到新数据成功返回
        await fetchEvaluation();
    };

    // 获取评级颜色
    const getRatingColor = (rating: string): string => {
        switch (rating) {
            case '优秀': return '#10b981';
            case '良好': return '#3b82f6';
            case '中等偏上': return '#8b5cf6';
            case '中等': return '#f59e0b';
            case '中等偏下': return '#f97316';
            default: return '#ef4444';
        }
    };

    // 获取分数颜色
    const getScoreColor = (score: number, maxScore: number): string => {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 90) return '#10b981';
        if (percentage >= 80) return '#3b82f6';
        if (percentage >= 70) return '#8b5cf6';
        if (percentage >= 60) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
                <View style={styles.modalContainer}>
                    {/* 头部 */}
                    <View style={styles.modalHeader}>
                        <View style={styles.modalTitleRow}>
                            <MaterialIcons name="assessment" size={28} color="#4F46E5" />
                            <Text style={styles.modalTitle}>名片评分</Text>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity 
                                style={styles.refreshButton}
                                onPress={handleRefresh}
                                disabled={loading}
                            >
                                <MaterialIcons 
                                    name="refresh" 
                                    size={24} 
                                    color={loading ? "#cbd5e1" : "#4F46E5"} 
                                />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.closeButton}
                                onPress={onClose}
                            >
                                <MaterialIcons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 内容 */}
                    <ScrollView style={styles.modalContent}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4F46E5" />
                                <Text style={styles.loadingText}>正在评分中...</Text>
                            </View>
                        ) : evaluation ? (
                            <>
                                {/* 总分卡片 */}
                                <View style={styles.totalScoreCard}>
                                    <Text style={styles.totalScoreLabel}>总分</Text>
                                    <Text style={[
                                        styles.totalScore,
                                        { color: getRatingColor(evaluation.rating) }
                                    ]}>
                                        {evaluation.totalScore}
                                    </Text>
                                    <Text style={styles.maxScore}>/ {evaluation.maxTotalScore}</Text>
                                    <View style={[
                                        styles.ratingBadge,
                                        { backgroundColor: getRatingColor(evaluation.rating) + '20' }
                                    ]}>
                                        <Text style={[
                                            styles.ratingText,
                                            { color: getRatingColor(evaluation.rating) }
                                        ]}>
                                            {evaluation.rating}
                                        </Text>
                                    </View>
                                </View>

                                {/* 总结 */}
                                <View style={styles.summaryCard}>
                                    <Text style={styles.summaryTitle}>综合评价</Text>
                                    <Text style={styles.summaryText}>{evaluation.summary}</Text>
                                </View>

                                {/* 各维度评分 */}
                                <View style={styles.scoresSection}>
                                    <Text style={styles.sectionTitle}>详细评分</Text>
                                    
                                    {Object.entries(evaluation.scores).map(([key, scoreData]) => {
                                        const labels: Record<string, string> = {
                                            completeness: '完整度',
                                            richness: '丰富度',
                                            attractiveness: '吸引力',
                                            professionalism: '专业度',
                                            languageStyle: '语言风格',
                                            socialValue: '社交价值'
                                        };
                                        
                                        return (
                                            <View key={key} style={styles.scoreItem}>
                                                <View style={styles.scoreHeader}>
                                                    <Text style={styles.scoreLabel}>{labels[key]}</Text>
                                                    <Text style={[
                                                        styles.scoreValue,
                                                        { color: getScoreColor(scoreData.score, scoreData.maxScore) }
                                                    ]}>
                                                        {scoreData.score}/{scoreData.maxScore}
                                                    </Text>
                                                </View>
                                                <View style={styles.progressBar}>
                                                    <View 
                                                        style={[
                                                            styles.progressFill,
                                                            { 
                                                                width: `${(scoreData.score / scoreData.maxScore) * 100}%`,
                                                                backgroundColor: getScoreColor(scoreData.score, scoreData.maxScore)
                                                            }
                                                        ]} 
                                                    />
                                                </View>
                                                <Text style={styles.scoreComment}>{scoreData.comment}</Text>
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* 优势 */}
                                {evaluation.strengths.length > 0 && (
                                    <View style={styles.listSection}>
                                        <View style={styles.listHeader}>
                                            <MaterialIcons name="thumb-up" size={18} color="#10b981" />
                                            <Text style={styles.listTitle}>优势</Text>
                                        </View>
                                        {evaluation.strengths.map((strength, index) => (
                                            <View key={index} style={styles.listItem}>
                                                <View style={[styles.listDot, { backgroundColor: '#10b981' }]} />
                                                <Text style={styles.listText}>{strength}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* 改进建议 */}
                                {evaluation.improvements.length > 0 && (
                                    <View style={styles.listSection}>
                                        <View style={styles.listHeader}>
                                            <MaterialIcons name="lightbulb" size={18} color="#f59e0b" />
                                            <Text style={styles.listTitle}>改进建议</Text>
                                        </View>
                                        {evaluation.improvements.map((improvement, index) => (
                                            <View key={index} style={styles.listItem}>
                                                <View style={[styles.listDot, { backgroundColor: '#f59e0b' }]} />
                                                <Text style={styles.listText}>{improvement}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <MaterialIcons name="assessment" size={64} color="#cbd5e1" />
                                <Text style={styles.emptyText}>暂无评分数据</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginLeft: 12,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    refreshButton: {
        padding: 4,
    },
    closeButton: {
        padding: 4,
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 16,
    },
    totalScoreCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    totalScoreLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    totalScore: {
        fontSize: 56,
        fontWeight: '700',
    },
    maxScore: {
        fontSize: 24,
        color: '#94a3b8',
        marginTop: -8,
    },
    ratingBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
    },
    summaryCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    scoresSection: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 16,
    },
    scoreItem: {
        marginBottom: 20,
    },
    scoreHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    scoreLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    scoreValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    scoreComment: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
    },
    listSection: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginLeft: 8,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    listDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6,
        marginRight: 8,
    },
    listText: {
        flex: 1,
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 16,
    },
});

export default CardEvaluation;
