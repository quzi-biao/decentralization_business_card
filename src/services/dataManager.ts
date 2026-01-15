import { EncryptedStorageService } from './encryptedStorage';
import { ChatPersistenceService } from './chatPersistence';
import { CardPersistenceService } from './cardPersistence';
import { fileManager } from './fileManager';

/**
 * 数据管理服务
 * 提供统一的数据清除和管理功能
 */
export class DataManager {
    /**
     * 清除所有应用数据
     * 包括：聊天记录、名片数据、图片文件、加密存储
     */
    static async clearAllData(): Promise<void> {
        try {
            // 清除聊天记录
            await ChatPersistenceService.clearAllChats();
            
            // 清除名片数据
            await CardPersistenceService.clearAllCards();
            
            // 清除所有文件（头像、图片）
            await fileManager.clearAllFiles();
            
            // 清除所有加密存储
            await EncryptedStorageService.clear();
            
            console.log('All data cleared successfully');
        } catch (error) {
            console.error('Failed to clear all data:', error);
            throw error;
        }
    }

    /**
     * 清除所有聊天记录
     */
    static async clearChatHistory(): Promise<void> {
        try {
            await ChatPersistenceService.clearAllChats();
            console.log('Chat history cleared successfully');
        } catch (error) {
            console.error('Failed to clear chat history:', error);
            throw error;
        }
    }

    /**
     * 清除所有图片文件
     */
    static async clearAllImages(): Promise<void> {
        try {
            await fileManager.clearAllFiles();
            console.log('All images cleared successfully');
        } catch (error) {
            console.error('Failed to clear images:', error);
            throw error;
        }
    }

    /**
     * 获取数据统计信息
     */
    static async getDataStats(): Promise<{
        chatDates: number;
        myCardExists: boolean;
        exchangedCardsCount: number;
        avatarsCount: number;
        imagesCount: number;
    }> {
        try {
            const chatDates = await ChatPersistenceService.getAllChatDates();
            const myCard = await CardPersistenceService.getMyCard();
            const exchangedCards = await CardPersistenceService.getExchangedCards();
            const fileStats = await fileManager.getStorageStats();

            // 统计头像数量（profile context）
            const avatarsCount = fileStats.byContext.profile || 0;
            // 统计其他图片数量（chat + card context）
            const imagesCount = (fileStats.byContext.chat || 0) + (fileStats.byContext.card || 0);

            return {
                chatDates: chatDates.length,
                myCardExists: !!myCard,
                exchangedCardsCount: exchangedCards.length,
                avatarsCount: avatarsCount,
                imagesCount: imagesCount
            };
        } catch (error) {
            console.error('Failed to get data stats:', error);
            throw error;
        }
    }

    /**
     * 导出所有数据（用于备份）
     */
    static async exportAllData(): Promise<{
        chats: any[];
        myCard: any;
        exchangedCards: any[];
        exportDate: string;
    }> {
        try {
            const chats = await ChatPersistenceService.getAllChats();
            const myCard = await CardPersistenceService.getMyCard();
            const exchangedCards = await CardPersistenceService.getExchangedCards();

            return {
                chats,
                myCard,
                exchangedCards,
                exportDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to export data:', error);
            throw error;
        }
    }
}
