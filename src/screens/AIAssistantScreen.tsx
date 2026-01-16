import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCardStore } from '../store/useCardStore';
import { callN8NAgent } from '../services/n8nService';
import { N8N_CONFIG } from '../config/n8n.config';
import { parseAIResponse, hasCompleteFormData, mergeFormData, generateFormSummary } from '../utils/formDataParser';
import { ChatPersistenceService } from '../services/chatPersistence';
import { FIELD_DISPLAY_NAMES } from '../constants/fieldNames';
import ChatMessage from '../components/ChatMessage';
import UpdateConfirmCard from '../components/UpdateConfirmCard';
import ProgressHeader from '../components/ProgressHeader';
import ChatInput from '../components/ChatInput';
import ProgressDetailsModal from '../components/ProgressDetailsModal';
import PrivacyHelpModal from '../components/PrivacyHelpModal';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    imageUrl?: string; // 向后兼容
    imageLocalPath?: string; // 本地路径，用于显示
    imageMinioUrl?: string; // MinIO 链接，用于发送给 AI
    imageFileId?: string; // 文件管理器中的文件ID，用于删除
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
    const [loadedDates, setLoadedDates] = useState<string[]>([]);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [showPrivacyHelp, setShowPrivacyHelp] = useState(false);

    // 构建当前名片信息的通用方法（根据隐私设置过滤）
    const buildCurrentCardInfo = async (data: typeof cardData): Promise<string> => {
        const currentCardInfo: string[] = [];
        const privateFieldsStatus: string[] = [];
        
        // 加载字段隐私配置
        const { DataAccessControlService } = await import('../services/dataAccessControl');
        const fields = await DataAccessControlService.loadFieldVisibility();
        
        // 创建字段映射
        const fieldMap: Record<string, { name: string; getValue: (d: typeof cardData) => any }> = {
            avatar: { name: FIELD_DISPLAY_NAMES.avatar, getValue: (d) => d.avatarId || d.avatarUrl },
            realName: { name: FIELD_DISPLAY_NAMES.realName, getValue: (d) => d.realName },
            position: { name: FIELD_DISPLAY_NAMES.position, getValue: (d) => d.position },
            companyName: { name: FIELD_DISPLAY_NAMES.companyName, getValue: (d) => d.companyName },
            industry: { name: FIELD_DISPLAY_NAMES.industry, getValue: (d) => d.industry },
            phone: { name: FIELD_DISPLAY_NAMES.phone, getValue: (d) => d.phone },
            email: { name: FIELD_DISPLAY_NAMES.email, getValue: (d) => d.email },
            wechat: { name: FIELD_DISPLAY_NAMES.wechat, getValue: (d) => d.wechat },
            wechatQrCode: { name: FIELD_DISPLAY_NAMES.wechatQrCode, getValue: (d) => d.wechatQrCodeId || d.wechatQrCode },
            address: { name: FIELD_DISPLAY_NAMES.address, getValue: (d) => d.address },
            aboutMe: { name: FIELD_DISPLAY_NAMES.aboutMe, getValue: (d) => d.aboutMe },
            hometown: { name: FIELD_DISPLAY_NAMES.hometown, getValue: (d) => d.hometown },
            residence: { name: FIELD_DISPLAY_NAMES.residence, getValue: (d) => d.residence },
            hobbies: { name: FIELD_DISPLAY_NAMES.hobbies, getValue: (d) => d.hobbies },
            personality: { name: FIELD_DISPLAY_NAMES.personality, getValue: (d) => d.personality },
            focusIndustry: { name: FIELD_DISPLAY_NAMES.focusIndustry, getValue: (d) => d.focusIndustry },
            circles: { name: FIELD_DISPLAY_NAMES.circles, getValue: (d) => d.circles },
            companyIntro: { name: FIELD_DISPLAY_NAMES.companyIntro, getValue: (d) => d.companyIntro },
            mainBusiness: { name: FIELD_DISPLAY_NAMES.mainBusiness, getValue: (d) => d.mainBusiness && d.mainBusiness.length > 0 ? d.mainBusiness.map((item: any) => item.name).join('、') : null },
            serviceNeeds: { name: FIELD_DISPLAY_NAMES.serviceNeeds, getValue: (d) => d.serviceNeeds && d.serviceNeeds.length > 0 ? d.serviceNeeds.map((item: any) => item.name).join('、') : null },
            companyImages: { name: FIELD_DISPLAY_NAMES.companyImages, getValue: (d) => (d.companyImageIds && d.companyImageIds.length > 0) || (d.companyImages && d.companyImages.length > 0) ? '已上传' : null },
            introVideoUrl: { name: FIELD_DISPLAY_NAMES.introVideoUrl, getValue: (d) => d.introVideoUrl },
            videoChannelId: { name: FIELD_DISPLAY_NAMES.videoChannelId, getValue: (d) => d.videoChannelId },
        };
        
        // 遍历字段配置
        fields.forEach(field => {
            const fieldInfo = fieldMap[field.id];
            if (!fieldInfo) return;
            
            const value = fieldInfo.getValue(data);
            const isFilled = value && value.toString().trim() !== '';
            
            if (isFilled) {
                if (field.isPrivate) {
                    // 隐私字段：只告知已填写，不显示具体内容
                    privateFieldsStatus.push(`${fieldInfo.name}：[已填写，隐私内容]`);
                } else {
                    // 非隐私字段：显示具体内容
                    if (field.id === 'avatar') {
                        currentCardInfo.push(`头像已上传`);
                    } else if (field.id === 'wechatQrCode') {
                        currentCardInfo.push(`微信二维码已上传`);
                    } else if (field.id === 'companyImages' && value === '已上传') {
                        currentCardInfo.push(`公司图片已上传`);
                    } else {
                        currentCardInfo.push(`${fieldInfo.name}：${value}`);
                    }
                }
            }
        });
        
        // 合并信息
        const allInfo = [...currentCardInfo, ...privateFieldsStatus];
        
        return allInfo.length > 0 
            ? `\n\n当前已填写的名片信息：\n${allInfo.join('\n')}` 
            : '';
    };

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
        setShowProgressModal(true);
    };

    useEffect(() => {
        // 使用 setTimeout 确保在消息渲染完成后再滚动
        const timer = setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        
        return () => clearTimeout(timer);
    }, [messages]);

    // 加载最近的聊天历史或初始化新对话
    useEffect(() => {
        const initializeChat = async () => {
            // 修复历史记录中的重复 ID
            await ChatPersistenceService.fixDuplicateMessageIds();
            
            // 获取所有聊天日期
            const allDates = await ChatPersistenceService.getAllChatDates();
            
            if (allDates.length > 0) {
                // 加载最近10条消息（跨日期）
                const recentMessages: Message[] = [];
                const loadedDatesList: string[] = [];
                
                for (const date of allDates) {
                    const chat = await ChatPersistenceService.getChatByDate(date);
                    if (chat && chat.messages.length > 0) {
                        // 从最新的消息开始添加
                        const remainingSlots = 10 - recentMessages.length;
                        const messagesToAdd = chat.messages.slice(-remainingSlots);
                        recentMessages.push(...messagesToAdd);
                        loadedDatesList.push(date);
                        
                        if (recentMessages.length >= 10) {
                            break;
                        }
                    }
                }
                
                if (recentMessages.length > 0) {
                    setMessages(recentMessages);
                    setLoadedDates(loadedDatesList);
                    setHasMoreHistory(loadedDatesList.length < allDates.length);
                    return;
                }
            }
            
            // 如果没有任何聊天记录，初始化新对话
            // 先显示隐私说明
            const privacyNotice: Message = {
                id: `privacy-${Date.now()}`,
                text: '🔒 **隐私保护说明**\n\n为了保护您的隐私，以下字段默认设置为隐私内容，AI 助手将无法看到具体内容：\n\n• 姓名\n• 电话\n• 邮箱\n• 微信号\n• 地址\n\n您可以在"访问控制"页面自定义隐私设置。AI 助手仍然知道这些字段是否已填写，但看不到具体内容。',
                isUser: false,
                timestamp: new Date(),
            };
            
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
                    id: `welcome-${Date.now() + 1}`,
                    text: parsedResponse.output,
                    isUser: false,
                    timestamp: new Date(),
                };
                
                setMessages([privacyNotice, welcomeMessage]);
                await ChatPersistenceService.saveMessage(privacyNotice, sessionId);
                await ChatPersistenceService.saveMessage(welcomeMessage, sessionId);
            } catch (error) {
                console.error('Failed to initialize chat:', error);
                const welcomeMessage: Message = {
                    id: `welcome-${Date.now() + 1}`,
                    text: '您好！我是您的名片信息收集助手 😊\n\n我会通过简单的对话，帮您一步步创建一张专业、完整的商务名片。整个过程大约需要5-10分钟，所有信息仅用于生成您的个人名片。\n\n您现在方便开始吗？如果准备好了，我们可以先从基本信息入手！',
                    isUser: false,
                    timestamp: new Date(),
                };
                setMessages([privacyNotice, welcomeMessage]);
                await ChatPersistenceService.saveMessage(privacyNotice, sessionId);
                await ChatPersistenceService.saveMessage(welcomeMessage, sessionId);
            }
        };

        initializeChat();
    }, []); // 只在组件挂载时执行一次

    // 加载更多历史记录
    const loadMoreHistory = async () => {
        if (loadingHistory || !hasMoreHistory) return;
        
        setLoadingHistory(true);
        try {
            const allDates = await ChatPersistenceService.getAllChatDates();
            const nextDateIndex = loadedDates.length;
            
            if (nextDateIndex >= allDates.length) {
                setHasMoreHistory(false);
                return;
            }
            
            const nextDate = allDates[nextDateIndex];
            const nextChat = await ChatPersistenceService.getChatByDate(nextDate);
            
            if (nextChat && nextChat.messages.length > 0) {
                // 将历史消息添加到开头
                setMessages(prev => [...nextChat.messages, ...prev]);
                setLoadedDates(prev => [...prev, nextDate]);
                setHasMoreHistory(nextDateIndex + 1 < allDates.length);
            }
        } catch (error) {
            console.error('Failed to load more history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const sendMessage = async (text: string, imageMinioUrl?: string, imageLocalPath?: string, imageFileId?: string) => {
        if ((!text.trim() && !imageMinioUrl) || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: text.trim() || (imageMinioUrl ? '发送了一张图片' : ''),
            isUser: true,
            timestamp: new Date(),
            imageMinioUrl,
            imageLocalPath,
            imageFileId,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setLoading(true);

        // 保存用户消息
        await ChatPersistenceService.saveMessage(userMessage, sessionId);

        try {
            // 构建发送内容，附加当前名片信息
            let messageContent = userMessage.text;
            if (imageMinioUrl) {
                messageContent = messageContent || '请帮我识别这张图片';
            }
            
            // 附加当前名片信息，帮助 AI 更好地理解上下文
            const cardInfoContext = await buildCurrentCardInfo(cardData);
            messageContent += cardInfoContext;

            // 调用 n8n AI Agent，传递图片 URL
            const rawResponse = await callN8NAgent(
                N8N_CONFIG.agentWebhookPath,
                messageContent,
                sessionId,
                false, // useAPI
                imageMinioUrl // 传递图片 URL 给 Vision API
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
                mainBusiness: '主营业务',
                serviceNeeds: '服务需求',
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
            // 使用通用方法构建当前名片信息
            const cardInfoContext = await buildCurrentCardInfo(mergedData);
            const confirmationMessage = `已确认更新：${fieldNames}。${cardInfoContext}\n\n请根据已有信息，引导我填写下一个缺失的内容。`;
            
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

    const handleDeleteMessage = async (messageId: string) => {
        try {
            // 从消息列表中删除
            const updatedMessages = messages.filter(msg => msg.id !== messageId);
            setMessages(updatedMessages);
            
            // 从持久化存储中删除
            await ChatPersistenceService.saveMessages(updatedMessages, sessionId);
        } catch (error) {
            console.error('Failed to delete message:', error);
            Alert.alert('错误', '删除消息失败');
        }
    };

    const handleResendMessage = async (message: Message) => {
        try {
            // 先删除原消息
            await handleDeleteMessage(message.id);
            
            // 重新发送
            await sendMessage(message.text, message.imageMinioUrl, message.imageLocalPath, message.imageFileId);
        } catch (error) {
            console.error('Failed to resend message:', error);
            Alert.alert('错误', '重发消息失败');
        }
    };

    const renderMessage = (message: Message, index: number) => {
        // 检查这条消息是否有待确认的更新
        const hasPendingUpdate = pendingUpdate && pendingUpdate.messageId === message.id;
        
        if (hasPendingUpdate) {
            return (
                <View key={`msg-${index}`} style={styles.messageContainer}>
                    <UpdateConfirmCard
                        formData={pendingUpdate.formData}
                        onConfirm={confirmUpdate}
                        onCancel={cancelUpdate}
                    />
                </View>
            );
        }
        
        return (
            <ChatMessage 
                key={`msg-${index}`} 
                message={message}
                onDelete={handleDeleteMessage}
                onResend={message.isUser ? handleResendMessage : undefined}
            />
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ProgressHeader
                progress={progressInfo.progress}
                filledCount={progressInfo.filledCount}
                totalCount={progressInfo.totalCount}
                onPress={handleProgressPress}
                cardData={cardData}
                sessionId={sessionId}
                autoEvaluate={true}
                onHelpPress={() => setShowPrivacyHelp(true)}
            />

            <KeyboardAvoidingView 
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={loadingHistory}
                            onRefresh={loadMoreHistory}
                            tintColor="#4F46E5"
                            title={hasMoreHistory ? "加载更多历史记录" : "没有更多记录"}
                            titleColor="#64748b"
                        />
                    }
                >
                    {messages.map(renderMessage)}
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#4F46E5" />
                            <Text style={styles.loadingText}>AI 正在思考...</Text>
                        </View>
                    )}
                </ScrollView>

                <ChatInput
                    value={inputText}
                    onChangeText={setInputText}
                    onSend={sendMessage}
                    disabled={loading}
                    placeholder="输入消息..."
                />
            </KeyboardAvoidingView>
            
            <PrivacyHelpModal
                visible={showPrivacyHelp}
                onClose={() => setShowPrivacyHelp(false)}
            />
            
            <ProgressDetailsModal
                visible={showProgressModal}
                onClose={() => setShowProgressModal(false)}
                cardData={cardData}
                progress={progressInfo.progress}
                filledCount={progressInfo.filledCount}
                totalCount={progressInfo.totalCount}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
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
});

export default AIAssistantScreen;
