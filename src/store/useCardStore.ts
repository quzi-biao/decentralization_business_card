import { create } from 'zustand';
import { CardPersistenceService } from '../services/cardPersistence';
import { ImageMigrationService } from '../utils/imageMigration';

export interface BusinessItem {
    id: string;
    name: string;
    description: string;
}

export interface BusinessCardData {
    // 基本信息
    avatarId?: string;         // 头像图片ID
    avatarUrl?: string;        // 头像URL（兼容旧数据）
    realName: string;          // 姓名
    position: string;          // 职位
    companyName: string;       // 公司名称
    industry: string;          // 行业领域
    
    // 联系方式
    phone: string;             // 电话
    email: string;             // 邮箱
    wechat: string;            // 微信
    wechatQrCodeId?: string;   // 微信二维码图片ID
    wechatQrCode?: string;     // 微信二维码URL（兼容旧数据）
    address: string;           // 地址
    
    // 个人信息
    aboutMe: string;           // 关于我
    hometown: string;          // 家乡
    residence: string;         // 常驻
    hobbies: string;           // 兴趣爱好
    personality: string;       // 性格特点
    focusIndustry: string;     // 关注行业
    circles: string;           // 加入的圈层
    
    // 企业信息
    companyIntro: string;      // 公司简介
    mainBusiness: BusinessItem[];  // 主营业务
    serviceNeeds: BusinessItem[];  // 近期需求的资源
    companyImageIds: string[]; // 公司图片ID列表
    companyImages: string[];   // 公司图片（兼容旧数据）
    
    // 多媒体
    introVideoUrl?: string;    // 个人介绍视频URL
    videoChannelId?: string;   // 视频号ID
    
    // 其他
    tags: string[];
    themeColor: string;
}

interface CardStore {
    cardData: BusinessCardData;
    exchangedCards: BusinessCardData[];
    isLoaded: boolean;
    updateCardData: (data: Partial<BusinessCardData>) => Promise<void>;
    addExchangedCard: (card: BusinessCardData) => Promise<void>;
    removeExchangedCard: (card: BusinessCardData) => Promise<void>;
    loadData: () => Promise<void>;
    clearAllData: () => Promise<void>;
}

const defaultCardData: BusinessCardData = {
    // 基本信息
    realName: "",
    position: "",
    companyName: "",
    industry: "",
    
    // 联系方式
    phone: "",
    email: "",
    wechat: "",
    address: "",
    
    // 个人信息
    aboutMe: "",
    hometown: "",
    residence: "",
    hobbies: "",
    personality: "",
    focusIndustry: "",
    circles: "",
    
    // 企业信息
    companyIntro: "",
    mainBusiness: [],
    serviceNeeds: [],
    companyImageIds: [],
    companyImages: [],
    
    tags: [],
    themeColor: "#4F46E5"
};

export const useCardStore = create<CardStore>((set, get) => ({
    cardData: defaultCardData,
    exchangedCards: [],
    isLoaded: false,
    
    updateCardData: async (newData) => {
        const updatedData = { ...get().cardData, ...newData };
        set({ cardData: updatedData });
        await CardPersistenceService.saveMyCard(updatedData);
    },
    
    addExchangedCard: async (card) => {
        await CardPersistenceService.addExchangedCard(card);
        const cards = await CardPersistenceService.getExchangedCards();
        set({ exchangedCards: cards });
    },
    
    removeExchangedCard: async (card) => {
        await CardPersistenceService.deleteExchangedCard(card);
        const cards = await CardPersistenceService.getExchangedCards();
        set({ exchangedCards: cards });
    },
    
    loadData: async () => {
        const myCard = await CardPersistenceService.getMyCard();
        const exchangedCards = await CardPersistenceService.getExchangedCards();
        
        // 检查是否需要迁移图片数据
        const needsMigration = myCard && ImageMigrationService.needsMigration(myCard);
        
        if (needsMigration) {
            console.log('Migrating image data to FileSystem...');
            const migrationResult = await ImageMigrationService.migrateAllCards(
                myCard || defaultCardData,
                exchangedCards
            );
            
            if (migrationResult.migrated) {
                // 保存迁移后的数据
                await CardPersistenceService.saveMyCard(migrationResult.myCard);
                for (const card of migrationResult.exchangedCards) {
                    await CardPersistenceService.addExchangedCard(card);
                }
                
                set({
                    cardData: migrationResult.myCard,
                    exchangedCards: migrationResult.exchangedCards,
                    isLoaded: true
                });
                console.log('Image migration completed');
                return;
            }
        }
        
        set({
            cardData: myCard || defaultCardData,
            exchangedCards: exchangedCards,
            isLoaded: true
        });
    },
    
    clearAllData: async () => {
        await CardPersistenceService.clearAllCards();
        set({
            cardData: defaultCardData,
            exchangedCards: [],
            isLoaded: true
        });
    }
}));
