/**
 * 统一的字段名称配置
 * 所有涉及字段显示名称的地方都应该使用这个配置
 */

export const FIELD_DISPLAY_NAMES: Record<string, string> = {
    // 基本信息
    avatar: '头像',
    avatarId: '头像',
    avatarUrl: '头像',
    realName: '姓名',
    position: '职位',
    companyName: '公司名称',
    industry: '行业领域',
    
    // 联系方式
    phone: '电话',
    email: '邮箱',
    wechat: '微信',
    wechatQrCode: '微信二维码',
    wechatQrCodeId: '微信二维码',
    address: '地址',
    
    // 个人信息
    aboutMe: '个人简介',
    hometown: '家乡',
    residence: '常驻',
    hobbies: '兴趣爱好',
    personality: '性格特点',
    focusIndustry: '关注行业',
    circles: '加入的圈层',
    
    // 企业信息
    companyIntro: '公司简介',
    mainBusiness: '主营业务',
    serviceNeeds: '服务需求',
    companyImages: '公司图片',
    companyImageIds: '公司图片',
    
    // 多媒体
    introVideoUrl: '个人介绍视频',
    videoChannelId: '视频号ID',
};

/**
 * 获取字段显示名称
 * @param fieldId 字段ID
 * @param defaultName 默认名称（如果找不到配置）
 */
export const getFieldDisplayName = (fieldId: string, defaultName?: string): string => {
    return FIELD_DISPLAY_NAMES[fieldId] || defaultName || fieldId;
};
