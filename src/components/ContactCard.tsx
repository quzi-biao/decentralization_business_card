import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Tag } from '../store/useTagStore';
import { LazyImage } from './LazyImage';
import { ThemeConfig } from '../constants/theme';

interface ContactCardProps {
    avatarId?: string;
    avatarUrl?: string;
    realName?: string;
    position?: string;
    companyName?: string;
    tags: Tag[];
    note?: string;
    onPress: () => void;
}

/**
 * 联系人卡片组件
 * 用于展示名片列表中的单个联系人信息
 */
const ContactCard: React.FC<ContactCardProps> = ({
    avatarId,
    avatarUrl,
    realName,
    position,
    companyName,
    tags,
    note,
    onPress
}) => {
    return (
        <TouchableOpacity 
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    {avatarId ? (
                        <LazyImage 
                            imageId={avatarId}
                            useThumbnail={true}
                            style={styles.avatarImage}
                        />
                    ) : avatarUrl && avatarUrl.length < 150000 ? (
                        <Image 
                            source={{ uri: avatarUrl }}
                            style={styles.avatarImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={styles.avatarText}>
                            {realName?.charAt(0) || '👤'}
                        </Text>
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                        {realName || '未知'}
                    </Text>
                    <Text style={styles.position} numberOfLines={1}>
                        {position || '未知职位'}
                    </Text>
                    <Text style={styles.company} numberOfLines={1}>
                        {companyName || '未知公司'}
                    </Text>
                </View>
            </View>
            
            {/* 标签 */}
            {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {tags.map((tag) => (
                        <View 
                            key={tag.id} 
                            style={[styles.tag, { backgroundColor: tag.color + '15', borderColor: tag.color + '40' }]}
                        >
                            <Text style={[styles.tagText, { color: tag.color }]}>
                                {tag.name}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
            
            {/* 备注 */}
            {note && (
                <View style={styles.noteContainer}>
                    <MaterialIcons name="note" size={11} color={ThemeConfig.colors.textTertiary} />
                    <Text style={styles.noteText} numberOfLines={1}>
                        {note}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '48%',
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: 14,
        marginBottom: ThemeConfig.spacing.md,
        borderWidth: 1.5,
        borderColor: '#C7D2FE',
        shadowColor: ThemeConfig.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: ThemeConfig.spacing.sm + 2,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EEF2FF',
        borderWidth: ThemeConfig.borderWidth.base,
        borderColor: '#C7D2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 22,
    },
    avatarText: {
        fontSize: ThemeConfig.fontSize.xl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.primary,
    },
    info: {
        flex: 1,
        marginLeft: ThemeConfig.spacing.sm + 2,
    },
    name: {
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: 3,
    },
    position: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: 2,
    },
    company: {
        fontSize: ThemeConfig.fontSize.xs,
        color: ThemeConfig.colors.textTertiary,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ThemeConfig.spacing.xs,
        marginBottom: 6,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
        borderWidth: ThemeConfig.borderWidth.thin,
    },
    tagText: {
        fontSize: 10,
        fontWeight: ThemeConfig.fontWeight.bold,
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        padding: 6,
        borderRadius: 6,
        gap: ThemeConfig.spacing.xs,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    noteText: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.xs,
        color: ThemeConfig.colors.textSecondary,
        lineHeight: 14,
    },
});

export default ContactCard;
