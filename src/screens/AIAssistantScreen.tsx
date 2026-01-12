import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useNavigation } from '@react-navigation/native';
import { useCardStore } from '../store/useCardStore';
import { callN8NAgent } from '../services/n8nService';
import { N8N_CONFIG } from '../config/n8n.config';
import { parseAIResponse, hasCompleteFormData, mergeFormData, generateFormSummary } from '../utils/formDataParser';
import { ChatPersistenceService } from '../services/chatPersistence';

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
    const navigation = useNavigation<any>();
    const { cardData, updateCardData } = useCardStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(`session-${Date.now()}`);
    const [formCompleted, setFormCompleted] = useState(false);
    const [updatedFields, setUpdatedFields] = useState<string[]>([]);
    const [pendingUpdate, setPendingUpdate] = useState<{
        formData: any;
        messageId: string;
    } | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // 计算名片完成度
    const calculateProgress = () => {
        const requiredFields = [
            'realName', 'position', 'companyName', 'industry',
            'phone', 'email', 'wechat', 'address',
            'aboutMe', 'hometown', 'residence', 'hobbies',
            'personality', 'focusIndustry', 'circles', 'companyIntro'
        ];
        
        const filledCount = requiredFields.filter(field => {
            const value = (cardData as any)[field];
            return value && value.toString().trim() !== '';
        }).length;
        
        const progress = Math.round((filledCount / requiredFields.length) * 100);
        return { progress, filledCount, totalCount: requiredFields.length };
    };

    const progressInfo = calculateProgress();

    const handleProgressPress = () => {
        navigation.navigate('Profile', {
            screen: 'CardDetail',
            params: { cardData }
        });
    };

    useEffect(() => {
        // 使用 setTimeout 确保在消息渲染完成后再滚动
        const timer = setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        
        return () => clearTimeout(timer);
    }, [messages]);

    // 加载今天的聊天历史或初始化新对话
    useEffect(() => {
        const initializeChat = async () => {
            // 先尝试加载今天的聊天记录
            const todayChat = await ChatPersistenceService.getTodayChat();
            
            if (todayChat && todayChat.messages.length > 0) {
                // 如果有今天的聊天记录，直接加载
                setMessages(todayChat.messages);
                return;
            }
            
            // 如果没有今天的聊天记录，初始化新对话
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
                await ChatPersistenceService.saveMessage(welcomeMessage, sessionId);
            } catch (error) {
                console.error('Failed to initialize chat:', error);
                const welcomeMessage: Message = {
                    id: 'welcome',
                    text: '您好！我是您的名片信息收集助手 😊\n\n我会通过简单的对话，帮您一步步创建一张专业、完整的商务名片。整个过程大约需要5-10分钟，所有信息仅用于生成您的个人名片。\n\n您现在方便开始吗？如果准备好了，我们可以先从基本信息入手！',
                    isUser: false,
                    timestamp: new Date(),
                };
                setMessages([welcomeMessage]);
                await ChatPersistenceService.saveMessage(welcomeMessage, sessionId);
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

        // 保存用户消息
        await ChatPersistenceService.saveMessage(userMessage, sessionId);

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
            
            // 保存 AI 消息
            await ChatPersistenceService.saveMessage(aiMessage, sessionId);

            // 如果有表单数据，存储为待确认更新
            if (parsedResponse.formData) {
                setPendingUpdate({
                    formData: parsedResponse.formData,
                    messageId: aiMessage.id,
                });
                
                // 如果标记为完成，显示完成状态
                if (parsedResponse.completed) {
                    setFormCompleted(true);
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
            await ChatPersistenceService.saveMessage(errorMessage, sessionId);
        } finally {
            setLoading(false);
        }
    };

    const confirmUpdate = async () => {
        if (!pendingUpdate) return;
        
        // 获取本次更新的字段
        const newlyUpdatedFields = Object.keys(pendingUpdate.formData).filter(
            key => {
                const value = (pendingUpdate.formData as any)[key];
                return value !== undefined && value !== null;
            }
        );
        
        // 合并并更新表单数据
        const mergedData = mergeFormData(cardData, pendingUpdate.formData);
        updateCardData(mergedData);
        
        // 更新已填写字段列表
        setUpdatedFields(prev => {
            const combined = [...new Set([...prev, ...newlyUpdatedFields])];
            return combined;
        });
        
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
                hometown: '家乡',
                residence: '常驻',
                hobbies: '兴趣爱好',
                personality: '性格特点',
                focusIndustry: '关注行业',
                circles: '圈层',
                companyIntro: '公司简介',
            };
            return fieldMap[field] || field;
        }).join('、');
        
        const updateMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: `✅ 已确认更新：${fieldNames}`,
            isUser: false,
            timestamp: new Date(),
        };
        
        // 删除原始的 AI 消息（带确认卡片的那条），只保留确认提示
        setMessages(prev => prev.filter(msg => msg.id !== pendingUpdate.messageId).concat(updateMessage));
        
        // 保存确认消息并重新保存整个会话
        await ChatPersistenceService.saveMessages(
            messages.filter(msg => msg.id !== pendingUpdate.messageId).concat(updateMessage),
            sessionId
        );
        
        // 清除待确认更新
        setPendingUpdate(null);
        
        // 发送确认消息给 AI，获取下一步引导并展示
        setLoading(true);
        try {
            const confirmationMessage = `已确认更新：${fieldNames}。请继续引导我填写下一个内容。`;
            
            const rawResponse = await callN8NAgent(
                N8N_CONFIG.agentWebhookPath,
                confirmationMessage,
                sessionId
            );
            
            const parsedResponse = parseAIResponse(rawResponse);
            
            // 展示 AI 的响应
            const aiMessage: Message = {
                id: (Date.now() + 3).toString(),
                text: parsedResponse.output,
                isUser: false,
                timestamp: new Date(),
            };
            
            setMessages(prev => [...prev, aiMessage]);
            
            // 保存 AI 响应
            await ChatPersistenceService.saveMessage(aiMessage, sessionId);
            
            // 如果 AI 又返回了新的表单数据，继续存储为待确认
            if (parsedResponse.formData) {
                setPendingUpdate({
                    formData: parsedResponse.formData,
                    messageId: aiMessage.id,
                });
                
                if (parsedResponse.completed) {
                    setFormCompleted(true);
                }
            }
        } catch (error) {
            console.error('Error getting next guidance:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const cancelUpdate = () => {
        setPendingUpdate(null);
    };

    const renderMessage = (message: Message) => {
        // 检查这条消息是否有待确认的更新
        const hasPendingUpdate = pendingUpdate && pendingUpdate.messageId === message.id;
        
        return (
            <View 
                key={message.id} 
                style={[
                    styles.messageContainer,
                    message.isUser ? styles.userMessage : styles.aiMessage
                ]}
            >
                {/* 用户消息：正常显示 */}
                {message.isUser ? (
                    <View style={[styles.messageBubble, styles.userBubble]}>
                        <Text style={styles.userText}>
                            {message.text}
                        </Text>
                        <Text style={styles.timestamp}>
                            {message.timestamp.toLocaleTimeString('zh-CN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </Text>
                    </View>
                ) : (
                    /* AI 消息：如果有待确认更新，只显示字段信息；否则显示完整消息 */
                    hasPendingUpdate ? (
                        <View style={styles.updateCard}>
                            <View style={styles.updateHeader}>
                                <MaterialIcons name="edit" size={18} color="#4F46E5" />
                                <Text style={styles.updateTitle}>请确认以下信息</Text>
                            </View>
                            {Object.entries(pendingUpdate.formData).map(([key, value]) => {
                                if (value === undefined || value === null) return null;
                                
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
                                    hometown: '家乡',
                                    residence: '常驻',
                                    hobbies: '兴趣爱好',
                                    personality: '性格特点',
                                    focusIndustry: '关注行业',
                                    circles: '圈层',
                                    companyIntro: '公司简介',
                                };
                                
                                const fieldName = fieldMap[key] || key;
                                
                                return (
                                    <View key={key} style={styles.fieldItem}>
                                        <Text style={styles.fieldLabel}>{fieldName}</Text>
                                        <Text style={styles.fieldValue}>{String(value)}</Text>
                                    </View>
                                );
                            })}
                            <View style={styles.confirmButtons}>
                                <TouchableOpacity 
                                    style={styles.confirmButton}
                                    onPress={confirmUpdate}
                                >
                                    <MaterialIcons name="check" size={18} color="#ffffff" />
                                    <Text style={styles.confirmButtonText}>确认更新</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.cancelButton}
                                    onPress={cancelUpdate}
                                >
                                    <MaterialIcons name="close" size={18} color="#64748b" />
                                    <Text style={styles.cancelButtonText}>取消</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.messageBubble, styles.aiBubble]}>
                            <Markdown style={markdownStyles}>
                                {message.text}
                            </Markdown>
                            <Text style={styles.timestamp}>
                                {message.timestamp.toLocaleTimeString('zh-CN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </Text>
                        </View>
                    )
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <MaterialIcons name="smart-toy" size={24} color="#4F46E5" />
                    <Text style={styles.headerTitle}>AI 名片助手</Text>
                </View>
                <TouchableOpacity 
                    style={styles.progressContainer}
                    onPress={handleProgressPress}
                    activeOpacity={0.7}
                >
                    <View style={styles.progressInfo}>
                        <Text style={styles.progressText}>{progressInfo.progress}%</Text>
                        <Text style={styles.progressLabel}>完成度</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${progressInfo.progress}%` }]} />
                    </View>
                    <View style={styles.qualityBadge}>
                        <MaterialIcons name="star" size={14} color="#f59e0b" />
                        <Text style={styles.qualityText}>{progressInfo.progress}分</Text>
                    </View>
                </TouchableOpacity>
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
        marginTop: 4,
    },
    updateCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    updateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    updateTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4F46E5',
    },
    fieldItem: {
        marginBottom: 12,
    },
    fieldLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 4,
        fontWeight: '500',
    },
    fieldValue: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    confirmButtons: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 8,
    },
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    confirmButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    cancelButtonText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
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
