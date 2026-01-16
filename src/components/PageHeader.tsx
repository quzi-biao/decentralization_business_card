import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeConfig } from '../constants/theme';

interface PageHeaderProps {
    title: string;
    onBack: () => void;
    rightButton?: {
        icon?: string;
        text?: string;
        onPress: () => void;
    };
    backgroundColor?: string;
}

/**
 * 二级页面通用头部组件
 * - 左侧：返回按钮
 * - 中间：页面标题
 * - 右侧：可选的操作按钮（图标或文字）
 * - 自动处理状态栏安全区域
 */
const PageHeader: React.FC<PageHeaderProps> = ({ 
    title, 
    onBack, 
    rightButton,
    backgroundColor = ThemeConfig.colors.background
}) => {
    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor }]}>
                {/* 左侧返回按钮 */}
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={onBack}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color={ThemeConfig.colors.textPrimary} />
                </TouchableOpacity>

                {/* 中间标题 */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                </View>

                {/* 右侧操作按钮 */}
                <View style={styles.rightButtonContainer}>
                    {rightButton && (
                        <TouchableOpacity 
                            style={styles.rightButton}
                            onPress={rightButton.onPress}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            {rightButton.icon ? (
                                <MaterialIcons name={rightButton.icon as any} size={24} color={ThemeConfig.colors.primary} />
                            ) : rightButton.text ? (
                                <Text style={styles.rightButtonText}>{rightButton.text}</Text>
                            ) : null}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: ThemeConfig.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        paddingHorizontal: ThemeConfig.spacing.base,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.borderLight,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: ThemeConfig.spacing.base,
    },
    title: {
        fontSize: ThemeConfig.fontSize.lg + 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        textAlign: 'center',
    },
    rightButtonContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightButtonText: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.primary,
    },
});

export default PageHeader;
