import { imageStorage } from './imageStorage';
import { BusinessCardData } from '../store/useCardStore';

export class ImageMigrationService {
  static async migrateCardImages(cardData: BusinessCardData): Promise<BusinessCardData> {
    const migratedData = { ...cardData };
    let hasChanges = false;

    // 迁移头像
    if (cardData.avatarUrl && !cardData.avatarId && cardData.avatarUrl.startsWith('data:image')) {
      try {
        const avatarId = `avatar_${Date.now()}`;
        await imageStorage.saveImage(cardData.avatarUrl, avatarId, {
          compress: true,
          quality: 0.8,
          maxWidth: 400,
          maxHeight: 400,
          generateThumbnail: true,
          thumbnailSize: 200,
        });
        migratedData.avatarId = avatarId;
        delete migratedData.avatarUrl;
        hasChanges = true;
        console.log('Migrated avatar to FileSystem');
      } catch (error) {
        console.error('Failed to migrate avatar:', error);
      }
    }

    // 迁移微信二维码
    if (cardData.wechatQrCode && !cardData.wechatQrCodeId && cardData.wechatQrCode.startsWith('data:image')) {
      try {
        const qrCodeId = `wechat_qr_${Date.now()}`;
        await imageStorage.saveImage(cardData.wechatQrCode, qrCodeId, {
          compress: true,
          quality: 0.9,
          maxWidth: 800,
          maxHeight: 800,
          generateThumbnail: true,
          thumbnailSize: 200,
        });
        migratedData.wechatQrCodeId = qrCodeId;
        delete migratedData.wechatQrCode;
        hasChanges = true;
        console.log('Migrated WeChat QR code to FileSystem');
      } catch (error) {
        console.error('Failed to migrate WeChat QR code:', error);
      }
    }

    // 迁移公司图片
    if (cardData.companyImages && cardData.companyImages.length > 0 && 
        (!cardData.companyImageIds || cardData.companyImageIds.length === 0)) {
      const imageIds: string[] = [];
      
      for (let i = 0; i < cardData.companyImages.length; i++) {
        const imageData = cardData.companyImages[i];
        if (imageData.startsWith('data:image')) {
          try {
            const imageId = `company_${Date.now()}_${i}`;
            await imageStorage.saveImage(imageData, imageId, {
              compress: true,
              quality: 0.8,
              maxWidth: 1200,
              maxHeight: 1200,
              generateThumbnail: true,
              thumbnailSize: 300,
            });
            imageIds.push(imageId);
            console.log(`Migrated company image ${i + 1} to FileSystem`);
          } catch (error) {
            console.error(`Failed to migrate company image ${i + 1}:`, error);
          }
        }
      }

      if (imageIds.length > 0) {
        migratedData.companyImageIds = imageIds;
        migratedData.companyImages = [];
        hasChanges = true;
      }
    }

    return hasChanges ? migratedData : cardData;
  }

  static async migrateAllCards(
    myCard: BusinessCardData,
    exchangedCards: BusinessCardData[]
  ): Promise<{
    myCard: BusinessCardData;
    exchangedCards: BusinessCardData[];
    migrated: boolean;
  }> {
    let migrated = false;

    // 迁移我的名片
    const migratedMyCard = await this.migrateCardImages(myCard);
    if (migratedMyCard !== myCard) {
      migrated = true;
    }

    // 迁移交换的名片
    const migratedExchangedCards: BusinessCardData[] = [];
    for (const card of exchangedCards) {
      const migratedCard = await this.migrateCardImages(card);
      migratedExchangedCards.push(migratedCard);
      if (migratedCard !== card) {
        migrated = true;
      }
    }

    return {
      myCard: migratedMyCard,
      exchangedCards: migratedExchangedCards,
      migrated,
    };
  }

  static needsMigration(cardData: BusinessCardData): boolean {
    // 检查是否有旧格式的 base64 图片数据
    if (cardData.avatarUrl && !cardData.avatarId && cardData.avatarUrl.startsWith('data:image')) {
      return true;
    }
    if (cardData.wechatQrCode && !cardData.wechatQrCodeId && cardData.wechatQrCode.startsWith('data:image')) {
      return true;
    }
    if (cardData.companyImages && cardData.companyImages.length > 0 &&
        (!cardData.companyImageIds || cardData.companyImageIds.length === 0)) {
      return true;
    }
    return false;
  }
}
