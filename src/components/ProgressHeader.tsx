import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ProgressHeaderProps {
    progress: number;
    filledCount: number;
    totalCount: number;
    onPress: () => void;
}

/**
 * 进度显示头部组件
 * 显示名片填写进度和质量评分
 */
const ProgressHeader: React.FC<ProgressHeaderProps> = ({
    progress,
    filledCount,
    totalCount,
    onPress
}) => {
    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <MaterialIcons name="smart-toy" size={24} color="#4F46E5" />
                <Text style={styles.headerTitle}>AI 名片助手</Text>
            </View>
            <TouchableOpacity 
                style={styles.progressContainer}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={styles.progressInfo}>
                    <Text style={styles.progressText}>{progress}%</Text>
                    <Text style={styles.progressLabel}>完成度</Text>
                </View>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>
                <View style={styles.qualityBadge}>
                    <MaterialIcons name="star" size={14} color="#f59e0b" />
                    <Text style={styles.qualityText}>{progress}分</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginLeft: 8,
    },
    progressContainer: {
        alignItems: 'flex-end',
        gap: 4,
    },
    progressInfo: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    progressText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#4F46E5',
    },
    progressLabel: {
        fontSize: 11,
        color: '#64748b',
    },
    progressBarContainer: {
        width: 80,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4F46E5',
        borderRadius: 2,
    },
    qualityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#fef3c7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    qualityText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#f59e0b',
    },
});

export default ProgressHeader;
