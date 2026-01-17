import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform, Image, Text, ActivityIndicator, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { fileManager, FileMetadata } from '../services/fileManager';
import { SpeechToTextService } from '../services/speechToText';
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
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [voiceMode, setVoiceMode] = useState(false);

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

    const startRecording = async () => {
        try {
            console.log('请求录音权限...');
            const permission = await Audio.requestPermissionsAsync();
            
            if (permission.status !== 'granted') {
                Alert.alert('权限不足', '需要麦克风权限才能使用语音输入功能');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log('开始录音...');
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            
            setRecording(recording);
            setIsRecording(true);
        } catch (error) {
            console.error('开始录音失败:', error);
            Alert.alert('错误', '无法开始录音，请稍后再试');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        try {
            console.log('停止录音...');
            setIsRecording(false);
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });
            
            const uri = recording.getURI();
            setRecording(null);

            if (uri) {
                console.log('录音文件:', uri);
                await processVoiceInput(uri);
            }
        } catch (error) {
            console.error('停止录音失败:', error);
            Alert.alert('错误', '录音处理失败');
            setRecording(null);
        }
    };

    const processVoiceInput = async (audioUri: string) => {
        try {
            setIsProcessingVoice(true);
            
            // 验证音频文件
            await SpeechToTextService.validateAudioFile(audioUri);
            
            // 调用语音识别服务
            const text = await SpeechToTextService.convertAudioToText(audioUri, 'm4a', 16000);
            
            // 识别成功后直接发送
            if (text && text.trim()) {
                // 合并已有文本和识别结果
                const messageText = value ? `${value} ${text}` : text;
                // 清空输入框
                onChangeText('');
                // 发送消息
                onSend(messageText);
                // 退出语音模式
                setVoiceMode(false);
            }
            
            // 删除临时音频文件
            await FileSystem.deleteAsync(audioUri, { idempotent: true });
        } catch (error) {
            console.error('语音识别失败:', error);
        } finally {
            setIsProcessingVoice(false);
        }
    };

    const toggleVoiceMode = () => {
        setVoiceMode(!voiceMode);
    };

    const handleVoicePressIn = async () => {
        await startRecording();
    };

    const handleVoicePressOut = async () => {
        await stopRecording();
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
            {isProcessingVoice && (
                <View style={styles.processingContainer}>
                    <ActivityIndicator size="small" color={ThemeConfig.colors.primary} />
                    <Text style={styles.processingText}>正在识别语音...</Text>
                </View>
            )}
            {!isProcessingVoice && isRecording && (
                <View style={styles.processingContainer}>
                    <View style={styles.recordingIndicator} />
                    <Text style={styles.processingText}>正在录音...</Text>
                </View>
            )}
            <View style={styles.inputRow}>
                {!voiceMode ? (
                    <>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={handleImageAction}
                            disabled={disabled || uploading || isRecording || isProcessingVoice}
                        >
                            <MaterialIcons 
                                name="add-circle-outline" 
                                size={28} 
                                color={disabled || uploading || isRecording || isProcessingVoice ? ThemeConfig.colors.textDisabled : ThemeConfig.colors.primary} 
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={toggleVoiceMode}
                            disabled={disabled || uploading || isProcessingVoice}
                        >
                            <MaterialIcons 
                                name="mic"
                                size={28} 
                                color={disabled || uploading || isProcessingVoice ? ThemeConfig.colors.textDisabled : ThemeConfig.colors.primary} 
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
                            editable={!disabled && !uploading && !isRecording && !isProcessingVoice}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                (!value.trim() && !selectedImageMetadata || disabled || uploading || isRecording || isProcessingVoice) && styles.sendButtonDisabled
                            ]}
                            onPress={handleSend}
                            disabled={!value.trim() && !selectedImageMetadata || disabled || uploading || isRecording || isProcessingVoice}
                        >
                            <MaterialIcons 
                                name="send" 
                                size={24} 
                                color={(!value.trim() && !selectedImageMetadata || disabled || uploading || isRecording || isProcessingVoice) ? ThemeConfig.colors.textDisabled : ThemeConfig.colors.white} 
                            />
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={toggleVoiceMode}
                            disabled={disabled || isRecording || isProcessingVoice}
                        >
                            <MaterialIcons 
                                name="keyboard"
                                size={28} 
                                color={disabled || isRecording || isProcessingVoice ? ThemeConfig.colors.textDisabled : ThemeConfig.colors.primary} 
                            />
                        </TouchableOpacity>
                        <Pressable
                            style={[
                                styles.voiceLargeButton,
                                isRecording && styles.voiceLargeButtonRecording
                            ]}
                            onPressIn={handleVoicePressIn}
                            onPressOut={handleVoicePressOut}
                            disabled={disabled || isProcessingVoice}
                        >
                            <MaterialIcons 
                                name="mic"
                                size={24} 
                                color={ThemeConfig.colors.white} 
                            />
                            <Text style={styles.voiceLargeButtonText}>
                                {isRecording ? '松开结束' : '按住说话'}
                            </Text>
                        </Pressable>
                    </>
                )}
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
    iconButton: {
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
    voiceLargeButton: {
        flex: 1,
        minHeight: 40,
        backgroundColor: ThemeConfig.colors.primary,
        borderRadius: ThemeConfig.borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: ThemeConfig.spacing.sm,
    },
    voiceLargeButtonRecording: {
        backgroundColor: ThemeConfig.colors.error,
    },
    voiceLargeButtonText: {
        color: ThemeConfig.colors.white,
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    processingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: ThemeConfig.spacing.sm,
        gap: ThemeConfig.spacing.sm,
    },
    processingText: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textSecondary,
    },
    recordingIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: ThemeConfig.colors.error,
    },
});

export default ChatInput;
