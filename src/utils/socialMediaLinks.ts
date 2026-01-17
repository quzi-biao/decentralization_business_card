/**
 * 社交媒体链接生成工具
 * 根据平台类型和账号ID生成对应的链接
 */

export type SocialMediaPlatform = 
    | 'weibo' 
    | 'wechatChannel' 
    | 'douyin' 
    | 'xiaohongshu' 
    | 'wechatOfficialAccount' 
    | 'yuque' 
    | 'twitter' 
    | 'telegram' 
    | 'discord' 
    | 'facebook' 
    | 'linkedin' 
    | 'instagram' 
    | 'youtube';

/**
 * 社交媒体平台配置
 */
export const SOCIAL_MEDIA_PLATFORMS: Record<SocialMediaPlatform, {
    name: string;
    icon: string;  // MaterialIcons 图标名称
    color: string;  // 品牌色
    urlTemplate?: string;  // URL 模板，{accountId} 会被替换为实际账号
}> = {
    weibo: {
        name: '微博',
        icon: 'public',
        color: '#E6162D',
        urlTemplate: 'https://weibo.com/{accountId}',
    },
    wechatChannel: {
        name: '视频号',
        icon: 'videocam',
        color: '#07C160',
        urlTemplate: 'https://channels.weixin.qq.com/platform/post/{accountId}',
    },
    douyin: {
        name: '抖音',
        icon: 'music-note',
        color: '#000000',
        urlTemplate: 'https://www.douyin.com/user/{accountId}',
    },
    xiaohongshu: {
        name: '小红书',
        icon: 'book',
        color: '#FF2442',
        urlTemplate: 'https://www.xiaohongshu.com/{accountId}',
    },
    wechatOfficialAccount: {
        name: '公众号',
        icon: 'article',
        color: '#07C160',
        urlTemplate: 'https://mp.weixin.qq.com/s/{accountId}',
    },
    yuque: {
        name: '语雀',
        icon: 'menu-book',
        color: '#00B96B',
        urlTemplate: 'https://www.yuque.com/{accountId}',
    },
    twitter: {
        name: 'Twitter/X',
        icon: 'alternate-email',
        color: '#1DA1F2',
        urlTemplate: 'https://twitter.com/{accountId}',
    },
    telegram: {
        name: 'Telegram',
        icon: 'send',
        color: '#0088CC',
        urlTemplate: 'https://t.me/{accountId}',
    },
    discord: {
        name: 'Discord',
        icon: 'forum',
        color: '#5865F2',
        urlTemplate: 'https://discord.gg/{accountId}',
    },
    facebook: {
        name: 'Facebook',
        icon: 'facebook',
        color: '#1877F2',
        urlTemplate: 'https://facebook.com/{accountId}',
    },
    linkedin: {
        name: 'LinkedIn',
        icon: 'work',
        color: '#0A66C2',
        urlTemplate: 'https://linkedin.com/in/{accountId}',
    },
    instagram: {
        name: 'Instagram',
        icon: 'camera-alt',
        color: '#E4405F',
        urlTemplate: 'https://instagram.com/{accountId}',
    },
    youtube: {
        name: 'YouTube',
        icon: 'play-circle-filled',
        color: '#FF0000',
        urlTemplate: 'https://youtube.com/@{accountId}',
    },
};

/**
 * 生成社交媒体链接
 * @param platform 平台类型
 * @param accountId 账号ID
 * @param customUrl 自定义URL（可选）
 * @returns 完整的链接URL
 */
export function generateSocialMediaUrl(
    platform: SocialMediaPlatform,
    accountId: string,
    customUrl?: string
): string | null {
    // 如果提供了自定义URL，直接使用
    if (customUrl) {
        return customUrl;
    }

    const config = SOCIAL_MEDIA_PLATFORMS[platform];
    
    // 如果没有URL模板，返回null（需要特殊处理的平台）
    if (!config.urlTemplate) {
        return null;
    }

    // 替换模板中的 {accountId}
    return config.urlTemplate.replace('{accountId}', accountId);
}

/**
 * 获取平台显示名称
 */
export function getPlatformName(platform: SocialMediaPlatform): string {
    return SOCIAL_MEDIA_PLATFORMS[platform]?.name || platform;
}

/**
 * 获取平台图标
 */
export function getPlatformIcon(platform: SocialMediaPlatform): string {
    return SOCIAL_MEDIA_PLATFORMS[platform]?.icon || 'link';
}

/**
 * 获取平台品牌色
 */
export function getPlatformColor(platform: SocialMediaPlatform): string {
    return SOCIAL_MEDIA_PLATFORMS[platform]?.color || '#666666';
}

/**
 * 验证账号ID格式（基础验证）
 * @param platform 平台类型
 * @param accountId 账号ID
 * @returns 是否有效
 */
export function validateAccountId(platform: SocialMediaPlatform, accountId: string): boolean {
    if (!accountId || accountId.trim() === '') {
        return false;
    }

    // 基础验证：去除空格
    const trimmed = accountId.trim();

    // 特定平台的验证规则
    switch (platform) {
        case 'twitter':
            // Twitter 用户名不能包含空格，通常以 @ 开头（可选）
            return /^@?[a-zA-Z0-9_]{1,15}$/.test(trimmed);
        
        case 'telegram':
            // Telegram 用户名不能包含空格
            return /^@?[a-zA-Z0-9_]{5,32}$/.test(trimmed);
        
        case 'instagram':
            // Instagram 用户名规则
            return /^[a-zA-Z0-9._]{1,30}$/.test(trimmed);
        
        default:
            // 其他平台的基础验证：至少1个字符
            return trimmed.length > 0;
    }
}
