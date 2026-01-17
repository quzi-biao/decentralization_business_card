# 社交媒体账号功能使用说明

## 功能概述

名片系统现已支持添加多个社交媒体账号，包括：

- **微博** (weibo)
- **视频号** (wechatChannel)
- **抖音** (douyin)
- **小红书** (xiaohongshu)
- **公众号** (wechatOfficialAccount)
- **语雀** (yuque)
- **Twitter/X** (twitter)
- **Telegram** (telegram)
- **Discord** (discord)
- **Facebook** (facebook)
- **LinkedIn** (linkedin)
- **Instagram** (instagram)
- **YouTube** (youtube)

## 数据结构

### SocialMediaAccount 接口

```typescript
interface SocialMediaAccount {
    id: string;                    // 唯一标识
    platform: SocialMediaPlatform; // 平台类型
    accountId: string;             // 账号ID/用户名
    displayName?: string;          // 显示名称（可选）
    url?: string;                  // 自定义链接（可选）
}
```

### 示例数据

```json
{
  "socialMedia": [
    {
      "id": "1",
      "platform": "weibo",
      "accountId": "zhangsan",
      "displayName": "张三的微博"
    },
    {
      "id": "2",
      "platform": "linkedin",
      "accountId": "zhang-san",
      "displayName": "Zhang San"
    },
    {
      "id": "3",
      "platform": "twitter",
      "accountId": "zhangsan_tech",
      "url": "https://twitter.com/zhangsan_tech"
    }
  ]
}
```

## 链接生成规则

系统会根据平台类型自动生成链接：

| 平台 | URL 模板 | 示例 |
|------|----------|------|
| 微博 | `https://weibo.com/{accountId}` | https://weibo.com/zhangsan |
| Twitter | `https://twitter.com/{accountId}` | https://twitter.com/zhangsan |
| LinkedIn | `https://linkedin.com/in/{accountId}` | https://linkedin.com/in/zhang-san |
| Instagram | `https://instagram.com/{accountId}` | https://instagram.com/zhangsan |
| YouTube | `https://youtube.com/@{accountId}` | https://youtube.com/@zhangsan |
| Facebook | `https://facebook.com/{accountId}` | https://facebook.com/zhangsan |
| Telegram | `https://t.me/{accountId}` | https://t.me/zhangsan |
| 语雀 | `https://www.yuque.com/{accountId}` | https://www.yuque.com/zhangsan |

### 特殊平台

- **视频号**：使用微信协议 `weixin://finderName/{accountId}`，需要在微信内打开
- **抖音**：使用抖音协议 `snssdk1128://user/profile/{accountId}`，需要安装抖音 App
- **小红书**：使用小红书协议 `xhsdiscover://user/{accountId}`，需要安装小红书 App
- **公众号**：需要在微信内打开，无法直接生成链接
- **Discord**：需要邀请链接或用户ID，格式较复杂

## 使用工具函数

### 导入

```typescript
import {
    generateSocialMediaUrl,
    getPlatformName,
    getPlatformIcon,
    getPlatformColor,
    validateAccountId,
    SOCIAL_MEDIA_PLATFORMS
} from '../utils/socialMediaLinks';
```

### 生成链接

```typescript
const url = generateSocialMediaUrl('weibo', 'zhangsan');
// 返回: "https://weibo.com/zhangsan"

// 使用自定义链接
const customUrl = generateSocialMediaUrl('discord', 'user123', 'https://discord.gg/invite123');
// 返回: "https://discord.gg/invite123"
```

### 获取平台信息

```typescript
const name = getPlatformName('weibo');        // "微博"
const icon = getPlatformIcon('weibo');        // "public"
const color = getPlatformColor('weibo');      // "#E6162D"
```

### 验证账号ID

```typescript
const isValid = validateAccountId('twitter', '@zhangsan');
// 返回: true

const isInvalid = validateAccountId('twitter', 'invalid user name');
// 返回: false
```

## 在 UI 中显示

### 显示社交媒体列表

```tsx
import { MaterialIcons } from '@expo/vector-icons';
import { getPlatformName, getPlatformIcon, getPlatformColor } from '../utils/socialMediaLinks';

{cardData.socialMedia.map((account) => (
    <View key={account.id} style={styles.socialMediaItem}>
        <MaterialIcons 
            name={getPlatformIcon(account.platform)} 
            size={24} 
            color={getPlatformColor(account.platform)} 
        />
        <Text>{account.displayName || getPlatformName(account.platform)}</Text>
        <Text>{account.accountId}</Text>
    </View>
))}
```

### 点击跳转

```tsx
import { Linking } from 'react-native';
import { generateSocialMediaUrl } from '../utils/socialMediaLinks';

const handleSocialMediaPress = (account: SocialMediaAccount) => {
    const url = generateSocialMediaUrl(
        account.platform, 
        account.accountId, 
        account.url
    );
    
    if (url) {
        Linking.openURL(url).catch(err => {
            console.error('无法打开链接:', err);
            Alert.alert('提示', '无法打开该链接，请检查是否安装了对应的应用');
        });
    } else {
        Alert.alert('提示', '该平台暂不支持直接跳转');
    }
};

<TouchableOpacity onPress={() => handleSocialMediaPress(account)}>
    {/* 社交媒体按钮 */}
</TouchableOpacity>
```

## AI 助手集成

AI 助手可以帮助用户添加社交媒体账号。在对话中，AI 会询问用户的社交媒体账号，并以以下格式返回：

```json
{
  "formData": {
    "socialMedia": [
      {
        "id": "1",
        "platform": "weibo",
        "accountId": "zhangsan",
        "displayName": "张三的微博"
      }
    ]
  },
  "completed": false
}
```

## 注意事项

1. **账号ID格式**：不同平台对账号ID有不同要求，建议使用 `validateAccountId` 函数验证
2. **自定义链接**：对于特殊平台或自定义需求，可以提供 `url` 字段
3. **App 协议**：某些平台（如抖音、小红书）使用 App 协议，需要用户安装对应应用
4. **微信生态**：视频号和公众号需要在微信内打开
5. **隐私保护**：社交媒体账号默认不是隐私字段，用户可以在访问控制中设置

## 平台图标和颜色

所有平台都配置了对应的 MaterialIcons 图标和品牌色，确保 UI 的一致性和专业性。

```typescript
// 获取所有平台配置
import { SOCIAL_MEDIA_PLATFORMS } from '../utils/socialMediaLinks';

Object.entries(SOCIAL_MEDIA_PLATFORMS).forEach(([key, config]) => {
    console.log(`${config.name}: ${config.icon} (${config.color})`);
});
```
