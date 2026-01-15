import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Tag } from '../store/useTagStore';
import { LazyImage } from './LazyImage';

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
                    <MaterialIcons name="note" size={11} color="#94a3b8" />
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
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#C7D2FE',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EEF2FF',
        borderWidth: 2,
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
        fontSize: 18,
        fontWeight: '700',
        color: '#4F46E5',
    },
    info: {
        flex: 1,
        marginLeft: 10,
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 3,
    },
    position: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 2,
    },
    company: {
        fontSize: 11,
        color: '#94a3b8',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: 6,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '700',
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F8FAFC',
        padding: 6,
        borderRadius: 6,
        gap: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    noteText: {
        flex: 1,
        fontSize: 11,
        color: '#64748b',
        lineHeight: 14,
    },
});

export default ContactCard;
