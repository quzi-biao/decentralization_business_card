import { EncryptedStorageService } from './encryptedStorage';

export interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
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
}
