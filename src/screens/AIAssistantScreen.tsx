import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { callN8NAgent } from '../services/n8nService';
import { N8N_CONFIG } from '../config/n8n.config';
import { useCardStore } from '../store/useCardStore';
import { parseAIResponse, hasCompleteFormData, mergeFormData, generateFormSummary } from '../utils/formDataParser';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

/**
 * AI 助手页面
 * 使用 n8n AI Agent 提供智能对话功能
 */
const AIAssistantScreen: React.FC = () => {
    const { cardData, updateCardData } = useCardStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(`session-${Date.now()}`);
    const [formCompleted, setFormCompleted] = useState(false);
    const [updatedFields, setUpdatedFields] = useState<string[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    // 添加开场白并发送当前已填写的信息给 AI
    useEffect(() => {
        const initializeChat = async () => {
            // 构建已填写字段的摘要
            const filledFields: string[] = [];
            if (cardData.realName) filledFields.push(`姓名：${cardData.realName}`);
            if (cardData.position) filledFields.push(`职位：${cardData.position}`);
            if (cardData.companyName) filledFields.push(`公司：${cardData.companyName}`);
            if (cardData.industry) filledFields.push(`行业：${cardData.industry}`);
            if (cardData.phone) filledFields.push(`电话：${cardData.phone}`);
            if (cardData.email) filledFields.push(`邮箱：${cardData.email}`);
            if (cardData.wechat) filledFields.push(`微信：${cardData.wechat}`);
            if (cardData.address) filledFields.push(`地址：${cardData.address}`);
            
            const contextMessage = filledFields.length > 0 
                ? `用户当前已填写的信息：\n${filledFields.join('\n')}\n\n请根据已有信息，引导用户补充缺失的字段。`
                : '用户尚未填写任何信息，请从基本信息开始引导。';

            try {
                // 发送上下文给 AI
                const rawResponse = await callN8NAgent(
                    N8N_CONFIG.agentWebhookPath,
                    contextMessage,
                    sessionId
                );

                const parsedResponse = parseAIResponse(rawResponse);

                const welcomeMessage: Message = {
                    id: 'welcome',
                    text: parsedResponse.output,
                    isUser: false,
                    timestamp: new Date(),
                };
                
                setMessages([welcomeMessage]);
            } catch (error) {
                console.error('Failed to initialize chat:', error);
                // 如果 AI 调用失败，显示默认欢迎消息
                const welcomeMessage: Message = {
                    id: 'welcome',
                    text: '您好！我是您的名片信息收集助手 😊\n\n我会通过简单的对话，帮您一步步创建一张专业、完整的商务名片。整个过程大约需要5-10分钟，所有信息仅用于生成您的个人名片。\n\n您现在方便开始吗？如果准备好了，我们可以先从基本信息入手！',
                    isUser: false,
                    timestamp: new Date(),
                };
                setMessages([welcomeMessage]);
            }
        };

        initializeChat();
    }, []); // 只在组件挂载时执行一次

    const sendMessage = async () => {
        if (!inputText.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setLoading(true);

        try {
            // 调用 n8n AI Agent
            const rawResponse = await callN8NAgent(
                N8N_CONFIG.agentWebhookPath,
                userMessage.text,
                sessionId
            );

            // 解析 AI 响应
            const parsedResponse = parseAIResponse(rawResponse);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: parsedResponse.output,
                isUser: false,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMessage]);

            // 实时更新表单数据（只要有 formData 就立即更新）
            console.log('parsedResponse', parsedResponse);
            if (parsedResponse.formData) {
                // 获取本次更新的字段
                const newlyUpdatedFields = Object.keys(parsedResponse.formData).filter(
                    key => {
                        const value = (parsedResponse.formData as any)[key];
                        return value !== undefined && value !== null;
                    }
                );
                
                // 合并并更新表单数据
                const mergedData = mergeFormData(cardData, parsedResponse.formData);
                updateCardData(mergedData);
                
                // 更新已填写字段列表
                setUpdatedFields(prev => {
                    const combined = [...new Set([...prev, ...newlyUpdatedFields])];
                    return combined;
                });
                
                // 如果标记为完成，显示完成状态
                if (parsedResponse.completed) {
                    setFormCompleted(true);
                    
                    // 添加完成提示消息
                    const completionMessage: Message = {
                        id: (Date.now() + 2).toString(),
                        text: `✅ 名片信息已完成！共填写了 ${Object.keys(parsedResponse.formData).length} 个字段。您可以在"我的"页面查看完整名片。`,
                        isUser: false,
                        timestamp: new Date(),
                    };
                    setMessages(prev => [...prev, completionMessage]);
                } else if (newlyUpdatedFields.length > 0) {
                    // 显示字段更新提示
                    const fieldNames = newlyUpdatedFields.map(field => {
                        const fieldMap: Record<string, string> = {
                            realName: '姓名',
                            position: '职位',
                            companyName: '公司',
                            phone: '电话',
                            email: '邮箱',
                            wechat: '微信',
                            address: '地址',
                            industry: '行业',
                            aboutMe: '个人简介',
                        };
                        return fieldMap[field] || field;
                    }).join('、');
                    
                    const updateMessage: Message = {
                        id: (Date.now() + 2).toString(),
                        text: `📝 已更新：${fieldNames}`,
                        isUser: false,
                        timestamp: new Date(),
                    };
                    setMessages(prev => [...prev, updateMessage]);
                }
            }
        } catch (error) {
            console.error('Error calling AI Agent:', error);
            
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: '抱歉，AI 助手暂时无法响应。请稍后再试。',
                isUser: false,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = (message: Message) => (
        <View
            key={message.id}
            style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage
            ]}
        >
            <View style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.aiBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    message.isUser ? styles.userText : styles.aiText
                ]}>
                    {message.text}
                </Text>
                <Text style={styles.timestamp}>
                    {message.timestamp.toLocaleTimeString('zh-CN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <MaterialIcons name="smart-toy" size={24} color="#4F46E5" />
                    <Text style={styles.headerTitle}>AI 名片助手</Text>
                </View>
                {formCompleted && (
                    <View style={styles.completedBadge}>
                        <MaterialIcons name="check-circle" size={16} color="#10b981" />
                        <Text style={styles.completedText}>已完成</Text>
                    </View>
                )}
            </View>

            <KeyboardAvoidingView 
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map(renderMessage)}
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#4F46E5" />
                            <Text style={styles.loadingText}>AI 正在思考...</Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="输入消息..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        maxLength={500}
                        editable={!loading}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || loading) && styles.sendButtonDisabled
                        ]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || loading}
                    >
                        <MaterialIcons 
                            name="send" 
                            size={24} 
                            color={!inputText.trim() || loading ? '#cbd5e1' : '#ffffff'} 
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
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
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#d1fae5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    completedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10b981',
    },
    content: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    messageContainer: {
        marginBottom: 16,
    },
    userMessage: {
        alignItems: 'flex-end',
    },
    aiMessage: {
        alignItems: 'flex-start',
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
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 4,
    },
    userText: {
        color: '#ffffff',
    },
    aiText: {
        color: '#1e293b',
    },
    timestamp: {
        fontSize: 11,
        color: '#94a3b8',
        alignSelf: 'flex-end',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748b',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 16,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        gap: 12,
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

export default AIAssistantScreen;
