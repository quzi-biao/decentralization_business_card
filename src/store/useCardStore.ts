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
        realName: "谢正标",
        position: "首席产品架构师",
        companyName: "深度智能科技有限公司",
        industry: "人工智能",
        
        // 联系方式
        phone: "138-0000-0000",
        email: "zhengbiao@deepmind.ai",
        wechat: "zhengbiao_wx",
        address: "北京市朝阳区望京SOHO T3座",
        
        // 个人信息
        aboutMe: "10年产品经验，专注AI领域，擅长将前沿技术转化为商业价值。曾主导多个千万级用户产品的从0到1。",
        hometown: "浙江杭州",
        residence: "北京朝阳",
        hobbies: "阅读、跑步、摄影、科技产品体验",
        personality: "务实、创新、善于沟通、结果导向",
        focusIndustry: "人工智能、企业服务、SaaS",
        circles: "清华校友会、AI产品经理社群、创业者联盟",
        
        // 企业信息
        companyIntro: "深度智能科技成立于2020年，是一家专注于AI驱动的企业级解决方案提供商。公司致力于通过智能化技术提升企业效率，已服务超过500家企业客户，累计融资5000万元。核心团队来自清华、北大及BAT，拥有深厚的技术积累和行业经验。",
        mainBusiness: [
            { id: '1', name: 'AI内容创作平台', description: '为企业和个人提供AI驱动的内容生成服务，包括短视频脚本、营销文案、产品描述等，日均处理10万+内容请求' },
            { id: '2', name: 'B2B智能获客系统', description: '基于知识图谱和大数据分析，精准定位高意向企业客户，转化率提升300%' },
            { id: '3', name: '企业AI助手定制', description: '为企业定制专属AI助手，覆盖客服、销售、运营等多个场景' }
        ],
        serviceNeeds: [
            { id: '1', name: 'Pre-A轮融资', description: '寻求2000-3000万元融资，用于产品研发和市场拓展' },
            { id: '2', name: '技术人才', description: '招聘资深AI工程师、大模型算法专家、全栈开发工程师' },
            { id: '3', name: '战略合作', description: '寻找行业头部企业建立战略合作关系，共同开拓市场' }
        ],
        companyImages: [],
        
        tags: ["AI", "SaaS", "产品", "架构", "创业"],
        themeColor: "#3b82f6"
    },
    updateCardData: (newData) => set((state) => ({
        cardData: { ...state.cardData, ...newData }
    })),
}));
