import { EncryptedStorageService } from './encryptedStorage';

export interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    imageUrl?: string; // 向后兼容，优先使用 imageLocalPath
    imageLocalPath?: string; // 本地路径，用于显示
    imageMinioUrl?: string; // MinIO 链接，用于发送给 AI
}

export interface ChatSession {
    date: string; // YYYY-MM-DD
    messages: Message[];
    sessionId: string;
}

const CHAT_HISTORY_PREFIX = 'chat_history_';
const CHAT_INDEX_KEY = 'chat_index';

export class ChatPersistenceService {
    private static getDateKey(date: Date): string {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    static async saveMessage(message: Message, sessionId: string): Promise<void> {
        const dateKey = this.getDateKey(message.timestamp);
        const storageKey = `${CHAT_HISTORY_PREFIX}${dateKey}`;
        
        // 获取当天的聊天记录
        let session = await EncryptedStorageService.getItem<ChatSession>(storageKey);
        
        if (!session) {
            session = {
                date: dateKey,
                messages: [],
                sessionId: sessionId
            };
        }
        
        // 添加新消息
        session.messages.push({
            ...message,
            timestamp: message.timestamp // 确保是 Date 对象
        });
        
        // 保存
        await EncryptedStorageService.setItem(storageKey, session);
        
        // 更新索引
        await this.updateIndex(dateKey);
    }

    static async saveMessages(messages: Message[], sessionId: string): Promise<void> {
        // 按日期分组
        const messagesByDate = new Map<string, Message[]>();
        
        for (const message of messages) {
            const dateKey = this.getDateKey(message.timestamp);
            if (!messagesByDate.has(dateKey)) {
                messagesByDate.set(dateKey, []);
            }
            messagesByDate.get(dateKey)!.push(message);
        }
        
        // 保存每天的消息
        for (const [dateKey, msgs] of messagesByDate.entries()) {
            const storageKey = `${CHAT_HISTORY_PREFIX}${dateKey}`;
            let session = await EncryptedStorageService.getItem<ChatSession>(storageKey);
            
            if (!session) {
                session = {
                    date: dateKey,
                    messages: [],
                    sessionId: sessionId
                };
            }
            
            session.messages = msgs.map(msg => ({
                ...msg,
                timestamp: msg.timestamp
            }));
            
            await EncryptedStorageService.setItem(storageKey, session);
            await this.updateIndex(dateKey);
        }
    }

    static async getChatByDate(date: string): Promise<ChatSession | null> {
        const storageKey = `${CHAT_HISTORY_PREFIX}${date}`;
        const session = await EncryptedStorageService.getItem<ChatSession>(storageKey);
        
        if (session) {
            // 将时间戳字符串转换回 Date 对象
            session.messages = session.messages.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }));
        }
        
        return session;
    }

    static async getTodayChat(): Promise<ChatSession | null> {
        const today = this.getDateKey(new Date());
        return this.getChatByDate(today);
    }

    static async getAllChatDates(): Promise<string[]> {
        const index = await EncryptedStorageService.getItem<string[]>(CHAT_INDEX_KEY);
        return index || [];
    }

    static async getAllChats(): Promise<ChatSession[]> {
        const dates = await this.getAllChatDates();
        const chats: ChatSession[] = [];
        
        for (const date of dates) {
            const chat = await this.getChatByDate(date);
            if (chat) {
                chats.push(chat);
            }
        }
        
        return chats.sort((a, b) => b.date.localeCompare(a.date)); // 最新的在前
    }

    static async deleteChatByDate(date: string): Promise<void> {
        const storageKey = `${CHAT_HISTORY_PREFIX}${date}`;
        await EncryptedStorageService.removeItem(storageKey);
        
        // 更新索引
        const index = await EncryptedStorageService.getItem<string[]>(CHAT_INDEX_KEY) || [];
        const newIndex = index.filter(d => d !== date);
        await EncryptedStorageService.setItem(CHAT_INDEX_KEY, newIndex);
    }

    static async clearAllChats(): Promise<void> {
        const dates = await this.getAllChatDates();
        
        for (const date of dates) {
            const storageKey = `${CHAT_HISTORY_PREFIX}${date}`;
            await EncryptedStorageService.removeItem(storageKey);
        }
        
        await EncryptedStorageService.removeItem(CHAT_INDEX_KEY);
    }

    private static async updateIndex(dateKey: string): Promise<void> {
        const index = await EncryptedStorageService.getItem<string[]>(CHAT_INDEX_KEY) || [];
        
        if (!index.includes(dateKey)) {
            index.push(dateKey);
            index.sort((a, b) => b.localeCompare(a)); // 最新的在前
            await EncryptedStorageService.setItem(CHAT_INDEX_KEY, index);
        }
    }

    // 修复重复的消息 ID（特别是 welcome 消息）
    static async fixDuplicateMessageIds(): Promise<void> {
        const dates = await this.getAllChatDates();
        
        for (const date of dates) {
            const chat = await this.getChatByDate(date);
            if (!chat) continue;
            
            const seenIds = new Set<string>();
            let hasChanges = false;
            let counter = 0;
            
            const fixedMessages = chat.messages.map(msg => {
                // 检查 ID 是否包含特殊字符或是否重复
                const hasSpecialChars = /[$]/.test(msg.id);
                const isDuplicate = seenIds.has(msg.id);
                
                if (isDuplicate || hasSpecialChars) {
                    // 生成新的唯一 ID（不包含特殊字符）
                    hasChanges = true;
                    counter++;
                    const timestamp = Date.now();
                    const random = Math.random().toString(36).substr(2, 9);
                    const newId = `msg_${timestamp}_${counter}_${random}`;
                    seenIds.add(newId);
                    return {
                        ...msg,
                        id: newId
                    };
                }
                seenIds.add(msg.id);
                return msg;
            });
            
            if (hasChanges) {
                const storageKey = `${CHAT_HISTORY_PREFIX}${date}`;
                await EncryptedStorageService.setItem(storageKey, {
                    ...chat,
                    messages: fixedMessages
                });
            }
        }
    }
}
