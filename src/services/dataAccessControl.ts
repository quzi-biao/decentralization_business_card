import AsyncStorage from '@react-native-async-storage/async-storage';

const VISIBILITY_KEY = 'card_field_visibility';
const PRIVACY_KEY = 'ai_privacy_fields';

/**
 * 名片字段定义
 */
export interface CardField {
    id: string;
    name: string;
    category: 'basic' | 'contact' | 'personal' | 'business' | 'media';
    isVisible: boolean; // 交换时是否可见
    isPrivate: boolean; // AI 是否使用虚拟值
}

/**
 * 默认字段配置
 */
export const DEFAULT_CARD_FIELDS: CardField[] = [
    // 基本信息
    { id: 'avatar', name: '头像', category: 'basic', isVisible: true, isPrivate: false },
    { id: 'realName', name: '姓名', category: 'basic', isVisible: true, isPrivate: true },
    { id: 'position', name: '职位', category: 'basic', isVisible: true, isPrivate: false },
    { id: 'companyName', name: '公司名称', category: 'basic', isVisible: true, isPrivate: false },
    { id: 'industry', name: '行业领域', category: 'basic', isVisible: true, isPrivate: false },
    
    // 联系方式
    { id: 'phone', name: '电话', category: 'contact', isVisible: true, isPrivate: true },
    { id: 'email', name: '邮箱', category: 'contact', isVisible: true, isPrivate: true },
    { id: 'wechat', name: '微信', category: 'contact', isVisible: true, isPrivate: true },
    { id: 'wechatQrCode', name: '微信二维码', category: 'contact', isVisible: true, isPrivate: false },
    { id: 'address', name: '地址', category: 'contact', isVisible: true, isPrivate: true },
    
    // 个人信息
    { id: 'aboutMe', name: '关于我', category: 'personal', isVisible: true, isPrivate: false },
    { id: 'hometown', name: '家乡', category: 'personal', isVisible: true, isPrivate: false },
    { id: 'residence', name: '常驻', category: 'personal', isVisible: true, isPrivate: false },
    { id: 'hobbies', name: '兴趣爱好', category: 'personal', isVisible: true, isPrivate: false },
    { id: 'personality', name: '性格特点', category: 'personal', isVisible: true, isPrivate: false },
    { id: 'focusIndustry', name: '关注行业', category: 'personal', isVisible: true, isPrivate: false },
    { id: 'circles', name: '加入的圈层', category: 'personal', isVisible: true, isPrivate: false },
    
    // 企业信息
    { id: 'companyIntro', name: '公司简介', category: 'business', isVisible: true, isPrivate: false },
    { id: 'mainBusiness', name: '主营业务', category: 'business', isVisible: true, isPrivate: false },
    { id: 'serviceNeeds', name: '服务需求', category: 'business', isVisible: true, isPrivate: false },
    { id: 'companyImages', name: '公司图片', category: 'business', isVisible: true, isPrivate: false },
    
    // 多媒体
    { id: 'introVideoUrl', name: '个人介绍视频', category: 'media', isVisible: true, isPrivate: false },
    { id: 'videoChannelId', name: '视频号ID', category: 'media', isVisible: true, isPrivate: false },
];

/**
 * 数据访问控制服务
 */
export class DataAccessControlService {
    /**
     * 加载字段可见性配置
     */
    static async loadFieldVisibility(): Promise<CardField[]> {
        try {
            const data = await AsyncStorage.getItem(VISIBILITY_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return DEFAULT_CARD_FIELDS;
        } catch (error) {
            console.error('Failed to load field visibility:', error);
            return DEFAULT_CARD_FIELDS;
        }
    }

    /**
     * 保存字段可见性配置
     */
    static async saveFieldVisibility(fields: CardField[]): Promise<void> {
        try {
            await AsyncStorage.setItem(VISIBILITY_KEY, JSON.stringify(fields));
        } catch (error) {
            console.error('Failed to save field visibility:', error);
        }
    }

    /**
     * 更新单个字段的可见性
     */
    static async updateFieldVisibility(fieldId: string, isVisible: boolean): Promise<void> {
        const fields = await this.loadFieldVisibility();
        const updatedFields = fields.map(field =>
            field.id === fieldId ? { ...field, isVisible } : field
        );
        await this.saveFieldVisibility(updatedFields);
    }

    /**
     * 更新单个字段的隐私设置
     */
    static async updateFieldPrivacy(fieldId: string, isPrivate: boolean): Promise<void> {
        const fields = await this.loadFieldVisibility();
        const updatedFields = fields.map(field =>
            field.id === fieldId ? { ...field, isPrivate } : field
        );
        await this.saveFieldVisibility(updatedFields);
    }

    /**
     * 根据可见性配置过滤名片数据（用于交换）
     */
    static async filterCardDataForExchange(cardData: any): Promise<any> {
        const fields = await this.loadFieldVisibility();
        const filtered: any = {};

        fields.forEach(field => {
            if (!field.isVisible) return;
            
            // 处理合并字段：avatar 控制 avatarId 和 avatarUrl
            if (field.id === 'avatar') {
                if (cardData.avatarId !== undefined) filtered.avatarId = cardData.avatarId;
                if (cardData.avatarUrl !== undefined) filtered.avatarUrl = cardData.avatarUrl;
            }
            // 处理合并字段：wechatQrCode 控制 wechatQrCodeId 和 wechatQrCode
            else if (field.id === 'wechatQrCode') {
                if (cardData.wechatQrCodeId !== undefined) filtered.wechatQrCodeId = cardData.wechatQrCodeId;
                if (cardData.wechatQrCode !== undefined) filtered.wechatQrCode = cardData.wechatQrCode;
            }
            // 处理合并字段：companyImages 控制 companyImageIds 和 companyImages
            else if (field.id === 'companyImages') {
                if (cardData.companyImageIds !== undefined) filtered.companyImageIds = cardData.companyImageIds;
                if (cardData.companyImages !== undefined) filtered.companyImages = cardData.companyImages;
            }
            // 普通字段直接复制
            else if (cardData[field.id] !== undefined) {
                filtered[field.id] = cardData[field.id];
            }
        });

        // 始终包含标签和主题色
        filtered.tags = cardData.tags || [];
        filtered.themeColor = cardData.themeColor || '#4F46E5';

        return filtered;
    }

    /**
     * 根据隐私配置处理 AI 数据（用于 AI 助手）
     */
    static async prepareCardDataForAI(cardData: any): Promise<any> {
        const fields = await this.loadFieldVisibility();
        const prepared: any = { ...cardData };

        fields.forEach(field => {
            if (field.isPrivate && prepared[field.id]) {
                // 使用虚拟值替换隐私字段
                prepared[field.id] = this.getVirtualValue(field.id, field.name);
            }
        });

        return prepared;
    }

    /**
     * 获取字段的虚拟值
     */
    private static getVirtualValue(fieldId: string, fieldName: string): string {
        const virtualValues: Record<string, string> = {
            realName: '张先生',
            phone: '138****8888',
            email: 'user@example.com',
            wechat: 'user_****',
            address: '北京市朝阳区'
        };

        return virtualValues[fieldId] || `[${fieldName}]`;
    }

    /**
     * 重置为默认配置
     */
    static async resetToDefault(): Promise<void> {
        await this.saveFieldVisibility(DEFAULT_CARD_FIELDS);
    }
}
