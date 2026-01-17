/**
 * 统一的字段名称配置
 * 所有涉及字段显示名称的地方都应该使用这个配置
 */

/**
 * 字段元数据（包含分类信息）
 * 这是唯一的数据源，其他配置都从这里派生
 */
export interface FieldMetadata {
    key: string;
    label: string;
    category?: string; // 可选，用于需要分组显示的场景（如进度追踪）
    accessCategory?: string; // 可选，用于访问控制的分类（basic, contact, personal, business, media）
    getValue?: (data: any) => any; // 可选，用于从卡片数据中提取字段值
    isVisible?: boolean; // 可选，默认是否可见
    isPrivate?: boolean; // 可选，默认是否为隐私字段
}

export const FIELD_METADATA: FieldMetadata[] = [
    // 基础信息
    { key: 'avatar', label: '头像', accessCategory: 'basic', getValue: (d) => d.avatarId || d.avatarUrl, isVisible: true, isPrivate: false },
    { key: 'avatarId', label: '头像', getValue: (d) => d.avatarId },
    { key: 'avatarUrl', label: '头像', getValue: (d) => d.avatarUrl },
    { key: 'realName', label: '姓名', category: '基础信息', accessCategory: 'basic', getValue: (d) => d.realName, isVisible: true, isPrivate: false },
    { key: 'position', label: '职位', category: '基础信息', accessCategory: 'basic', getValue: (d) => d.position, isVisible: true, isPrivate: false },
    { key: 'companyName', label: '公司名称', category: '基础信息', accessCategory: 'basic', getValue: (d) => d.companyName, isVisible: true, isPrivate: false },
    { key: 'industry', label: '行业领域', category: '基础信息', accessCategory: 'basic', getValue: (d) => d.industry, isVisible: true, isPrivate: false },
    
    // 联系方式
    { key: 'phone', label: '电话', category: '联系方式', accessCategory: 'contact', getValue: (d) => d.phone, isVisible: true, isPrivate: false },
    { key: 'email', label: '邮箱', category: '联系方式', accessCategory: 'contact', getValue: (d) => d.email, isVisible: true, isPrivate: false },
    { key: 'wechat', label: '微信', category: '联系方式', accessCategory: 'contact', getValue: (d) => d.wechat, isVisible: true, isPrivate: false },
    { key: 'wechatQrCode', label: '微信二维码', accessCategory: 'contact', getValue: (d) => d.wechatQrCodeId || d.wechatQrCode, isVisible: true, isPrivate: false },
    { key: 'wechatQrCodeId', label: '微信二维码', getValue: (d) => d.wechatQrCodeId },
    { key: 'address', label: '地址', category: '联系方式', accessCategory: 'contact', getValue: (d) => d.address, isVisible: true, isPrivate: false },
    
    // 个人信息
    { key: 'aboutMe', label: '个人简介', category: '个人信息', accessCategory: 'personal', getValue: (d) => d.aboutMe, isVisible: true, isPrivate: false },
    { key: 'hometown', label: '家乡', category: '个人信息', accessCategory: 'personal', getValue: (d) => d.hometown, isVisible: true, isPrivate: false },
    { key: 'residence', label: '常驻', category: '个人信息', accessCategory: 'personal', getValue: (d) => d.residence, isVisible: true, isPrivate: false },
    { key: 'hobbies', label: '兴趣爱好', category: '个人信息', accessCategory: 'personal', getValue: (d) => d.hobbies, isVisible: true, isPrivate: false },
    { key: 'personality', label: '性格特点', category: '个人信息', accessCategory: 'personal', getValue: (d) => d.personality, isVisible: true, isPrivate: false },
    { key: 'focusIndustry', label: '关注行业', category: '个人信息', accessCategory: 'personal', getValue: (d) => d.focusIndustry, isVisible: true, isPrivate: false },
    { key: 'circles', label: '加入的圈层', category: '个人信息', accessCategory: 'personal', getValue: (d) => d.circles, isVisible: true, isPrivate: false },
    
    // 企业信息
    { key: 'companyIntro', label: '公司简介', category: '企业信息', accessCategory: 'business', getValue: (d) => d.companyIntro, isVisible: true, isPrivate: false },
    { key: 'mainBusiness', label: '主营业务', accessCategory: 'business', getValue: (d) => d.mainBusiness && d.mainBusiness.length > 0 ? d.mainBusiness.map((item: any) => item.name).join('、') : null, isVisible: true, isPrivate: false },
    { key: 'serviceNeeds', label: '服务需求', accessCategory: 'business', getValue: (d) => d.serviceNeeds && d.serviceNeeds.length > 0 ? d.serviceNeeds.map((item: any) => item.name).join('、') : null, isVisible: true, isPrivate: false },
    { key: 'companyImages', label: '公司图片', accessCategory: 'business', getValue: (d) => (d.companyImageIds && d.companyImageIds.length > 0) || (d.companyImages && d.companyImages.length > 0) ? '已上传' : null, isVisible: true, isPrivate: false },
    { key: 'companyImageIds', label: '公司图片', getValue: (d) => d.companyImageIds },
    
    // 多媒体
    { key: 'introVideoUrl', label: '个人介绍视频', accessCategory: 'media', getValue: (d) => d.introVideoUrl, isVisible: true, isPrivate: false },
    { key: 'videoChannelId', label: '视频号ID', accessCategory: 'media', getValue: (d) => d.videoChannelId, isVisible: true, isPrivate: false },
    
    // 社交媒体
    { key: 'socialMedia', label: '社交媒体账号', accessCategory: 'media', getValue: (d) => d.socialMedia && d.socialMedia.length > 0 ? `${d.socialMedia.length}个账号` : null, isVisible: true, isPrivate: false },
];

/**
 * 从 FIELD_METADATA 派生的字段显示名称映射
 * 用于快速查找字段的显示名称
 */
export const FIELD_DISPLAY_NAMES: Record<string, string> = FIELD_METADATA.reduce((acc, field) => {
    acc[field.key] = field.label;
    return acc;
}, {} as Record<string, string>);

/**
 * 获取字段显示名称
 * @param fieldId 字段ID
 * @param defaultName 默认名称（如果找不到配置）
 */
export const getFieldDisplayName = (fieldId: string, defaultName?: string): string => {
    return FIELD_DISPLAY_NAMES[fieldId] || defaultName || fieldId;
};

/**
 * 获取所有分类名称
 */
export const getCategories = (): string[] => {
    return Array.from(new Set(FIELD_METADATA.filter(f => f.category).map(f => f.category!)));
};
