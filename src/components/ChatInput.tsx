import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { fileManager, FileMetadata } from '../services/fileManager';
import { ThemeConfig } from '../constants/theme';

interface ChatInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onSend: (text: string, imageMinioUrl?: string, imageLocalPath?: string, imageFileId?: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

/**
 * 聊天输入组件
 * 支持文本输入、拍照、选择图片
 */
const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChangeText,
    onSend,
    disabled = false,
    placeholder = '输入消息...',
}) => {
    const [uploading, setUploading] = useState(false);
    const [selectedImageMetadata, setSelectedImageMetadata] = useState<FileMetadata | null>(null);

    const handleSend = () => {
        if (!value.trim() && !selectedImageMetadata) return;
        
        // 发送给 AI 使用 minioUrl，本地显示使用 originalPath
        const imageMinioUrl = selectedImageMetadata?.minioUrl || selectedImageMetadata?.originalPath;
        const imageLocalPath = selectedImageMetadata?.originalPath;
        const imageFileId = selectedImageMetadata?.id;
        onSend(value, imageMinioUrl, imageLocalPath, imageFileId);
        setSelectedImageMetadata(null);
    };

    const handleImageAction = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['取消', '拍照', '从相册选择', '选择文件'],
                    cancelButtonIndex: 0,
                },
                async (buttonIndex) => {
                    if (buttonIndex === 1) {
                        await handleTakePhoto();
                    } else if (buttonIndex === 2) {
                        await handlePickImage();
                    } else if (buttonIndex === 3) {
                        await handlePickDocument();
                    }
                }
            );
        } else {
            Alert.alert(
                '选择文件',
                '请选择文件来源',
                [
                    { text: '取消', style: 'cancel' },
                    { text: '拍照', onPress: handleTakePhoto },
                    { text: '从相册选择', onPress: handlePickImage },
                    { text: '选择文件', onPress: handlePickDocument },
                ]
            );
        }
    };

    const handleTakePhoto = async () => {
        try {
            setUploading(true);
            const metadata = await fileManager.takePhoto({ context: 'chat' });
            
            if (metadata) {
                setSelectedImageMetadata(metadata);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('错误', error instanceof Error ? error.message : '拍照失败');
        } finally {
            setUploading(false);
        }
    };

    const handlePickImage = async () => {
        try {
            setUploading(true);
            const metadata = await fileManager.pickImage({ context: 'chat' });
            
            if (metadata) {
                setSelectedImageMetadata(metadata);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('错误', error instanceof Error ? error.message : '选择图片失败');
        } finally {
            setUploading(false);
        }
    };

    const handlePickDocument = async () => {
        try {
            setUploading(true);
            const metadata = await fileManager.pickDocument({ context: 'chat' });
            
            if (metadata) {
                setSelectedImageMetadata(metadata);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('错误', error instanceof Error ? error.message : '选择文件失败');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImageMetadata(null);
    };

    return (
        <View style={styles.container}>
            {selectedImageMetadata && (
                <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: selectedImageMetadata.originalPath }} style={styles.imagePreview} />
                    <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={handleRemoveImage}
                    >
                        <MaterialIcons name="close" size={16} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.inputRow}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleImageAction}
                    disabled={disabled || uploading}
                >
                    <MaterialIcons 
                        name="add-circle-outline" 
                        size={28} 
                        color={disabled || uploading ? ThemeConfig.colors.textDisabled : ThemeConfig.colors.primary} 
                    />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={ThemeConfig.colors.textTertiary}
                    multiline
                    maxLength={500}
                    editable={!disabled && !uploading}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!value.trim() && !selectedImageMetadata || disabled || uploading) && styles.sendButtonDisabled
                    ]}
                    onPress={handleSend}
                    disabled={!value.trim() && !selectedImageMetadata || disabled || uploading}
                >
                    <MaterialIcons 
                        name="send" 
                        size={24} 
                        color={(!value.trim() && !selectedImageMetadata || disabled || uploading) ? ThemeConfig.colors.textDisabled : ThemeConfig.colors.white} 
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: ThemeConfig.colors.background,
        borderTopWidth: ThemeConfig.borderWidth.thin,
        borderTopColor: ThemeConfig.colors.border,
    },
    imagePreviewContainer: {
        padding: ThemeConfig.spacing.md,
        paddingBottom: 0,
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius: ThemeConfig.borderRadius.base,
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
    },
    removeImageButton: {
        position: 'absolute',
        top: ThemeConfig.spacing.sm,
        right: ThemeConfig.spacing.sm,
        width: ThemeConfig.iconSize.lg,
        height: ThemeConfig.iconSize.lg,
        borderRadius: ThemeConfig.iconSize.lg / 2,
        backgroundColor: ThemeConfig.colors.overlay,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: ThemeConfig.spacing.base,
        gap: ThemeConfig.spacing.md,
    },
    addButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
        borderRadius: ThemeConfig.borderRadius.xl,
        paddingHorizontal: ThemeConfig.spacing.base,
        paddingVertical: ThemeConfig.spacing.sm + 2,
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textPrimary,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: ThemeConfig.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: ThemeConfig.colors.border,
    },
});

export default ChatInput;
