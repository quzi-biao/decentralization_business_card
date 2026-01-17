import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LazyImage } from './LazyImage';
import { fileManager } from '../services/fileManager';
import { ThemeConfig } from '../constants/theme';

interface ImageUploadGridProps {
    imageIds: string[];
    onUpdate: (imageIds: string[]) => void;
    maxImages?: number;
    title?: string;
}

export const ImageUploadGrid: React.FC<ImageUploadGridProps> = ({ 
    imageIds, 
    onUpdate, 
    maxImages = 9,
    title = '图片'
}) => {
    const [uploading, setUploading] = useState(false);

    const handleAddImage = async () => {
        if (imageIds.length >= maxImages) {
            Alert.alert('提示', `最多只能上传${maxImages}张图片`);
            return;
        }

        try {
            setUploading(true);
            const metadata = await fileManager.pickImage({
                context: 'card',
                allowsEditing: false,
                quality: 0.8,
            });

            if (metadata) {
                onUpdate([...imageIds, metadata.id]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('错误', '选择图片失败，请重试');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (imageId: string) => {
        Alert.alert(
            '删除图片',
            '确定要删除这张图片吗？',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await fileManager.deleteFile(imageId);
                            onUpdate(imageIds.filter(id => id !== imageId));
                        } catch (error) {
                            console.error('Error deleting image:', error);
                            Alert.alert('错误', '删除图片失败');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gridContent}
            >
                {imageIds.map((imageId) => (
                    <View key={imageId} style={styles.imageItem}>
                        <LazyImage 
                            imageId={imageId}
                            useThumbnail={true}
                            style={styles.image}
                        />
                        <TouchableOpacity 
                            style={styles.removeButton}
                            onPress={() => handleRemoveImage(imageId)}
                        >
                            <MaterialIcons name="close" size={16} color={ThemeConfig.colors.white} />
                        </TouchableOpacity>
                    </View>
                ))}
                
                {imageIds.length < maxImages && (
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={handleAddImage}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color={ThemeConfig.colors.primary} />
                        ) : (
                            <>
                                <MaterialIcons name="add-photo-alternate" size={32} color={ThemeConfig.colors.textTertiary} />
                                <Text style={styles.addButtonText}>添加{title}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>
            
            <Text style={styles.hint}>
                已上传 {imageIds.length}/{maxImages} 张图片
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: ThemeConfig.spacing.sm,
    },
    gridContent: {
        paddingVertical: ThemeConfig.spacing.sm,
        gap: ThemeConfig.spacing.md,
    },
    imageItem: {
        width: 100,
        height: 100,
        borderRadius: ThemeConfig.borderRadius.md,
        position: 'relative',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: ThemeConfig.borderRadius.md,
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        width: 100,
        height: 100,
        borderRadius: ThemeConfig.borderRadius.md,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderWidth: 2,
        borderColor: ThemeConfig.colors.border,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        fontSize: ThemeConfig.fontSize.xs,
        color: ThemeConfig.colors.textTertiary,
        marginTop: 4,
    },
    hint: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textTertiary,
        marginTop: ThemeConfig.spacing.sm,
    },
});
