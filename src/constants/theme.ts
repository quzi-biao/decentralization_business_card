/**
 * 应用主题配置
 * 统一管理颜色、字体、间距等设计规范
 */

export const ThemeConfig = {
    // 主色调
    colors: {
        // 品牌色
        primary: '#4F46E5',        // 主色（紫色）
        primaryLight: '#6366F1',   // 浅主色
        primaryDark: '#4338CA',    // 深主色
        
        // 文本颜色
        textPrimary: '#1e293b',    // 主要文本（深灰）
        textSecondary: '#64748b',  // 次要文本（中灰）
        textTertiary: '#94a3b8',   // 三级文本（浅灰）
        textDisabled: '#cbd5e1',   // 禁用文本
        
        // 背景色
        background: '#ffffff',     // 主背景（白色）
        backgroundSecondary: '#f8fafc', // 次要背景
        backgroundTertiary: '#f1f5f9',  // 三级背景
        
        // 边框颜色
        border: '#e2e8f0',         // 默认边框
        borderLight: '#f1f5f9',    // 浅色边框
        borderDark: '#cbd5e1',     // 深色边框
        
        // 状态颜色
        success: '#10b981',        // 成功（绿色）
        warning: '#f59e0b',        // 警告（橙色）
        error: '#ef4444',          // 错误（红色）
        info: '#3b82f6',           // 信息（蓝色）
        
        // 其他
        white: '#ffffff',
        black: '#000000',
        transparent: 'transparent',
        overlay: 'rgba(0, 0, 0, 0.5)', // 遮罩层
    },
    
    // 字体大小
    fontSize: {
        xs: 11,      // 极小
        sm: 12,      // 小
        base: 14,    // 基础
        md: 15,      // 中等
        lg: 16,      // 大
        xl: 18,      // 超大
        xxl: 20,     // 特大
        xxxl: 24,    // 巨大
        display: 32, // 展示标题
    },
    
    // 字体粗细
    fontWeight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
    
    // 间距
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        base: 16,
        lg: 20,
        xl: 24,
        xxl: 32,
        xxxl: 40,
    },
    
    // 圆角
    borderRadius: {
        none: 0,
        sm: 4,
        base: 8,
        md: 12,
        lg: 16,
        xl: 18,
        xxl: 24,
        full: 9999,
    },
    
    // 阴影
    shadow: {
        sm: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
        base: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        },
        lg: {
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
        },
        primary: {
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
    },
    
    // 图标大小
    iconSize: {
        xs: 14,
        sm: 16,
        base: 18,
        md: 20,
        lg: 24,
        xl: 32,
        xxl: 48,
        xxxl: 64,
    },
    
    // 边框宽度
    borderWidth: {
        thin: 1,
        base: 2,
        thick: 3,
    },
    
    // 透明度
    opacity: {
        disabled: 0.5,
        hover: 0.7,
        pressed: 0.8,
    },
};

// 导出类型以便 TypeScript 类型检查
export type ThemeColors = typeof ThemeConfig.colors;
export type ThemeFontSize = typeof ThemeConfig.fontSize;
export type ThemeSpacing = typeof ThemeConfig.spacing;
export type ThemeBorderRadius = typeof ThemeConfig.borderRadius;
export type ThemeShadow = typeof ThemeConfig.shadow;
export type ThemeIconSize = typeof ThemeConfig.iconSize;

export default ThemeConfig;
