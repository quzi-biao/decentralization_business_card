import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusinessCardData } from './useCardStore';

/**
 * 名片交换状态管理
 */

export interface CardExchange {
    id: string;
    myDid: string;
    peerDid: string;
    peerPublicKey: string;
    peerStorageUrl: string;
    exchangedAt: number;
    lastSyncAt: number;
    status: 'active' | 'revoked';
    tags?: string[];
    note?: string;
}

export interface ExchangedCard {
    exchange: CardExchange;
    cardData: BusinessCardData | null;
    isDecrypted: boolean;
}

interface ExchangeStore {
    exchanges: CardExchange[];
    exchangedCards: Map<string, ExchangedCard>;
    
    // 操作
    addExchange: (exchange: CardExchange) => Promise<void>;
    removeExchange: (peerDid: string) => Promise<void>;
    updateExchange: (peerDid: string, updates: Partial<CardExchange>) => Promise<void>;
    setExchangedCard: (peerDid: string, cardData: BusinessCardData) => Promise<void>;
    revokeExchange: (peerDid: string) => Promise<void>;
    
    // 查询
    getExchange: (peerDid: string) => CardExchange | undefined;
    getExchangedCard: (peerDid: string) => ExchangedCard | undefined;
    getAllExchanges: () => CardExchange[];
    getActiveExchanges: () => CardExchange[];
    
    // 持久化
    loadExchanges: () => Promise<void>;
    saveExchanges: () => Promise<void>;
    saveExchangedCards: () => Promise<void>;
    loadExchangedCards: () => Promise<void>;
}

const EXCHANGES_KEY = 'card_exchanges';
const EXCHANGED_CARDS_KEY = 'exchanged_cards';

export const useExchangeStore = create<ExchangeStore>((set, get) => ({
    exchanges: [],
    exchangedCards: new Map(),
    
    addExchange: async (exchange: CardExchange) => {
        set((state) => ({
            exchanges: [...state.exchanges, exchange],
            exchangedCards: new Map(state.exchangedCards).set(exchange.peerDid, {
                exchange,
                cardData: null,
                isDecrypted: false
            })
        }));
        await get().saveExchanges();
    },
    
    removeExchange: async (peerDid: string) => {
        set((state) => {
            const newCards = new Map(state.exchangedCards);
            newCards.delete(peerDid);
            return {
                exchanges: state.exchanges.filter(e => e.peerDid !== peerDid),
                exchangedCards: newCards
            };
        });
        await get().saveExchanges();
    },
    
    updateExchange: async (peerDid: string, updates: Partial<CardExchange>) => {
        set((state) => ({
            exchanges: state.exchanges.map(e => 
                e.peerDid === peerDid ? { ...e, ...updates } : e
            )
        }));
        await get().saveExchanges();
    },
    
    setExchangedCard: async (peerDid: string, cardData: BusinessCardData) => {
        set((state) => {
            const newCards = new Map(state.exchangedCards);
            const existing = newCards.get(peerDid);
            if (existing) {
                newCards.set(peerDid, {
                    ...existing,
                    cardData,
                    isDecrypted: true
                });
            }
            return { exchangedCards: newCards };
        });
        await get().saveExchangedCards();
    },
    
    revokeExchange: async (peerDid: string) => {
        await get().updateExchange(peerDid, { status: 'revoked' });
    },
    
    getExchange: (peerDid: string) => {
        return get().exchanges.find(e => e.peerDid === peerDid);
    },
    
    getExchangedCard: (peerDid: string) => {
        return get().exchangedCards.get(peerDid);
    },
    
    getAllExchanges: () => {
        return get().exchanges;
    },
    
    getActiveExchanges: () => {
        return get().exchanges.filter(e => e.status === 'active');
    },
    
    loadExchanges: async () => {
        try {
            const exchangesJson = await AsyncStorage.getItem(EXCHANGES_KEY);
            if (exchangesJson) {
                const exchanges = JSON.parse(exchangesJson);
                const exchangedCards = new Map();
                exchanges.forEach((exchange: CardExchange) => {
                    exchangedCards.set(exchange.peerDid, {
                        exchange,
                        cardData: null,
                        isDecrypted: false
                    });
                });
                set({ exchanges, exchangedCards });
                await get().loadExchangedCards();
            }
        } catch (error) {
            console.error('Failed to load exchanges:', error);
        }
    },
    
    saveExchanges: async () => {
        try {
            const { exchanges } = get();
            await AsyncStorage.setItem(EXCHANGES_KEY, JSON.stringify(exchanges));
        } catch (error) {
            console.error('Failed to save exchanges:', error);
        }
    },
    
    saveExchangedCards: async () => {
        try {
            const { exchangedCards } = get();
            const cardsData: Record<string, BusinessCardData> = {};
            exchangedCards.forEach((value, key) => {
                if (value.cardData) {
                    cardsData[key] = value.cardData;
                }
            });
            await AsyncStorage.setItem(EXCHANGED_CARDS_KEY, JSON.stringify(cardsData));
        } catch (error) {
            console.error('Failed to save exchanged cards:', error);
        }
    },
    
    loadExchangedCards: async () => {
        try {
            const cardsJson = await AsyncStorage.getItem(EXCHANGED_CARDS_KEY);
            if (cardsJson) {
                const cardsData: Record<string, BusinessCardData> = JSON.parse(cardsJson);
                set((state) => {
                    const newCards = new Map(state.exchangedCards);
                    Object.entries(cardsData).forEach(([peerDid, cardData]) => {
                        const existing = newCards.get(peerDid);
                        if (existing) {
                            newCards.set(peerDid, {
                                ...existing,
                                cardData,
                                isDecrypted: true
                            });
                        }
                    });
                    return { exchangedCards: newCards };
                });
            }
        } catch (error) {
            console.error('Failed to load exchanged cards:', error);
        }
    }
}));
