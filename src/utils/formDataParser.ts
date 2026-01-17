import { BusinessCardData, BusinessItem } from '../store/useCardStore';

/**
 * AI 助手返回的响应接口
 */
export interface AIAssistantResponse {
    output: string;           // AI 的文本回复
    formData?: Partial<BusinessCardData>;  // 表单数据（如果完成）
    completed: boolean;       // 是否完成信息收集
    sessionId: string;        // 会话 ID
}

/**
 * 解析 AI 助手的响应
 * 如果响应中包含 formData，则提取并验证
 */
export function parseAIResponse(response: any): AIAssistantResponse {
    let output = response.output || response.text || '';
    let formData = response.formData;
    let completed = response.completed || false;
    
    // 如果 formData 不存在，尝试从 output 文本中提取 JSON
    if (!formData && output) {
        const jsonMatch = output.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                formData = parsed.formData;
                completed = parsed.completed || completed;
                
                // 从 output 中移除 JSON 代码块
                output = output.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
            } catch (e) {
                console.warn('Failed to parse JSON from output:', e);
            }
        }
    }
    
    return {
        output,
        formData: formData || undefined,
        completed,
        sessionId: response.sessionId || '',
    };
}

/**
 * 验证表单数据的完整性
 * 返回缺失的必填字段列表
 */
export function validateFormData(formData: Partial<BusinessCardData>): string[] {
    const requiredFields = [
        'realName',
        'position',
        'companyName',
        'industry',
        'phone',
        'email',
        'address',
        'aboutMe',
        'hometown',
        'residence',
        'hobbies',
        'personality',
        'focusIndustry',
        'circles',
        'companyIntro',
    ];

    const missingFields: string[] = [];

    for (const field of requiredFields) {
        if (!formData[field as keyof BusinessCardData]) {
            missingFields.push(field);
        }
    }

    // 检查数组字段
    if (!formData.mainBusiness || formData.mainBusiness.length === 0) {
        missingFields.push('mainBusiness');
    }

    if (!formData.serviceNeeds || formData.serviceNeeds.length === 0) {
        missingFields.push('serviceNeeds');
    }

    return missingFields;
}

/**
 * 字段名称映射（用于显示）
 */
// 导入统一的字段名称配置
import { FIELD_DISPLAY_NAMES } from '../constants/fieldNames';

export const FIELD_NAMES = FIELD_DISPLAY_NAMES;

/**
 * 格式化缺失字段列表为可读文本
 */
export function formatMissingFields(missingFields: string[]): string {
    return missingFields.map(field => FIELD_NAMES[field] || field).join('、');
}

/**
 * 合并表单数据
 * 将 AI 返回的数据与现有数据合并，保留现有的非空值
 */
export function mergeFormData(
    existing: Partial<BusinessCardData>,
    newData: Partial<BusinessCardData>
): BusinessCardData {
    // 合并简单字段
    const merged = { ...existing };

    for (const key in newData) {
        const value = newData[key as keyof BusinessCardData];
        if (value !== undefined && value !== null && value !== '') {
            (merged as any)[key] = value;
        }
    }

    // 特殊处理数组字段
    if (newData.mainBusiness && newData.mainBusiness.length > 0) {
        merged.mainBusiness = newData.mainBusiness;
    }

    if (newData.serviceNeeds && newData.serviceNeeds.length > 0) {
        merged.serviceNeeds = newData.serviceNeeds;
    }

    if (newData.companyImages && newData.companyImages.length > 0) {
        merged.companyImages = newData.companyImages;
    }

    return merged as BusinessCardData;
}

/**
 * 从 AI 响应中提取 JSON 数据
 * 支持从 markdown 代码块中提取
 */
export function extractJSONFromText(text: string): any | null {
    // 尝试匹配 ```json ... ``` 格式
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[1]);
        } catch (e) {
            console.error('JSON 解析失败:', e);
        }
    }

    // 尝试匹配 { ... } 格式
    const objectMatch = text.match(/\{[\s\S]*\}/);
    
    if (objectMatch) {
        try {
            return JSON.parse(objectMatch[0]);
        } catch (e) {
            console.error('JSON 解析失败:', e);
        }
    }

    return null;
}

/**
 * 检查响应是否包含完整的表单数据
 */
export function hasCompleteFormData(response: AIAssistantResponse): boolean {
    if (!response.formData || !response.completed) {
        return false;
    }

    const missingFields = validateFormData(response.formData);
    return missingFields.length === 0;
}

/**
 * 生成表单数据摘要（用于确认）
 */
export function generateFormSummary(formData: Partial<BusinessCardData>): string {
    const sections: string[] = [];

    // 基本信息
    if (formData.realName || formData.position || formData.companyName) {
        sections.push(
            '【基本信息】\n' +
            `姓名：${formData.realName || '未填写'}\n` +
            `职位：${formData.position || '未填写'}\n` +
            `公司：${formData.companyName || '未填写'}\n` +
            `行业：${formData.industry || '未填写'}`
        );
    }

    // 联系方式
    if (formData.phone || formData.email || formData.wechat) {
        sections.push(
            '【联系方式】\n' +
            `电话：${formData.phone || '未填写'}\n` +
            `邮箱：${formData.email || '未填写'}\n` +
            `微信：${formData.wechat || '未填写'}\n` +
            `地址：${formData.address || '未填写'}`
        );
    }

    // 个人背景
    if (formData.aboutMe) {
        sections.push(
            '【个人简介】\n' +
            formData.aboutMe
        );
    }

    // 主营业务
    if (formData.mainBusiness && formData.mainBusiness.length > 0) {
        const businessList = formData.mainBusiness
            .map((b, i) => `${i + 1}. ${b.name}`)
            .join('\n');
        sections.push('【主营业务】\n' + businessList);
    }

    return sections.join('\n\n');
}
