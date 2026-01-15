import { EncryptedStorageService } from './encryptedStorage';
import { BusinessCardData } from '../store/useCardStore';

const MY_CARD_KEY = 'my_card_data';
const EXCHANGED_CARDS_KEY = 'exchanged_cards';

export class CardPersistenceService {
    // 保存我的名片
    static async saveMyCard(cardData: BusinessCardData): Promise<void> {
        await EncryptedStorageService.setItem(MY_CARD_KEY, cardData);
    }

    // 获取我的名片
    static async getMyCard(): Promise<BusinessCardData | null> {
        return await EncryptedStorageService.getItem<BusinessCardData>(MY_CARD_KEY);
    }

    // 保存交换的名片列表
    static async saveExchangedCards(cards: BusinessCardData[]): Promise<void> {
        await EncryptedStorageService.setItem(EXCHANGED_CARDS_KEY, cards);
    }

    // 获取交换的名片列表
    static async getExchangedCards(): Promise<BusinessCardData[]> {
        const cards = await EncryptedStorageService.getItem<BusinessCardData[]>(EXCHANGED_CARDS_KEY);
        return cards || [];
    }

    // 添加一张交换的名片
    static async addExchangedCard(card: BusinessCardData): Promise<void> {
        const cards = await this.getExchangedCards();
        
        // 检查是否已存在（根据某个唯一标识，这里假设用 realName + companyName）
        const existingIndex = cards.findIndex(
            c => c.realName === card.realName && c.companyName === card.companyName
        );
        
        if (existingIndex >= 0) {
            // 更新现有名片
            cards[existingIndex] = card;
        } else {
            // 添加新名片
            cards.push(card);
        }
        
        await this.saveExchangedCards(cards);
    }

    // 更新一张交换的名片
    static async updateExchangedCard(card: BusinessCardData): Promise<void> {
        const cards = await this.getExchangedCards();
        
        const existingIndex = cards.findIndex(
            c => c.realName === card.realName && c.companyName === card.companyName
        );
        
        if (existingIndex >= 0) {
            cards[existingIndex] = card;
            await this.saveExchangedCards(cards);
        }
    }

    // 删除一张交换的名片
    static async deleteExchangedCard(card: BusinessCardData): Promise<void> {
        const cards = await this.getExchangedCards();
        const filteredCards = cards.filter(
            c => !(c.realName === card.realName && c.companyName === card.companyName)
        );
        await this.saveExchangedCards(filteredCards);
    }

    // 清除所有名片数据
    static async clearAllCards(): Promise<void> {
        await EncryptedStorageService.removeItem(MY_CARD_KEY);
        await EncryptedStorageService.removeItem(EXCHANGED_CARDS_KEY);
    }
}
