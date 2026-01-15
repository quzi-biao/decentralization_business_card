import AsyncStorage from '@react-native-async-storage/async-storage';

const EVALUATION_KEY = '@card_evaluation';

export interface EvaluationScore {
    score: number;
    maxScore: number;
    comment: string;
}

export interface EvaluationResult {
    scores: {
        completeness: EvaluationScore;
        richness: EvaluationScore;
        attractiveness: EvaluationScore;
        professionalism: EvaluationScore;
        languageStyle: EvaluationScore;
        socialValue: EvaluationScore;
    };
    totalScore: number;
    maxTotalScore: number;
    rating: string;
    summary: string;
    strengths: string[];
    improvements: string[];
    evaluatedAt: number; // 评分时间戳
}

/**
 * 评分数据持久化服务
 */
export class EvaluationPersistenceService {
    /**
     * 保存评分结果
     */
    static async saveEvaluation(evaluation: Omit<EvaluationResult, 'evaluatedAt'>): Promise<void> {
        try {
            const evaluationWithTimestamp: EvaluationResult = {
                ...evaluation,
                evaluatedAt: Date.now(),
            };
            await AsyncStorage.setItem(EVALUATION_KEY, JSON.stringify(evaluationWithTimestamp));
            console.log('✓ 评分数据已保存');
        } catch (error) {
            console.error('保存评分数据失败:', error);
            throw error;
        }
    }

    /**
     * 加载评分结果
     */
    static async loadEvaluation(): Promise<EvaluationResult | null> {
        try {
            const data = await AsyncStorage.getItem(EVALUATION_KEY);
            if (data) {
                const evaluation = JSON.parse(data) as EvaluationResult;
                console.log('✓ 评分数据已加载');
                return evaluation;
            }
            return null;
        } catch (error) {
            console.error('加载评分数据失败:', error);
            return null;
        }
    }

    /**
     * 清除评分结果
     */
    static async clearEvaluation(): Promise<void> {
        try {
            await AsyncStorage.removeItem(EVALUATION_KEY);
            console.log('✓ 评分数据已清除');
        } catch (error) {
            console.error('清除评分数据失败:', error);
            throw error;
        }
    }

    /**
     * 检查是否存在评分数据
     */
    static async hasEvaluation(): Promise<boolean> {
        try {
            const data = await AsyncStorage.getItem(EVALUATION_KEY);
            return data !== null;
        } catch (error) {
            console.error('检查评分数据失败:', error);
            return false;
        }
    }

    /**
     * 获取评分时间
     */
    static async getEvaluationTime(): Promise<number | null> {
        try {
            const evaluation = await this.loadEvaluation();
            return evaluation?.evaluatedAt || null;
        } catch (error) {
            console.error('获取评分时间失败:', error);
            return null;
        }
    }
}
