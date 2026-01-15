import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 标签数据结构
 */
export interface Tag {
    id: string;
    name: string;
    color: string;
    createdAt: number;
}

/**
 * 名片元数据（标签和备注）
 */
export interface CardMetadata {
    peerDid: string;
    tags: string[]; // tag IDs
    note: string;
    updatedAt: number;
}

interface TagStore {
    tags: Tag[];
    cardMetadata: Map<string, CardMetadata>; // key: peerDid
    
    // 标签操作
    addTag: (tag: Omit<Tag, 'id' | 'createdAt'>) => Promise<void>;
    updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
    deleteTag: (id: string) => Promise<void>;
    getTag: (id: string) => Tag | undefined;
    getAllTags: () => Tag[];
    
    // 名片元数据操作
    setCardMetadata: (peerDid: string, metadata: Partial<Omit<CardMetadata, 'peerDid' | 'updatedAt'>>) => Promise<void>;
    getCardMetadata: (peerDid: string) => CardMetadata | undefined;
    addTagToCard: (peerDid: string, tagId: string) => Promise<void>;
    removeTagFromCard: (peerDid: string, tagId: string) => Promise<void>;
    setCardNote: (peerDid: string, note: string) => Promise<void>;
    
    // 持久化
    loadTags: () => Promise<void>;
    saveTags: () => Promise<void>;
    loadCardMetadata: () => Promise<void>;
    saveCardMetadata: () => Promise<void>;
}

const TAGS_KEY = 'card_tags';
const CARD_METADATA_KEY = 'card_metadata';

// 预设颜色
export const TAG_COLORS = [
    '#ef4444', // 红色
    '#f59e0b', // 橙色
    '#eab308', // 黄色
    '#22c55e', // 绿色
    '#06b6d4', // 青色
    '#3b82f6', // 蓝色
    '#8b5cf6', // 紫色
    '#ec4899', // 粉色
    '#64748b', // 灰色
];

export const useTagStore = create<TagStore>((set, get) => ({
    tags: [],
    cardMetadata: new Map(),
    
    addTag: async (tagData) => {
        const newTag: Tag = {
            ...tagData,
            id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
        };
        set((state) => ({
            tags: [...state.tags, newTag]
        }));
        await get().saveTags();
    },
    
    updateTag: async (id, updates) => {
        set((state) => ({
            tags: state.tags.map(tag => 
                tag.id === id ? { ...tag, ...updates } : tag
            )
        }));
        await get().saveTags();
    },
    
    deleteTag: async (id) => {
        // 删除标签时，也要从所有名片中移除该标签
        set((state) => {
            const newMetadata = new Map(state.cardMetadata);
            newMetadata.forEach((metadata, peerDid) => {
                if (metadata.tags.includes(id)) {
                    newMetadata.set(peerDid, {
                        ...metadata,
                        tags: metadata.tags.filter(tagId => tagId !== id),
                        updatedAt: Date.now()
                    });
                }
            });
            return {
                tags: state.tags.filter(tag => tag.id !== id),
                cardMetadata: newMetadata
            };
        });
        await get().saveTags();
        await get().saveCardMetadata();
    },
    
    getTag: (id) => {
        return get().tags.find(tag => tag.id === id);
    },
    
    getAllTags: () => {
        return get().tags;
    },
    
    setCardMetadata: async (peerDid, metadata) => {
        set((state) => {
            const newMetadata = new Map(state.cardMetadata);
            const existing = newMetadata.get(peerDid);
            newMetadata.set(peerDid, {
                peerDid,
                tags: existing?.tags || [],
                note: existing?.note || '',
                ...metadata,
                updatedAt: Date.now()
            });
            return { cardMetadata: newMetadata };
        });
        await get().saveCardMetadata();
    },
    
    getCardMetadata: (peerDid) => {
        return get().cardMetadata.get(peerDid);
    },
    
    addTagToCard: async (peerDid, tagId) => {
        set((state) => {
            const newMetadata = new Map(state.cardMetadata);
            const existing = newMetadata.get(peerDid);
            const currentTags = existing?.tags || [];
            
            if (!currentTags.includes(tagId)) {
                newMetadata.set(peerDid, {
                    peerDid,
                    tags: [...currentTags, tagId],
                    note: existing?.note || '',
                    updatedAt: Date.now()
                });
            }
            return { cardMetadata: newMetadata };
        });
        await get().saveCardMetadata();
    },
    
    removeTagFromCard: async (peerDid, tagId) => {
        set((state) => {
            const newMetadata = new Map(state.cardMetadata);
            const existing = newMetadata.get(peerDid);
            if (existing) {
                newMetadata.set(peerDid, {
                    ...existing,
                    tags: existing.tags.filter(id => id !== tagId),
                    updatedAt: Date.now()
                });
            }
            return { cardMetadata: newMetadata };
        });
        await get().saveCardMetadata();
    },
    
    setCardNote: async (peerDid, note) => {
        await get().setCardMetadata(peerDid, { note });
    },
    
    loadTags: async () => {
        try {
            const tagsJson = await AsyncStorage.getItem(TAGS_KEY);
            if (tagsJson) {
                const tags = JSON.parse(tagsJson);
                set({ tags });
            }
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    },
    
    saveTags: async () => {
        try {
            const { tags } = get();
            await AsyncStorage.setItem(TAGS_KEY, JSON.stringify(tags));
        } catch (error) {
            console.error('Failed to save tags:', error);
        }
    },
    
    loadCardMetadata: async () => {
        try {
            const metadataJson = await AsyncStorage.getItem(CARD_METADATA_KEY);
            if (metadataJson) {
                const metadataArray: CardMetadata[] = JSON.parse(metadataJson);
                const cardMetadata = new Map();
                metadataArray.forEach(metadata => {
                    cardMetadata.set(metadata.peerDid, metadata);
                });
                set({ cardMetadata });
            }
        } catch (error) {
            console.error('Failed to load card metadata:', error);
        }
    },
    
    saveCardMetadata: async () => {
        try {
            const { cardMetadata } = get();
            const metadataArray = Array.from(cardMetadata.values());
            await AsyncStorage.setItem(CARD_METADATA_KEY, JSON.stringify(metadataArray));
        } catch (error) {
            console.error('Failed to save card metadata:', error);
        }
    }
}));
