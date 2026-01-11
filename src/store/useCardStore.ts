import { create } from 'zustand';

export interface BusinessItem {
    id: string;
    name: string;
    description: string;
}

export interface BusinessCardData {
    // 基本信息
    avatarUrl?: string;        // 头像URL
    realName: string;          // 姓名
    position: string;          // 职位
    companyName: string;       // 公司名称
    industry: string;          // 行业领域
    
    // 联系方式
    phone: string;             // 电话
    email: string;             // 邮箱
    wechat: string;            // 微信
    wechatQrCode?: string;     // 微信二维码URL
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
    companyImages: string[];   // 公司图片
    
    // 多媒体
    introVideoUrl?: string;    // 个人介绍视频URL
    videoChannelId?: string;   // 视频号ID
    
    // 其他
    tags: string[];
    themeColor: string;
}

interface CardStore {
    cardData: BusinessCardData;
    updateCardData: (data: Partial<BusinessCardData>) => void;
}

export const useCardStore = create<CardStore>((set) => ({
    cardData: {
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
        companyImages: [],
        
        tags: [],
        themeColor: "#4F46E5"
    },
    updateCardData: (newData) => set((state) => ({
        cardData: { ...state.cardData, ...newData }
    })),
}));
