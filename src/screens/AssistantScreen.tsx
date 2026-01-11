import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCardStore } from '../store/useCardStore';
import * as Haptics from 'expo-haptics';

interface Message {
    id: string;
    role: 'assistant' | 'user';
    content: string;
}

const AssistantScreen = () => {
    const { cardData, updateCardData } = useCardStore();
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: '您好！我是名片助手，可以帮您快速完善名片信息，生成专业的个人简介和企业介绍。请告诉我您的职业信息，我来为您打造专业形象。' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        const newUserMsg = { id: Date.now().toString(), role: 'user' as const, content: userMessage };

        setMessages(prev => [...prev, newUserMsg]);
        setInput('');
        setIsTyping(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
            setIsTyping(false);
            const aiResponse = generateAIResponse(userMessage, updateCardData);
            const newAiMsg = { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: aiResponse };
            setMessages(prev => [...prev, newAiMsg]);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 1500);
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View
            style={[
                styles.messageContainer,
                item.role === 'user' ? styles.userMessageContainer : styles.assistantMessageContainer
            ]}
        >
            <View style={[styles.messageRow, item.role === 'user' && styles.userMessageRow]}>
                <View style={[styles.avatar, item.role === 'assistant' ? styles.assistantAvatar : styles.userAvatar]}>
                    <Text style={styles.avatarEmoji}>{item.role === 'assistant' ? '🤖' : '👤'}</Text>
                </View>
                <View style={[styles.messageBubble, item.role === 'assistant' ? styles.assistantBubble : styles.userBubble]}>
                    <Text style={[styles.messageText, item.role === 'assistant' ? styles.assistantText : styles.userText]}>
                        {item.content}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerSafeArea}>
                <SafeAreaView edges={['top']} />
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerIcon}>
                            <Text style={styles.headerIconEmoji}>✨</Text>
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>名片助手</Text>
                            <Text style={styles.headerStatus}>随时为您服务</Text>
                        </View>
                    </View>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                style={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {isTyping && (
                <View style={styles.typingIndicator}>
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            value={input}
                            onChangeText={setInput}
                            placeholder="输入您的信息，名片助手帮您完善..."
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            style={styles.input}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            style={styles.sendButton}
                        >
                            <Text style={styles.sendEmoji}>📤</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const generateAIResponse = (input: string, updateData: (d: any) => void) => {
    const lowInput = input.toLowerCase();

    if (lowInput.includes('名字') || lowInput.includes('我叫') || lowInput.includes('我是')) {
        const name = input.split(/我叫|我是/)[1]?.trim() || input;
        updateData({ realName: name });
        return `好的！您的名字是 ${name}。请告诉我您的职位或工作内容？`;
    }

    if (lowInput.includes('职位') || lowInput.includes('岗位') || lowInput.includes('工作')) {
        updateData({ position: input });
        return `很好！您的职位是 ${input}。请问您所在的公司或行业是什么？`;
    }

    return "已为您更新名片信息！您可以在【我的名片】页面查看效果，也可以继续补充更多信息。";
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    headerSafeArea: {
        backgroundColor: '#ffffff',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIconEmoji: {
        fontSize: 16,
    },
    avatarEmoji: {
        fontSize: 16,
    },
    sendEmoji: {
        fontSize: 18,
    },
    headerTitle: {
        color: '#1e293b',
        fontSize: 15,
        fontWeight: '600',
    },
    headerStatus: {
        color: '#64748b',
        fontSize: 11,
    },
    messageList: {
        flex: 1,
        paddingTop: 16,
    },
    messageContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    userMessageContainer: {
        alignItems: 'flex-end',
    },
    assistantMessageContainer: {
        alignItems: 'flex-start',
    },
    messageRow: {
        flexDirection: 'row',
        maxWidth: '85%',
        gap: 12,
    },
    userMessageRow: {
        flexDirection: 'row-reverse',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    assistantAvatar: {
        backgroundColor: '#64748b',
    },
    userAvatar: {
        backgroundColor: '#e2e8f0',
    },
    messageBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    assistantBubble: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    userBubble: {
        backgroundColor: '#64748b',
        borderTopRightRadius: 4,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 22,
    },
    assistantText: {
        color: '#475569',
    },
    userText: {
        color: '#ffffff',
        fontWeight: '500',
    },
    typingIndicator: {
        paddingHorizontal: 40,
        paddingVertical: 8,
        flexDirection: 'row',
        gap: 4,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#64748b',
    },
    inputContainer: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    input: {
        flex: 1,
        color: '#1e293b',
        fontSize: 14,
        height: 44,
    },
    sendButton: {
        width: 36,
        height: 36,
        backgroundColor: '#64748b',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default AssistantScreen;
