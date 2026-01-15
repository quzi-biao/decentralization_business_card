import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    imageUrl?: string; // 向后兼容
    imageLocalPath?: string; // 本地路径，用于显示
    imageMinioUrl?: string; // MinIO 链接
}

interface ChatMessageProps {
    message: Message;
}

/**
 * 聊天消息组件
 * 显示用户或AI的消息气泡
 */
const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const [imageLoadFailed, setImageLoadFailed] = useState(false);
    
    // 优先使用本地路径，其次使用 imageUrl（向后兼容），最后使用 MinIO 链接
    const displayImageUrl = message.imageLocalPath || message.imageUrl || message.imageMinioUrl;
    // 判断是否是今天的消息
    const isToday = () => {
        const today = new Date();
        const msgDate = new Date(message.timestamp);
        return today.toDateString() === msgDate.toDateString();
    };

    // 格式化时间戳
    const formatTimestamp = () => {
        const msgDate = new Date(message.timestamp);
        if (isToday()) {
            // 今天的消息只显示时间
            return msgDate.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            // 非今天的消息显示日期和时间
            return msgDate.toLocaleString('zh-CN', { 
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    };

    return (
        <View 
            style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage
            ]}
        >
            {message.isUser ? (
                <View style={[styles.messageBubble, styles.userBubble]}>
                    {displayImageUrl && (
                        imageLoadFailed ? (
                            <View style={styles.imageFailedContainer}>
                                <MaterialIcons name="broken-image" size={48} color="#94a3b8" />
                                <Text style={styles.imageFailedText}>图片加载失败</Text>
                            </View>
                        ) : (
                            <Image 
                                source={{ uri: displayImageUrl }} 
                                style={styles.messageImage}
                                resizeMode="cover"
                                onError={() => {
                                    setImageLoadFailed(true);
                                }}
                            />
                        )
                    )}
                    {message.text && (
                        <Text style={styles.userText}>
                            {message.text}
                        </Text>
                    )}
                    <Text style={styles.timestamp}>
                        {formatTimestamp()}
                    </Text>
                </View>
            ) : (
                <View style={[styles.messageBubble, styles.aiBubble]}>
                    {displayImageUrl && (
                        imageLoadFailed ? (
                            <View style={styles.imageFailedContainer}>
                                <MaterialIcons name="broken-image" size={48} color="#94a3b8" />
                                <Text style={styles.imageFailedText}>图片加载失败</Text>
                            </View>
                        ) : (
                            <Image 
                                source={{ uri: displayImageUrl }} 
                                style={styles.messageImage}
                                resizeMode="cover"
                                onError={() => {
                                    setImageLoadFailed(true);
                                }}
                            />
                        )
                    )}
                    <Markdown style={markdownStyles}>
                        {message.text}
                    </Markdown>
                    <Text style={styles.timestamp}>
                        {formatTimestamp()}
                    </Text>
                </View>
            )}
        </View>
    );
};

const markdownStyles = {
    body: {
        color: '#1e293b',
        fontSize: 15,
        lineHeight: 22,
    },
    paragraph: {
        marginTop: 0,
        marginBottom: 8,
    },
    strong: {
        fontWeight: '700' as '700',
    },
    em: {
        fontStyle: 'italic' as 'italic',
    },
    code_inline: {
        backgroundColor: '#f1f5f9',
        color: '#4F46E5',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 14,
    },
    code_block: {
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 14,
    },
    bullet_list: {
        marginVertical: 4,
    },
    ordered_list: {
        marginVertical: 4,
    },
    list_item: {
        marginVertical: 2,
    },
};

const styles = StyleSheet.create({
    messageContainer: {
        marginBottom: 16,
    },
    userMessage: {
        alignItems: 'flex-end',
    },
    aiMessage: {
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
    },
    userBubble: {
        backgroundColor: '#4F46E5',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    userText: {
        color: '#ffffff',
        fontSize: 15,
        lineHeight: 22,
    },
    timestamp: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 4,
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#f1f5f9',
    },
    imageFailedContainer: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    imageFailedText: {
        fontSize: 12,
        color: '#94a3b8',
    },
});

export default ChatMessage;
