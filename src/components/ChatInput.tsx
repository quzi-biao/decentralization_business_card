import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { fileManager } from '../services/fileManager';

interface ChatInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onSend: (text: string, imageUrl?: string) => void;
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
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleSend = () => {
        if (!value.trim() && !selectedImage) return;
        
        onSend(value, selectedImage || undefined);
        setSelectedImage(null);
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
                const fileUrl = metadata.minioUrl || metadata.originalPath;
                setSelectedImage(fileUrl);
                Alert.alert('成功', '图片已上传');
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
                const fileUrl = metadata.minioUrl || metadata.originalPath;
                setSelectedImage(fileUrl);
                Alert.alert('成功', '图片已上传');
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
                const fileUrl = metadata.minioUrl || metadata.originalPath;
                setSelectedImage(fileUrl);
                Alert.alert('成功', '文件已上传');
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('错误', error instanceof Error ? error.message : '选择文件失败');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
    };

    return (
        <View style={styles.container}>
            {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
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
                        color={disabled || uploading ? '#cbd5e1' : '#4F46E5'} 
                    />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    multiline
                    maxLength={500}
                    editable={!disabled && !uploading}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!value.trim() && !selectedImage || disabled || uploading) && styles.sendButtonDisabled
                    ]}
                    onPress={handleSend}
                    disabled={!value.trim() && !selectedImage || disabled || uploading}
                >
                    <MaterialIcons 
                        name="send" 
                        size={24} 
                        color={(!value.trim() && !selectedImage || disabled || uploading) ? '#cbd5e1' : '#ffffff'} 
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    imagePreviewContainer: {
        padding: 12,
        paddingBottom: 0,
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 16,
        gap: 12,
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
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: '#1e293b',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#e2e8f0',
    },
});

export default ChatInput;
