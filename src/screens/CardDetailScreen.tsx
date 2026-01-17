import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert, TextInput, Modal, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { BusinessCardData, useCardStore } from '../store/useCardStore';
import { useTagStore } from '../store/useTagStore';
import MyCard from '../components/MyCard';
import { RichTextRenderer } from '../components/RichTextRenderer';
import { FIELD_DISPLAY_NAMES } from '../constants/fieldNames';
import { ThemeConfig } from '../constants/theme';
import { LazyImage } from '../components/LazyImage';
import { getPlatformIcon, getPlatformColor, getPlatformName, generateSocialMediaUrl } from '../utils/socialMediaLinks';

const { width } = Dimensions.get('window');

interface CardDetailScreenProps {
    cardData: BusinessCardData;
    onClose: () => void;
    peerDid?: string; // 对方的 DID/address
    exchangedAt?: number; // 交换时间戳
}

/**
 * 名片详情页面
 * 完整的独立页面展示名片信息
 */
const CardDetailScreen: React.FC<CardDetailScreenProps> = ({ cardData, onClose, peerDid, exchangedAt }) => {
    const { tags, cardMetadata, loadTags, loadCardMetadata, addTagToCard, removeTagFromCard, setCardNote, setCardImportance } = useTagStore();
    const [showTagModal, setShowTagModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [importanceValue, setImportanceValue] = useState(20);
    const [isEditMode, setIsEditMode] = useState(false);
    
    useEffect(() => {
        loadTags();
        loadCardMetadata();
    }, []);
    
    useEffect(() => {
        if (peerDid) {
            const metadata = cardMetadata.get(peerDid);
            setNoteText(metadata?.note || '');
            setImportanceValue(metadata?.importance ?? 20);
        }
    }, [peerDid, cardMetadata]);
    
    const metadata = peerDid ? cardMetadata.get(peerDid) : undefined;
    const cardTags = metadata?.tags.map(tagId => tags.find(t => t.id === tagId)).filter(Boolean) || [];
    
    const handleCopy = async (text: string, label: string) => {
        try {
            await Clipboard.setStringAsync(text);
            Alert.alert('已复制', `${label}已复制到剪贴板`);
        } catch (error) {
            Alert.alert('复制失败', '无法复制到剪贴板');
        }
    };
    
    const handleToggleTag = async (tagId: string) => {
        if (!peerDid) return;
        
        const hasTag = metadata?.tags.includes(tagId);
        if (hasTag) {
            await removeTagFromCard(peerDid, tagId);
        } else {
            await addTagToCard(peerDid, tagId);
        }
    };
    
    const handleSaveNote = async () => {
        if (!peerDid) return;
        
        await setCardNote(peerDid, noteText);
        setShowNoteModal(false);
        Alert.alert('成功', '备注已保存');
    };
    
    const handleImportanceChange = async (value: number) => {
        if (!peerDid) return;
        
        const clampedValue = Math.max(0, Math.min(100, value));
        setImportanceValue(clampedValue);
        await setCardImportance(peerDid, clampedValue);
    };
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* 顶部导航栏 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>名片详情</Text>
                <View style={styles.headerRight}>
                    {peerDid && (
                        <TouchableOpacity 
                            onPress={() => setIsEditMode(!isEditMode)}
                            style={styles.iconButton}
                        >
                            <MaterialIcons 
                                name={isEditMode ? "check" : "edit"} 
                                size={24} 
                                color={isEditMode ? "#4F46E5" : "#64748b"} 
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* 名片展示 */}
                <View style={styles.cardSection}>
                    <MyCard cardData={cardData} />
                </View>

                {/* 身份地址 */}
                {peerDid && (
                    <View style={styles.card}>
                        <View style={styles.cardTitle}>
                            <MaterialIcons key="icon" name="account-balance-wallet" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                            <Text key="text" style={styles.cardTitleText}>身份地址</Text>
                        </View>
                        <View style={styles.contactItem}>
                            <MaterialIcons name="fingerprint" size={18} color="#64748b" style={styles.contactIcon} />
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>DID</Text>
                                <Text style={styles.contactValue} numberOfLines={1} ellipsizeMode="middle">{peerDid}</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.copyButton}
                                onPress={() => handleCopy(peerDid, 'DID')}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MaterialIcons name="content-copy" size={18} color="#4F46E5" />
                            </TouchableOpacity>
                        </View>
                        {exchangedAt && (
                            <View style={styles.contactItem}>
                                <MaterialIcons name="schedule" size={18} color="#64748b" style={styles.contactIcon} />
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactLabel}>交换时间</Text>
                                    <Text style={styles.contactValue}>
                                        {new Date(exchangedAt).toLocaleString('zh-CN', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* 重要度 */}
                {peerDid && (
                    <View style={styles.card}>
                        <View style={styles.cardTitle}>
                            <MaterialIcons key="icon" name="star" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                            <Text key="text" style={styles.cardTitleText}>重要度</Text>
                        </View>
                        <View style={styles.importanceSection}>
                            {isEditMode ? (
                                <View style={styles.importanceEditContainer}>
                                    <View style={styles.importanceInputWrapper}>
                                        <Text style={styles.importanceInputLabel}>重要度值（0-100）</Text>
                                        <TextInput
                                            style={styles.importanceInputField}
                                            value={importanceValue.toString()}
                                            onChangeText={(text) => {
                                                const num = parseInt(text) || 0;
                                                handleImportanceChange(num);
                                            }}
                                            keyboardType="number-pad"
                                            placeholder="0-100"
                                            placeholderTextColor="#94a3b8"
                                        />
                                    </View>
                                    <Text style={styles.importanceHint}>重要度越高，名片排序越靠前（默认值：20）</Text>
                                </View>
                            ) : (
                                <View style={styles.importanceDisplayReadOnly}>
                                    <Text style={styles.importanceLabel}>当前重要度</Text>
                                    <Text style={styles.importanceValue}>{importanceValue}</Text>
                                    <Text style={styles.importanceHint}>重要度越高，名片排序越靠前（默认值：20）</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* 标签和备注 */}
                {peerDid && (
                    <View style={styles.card}>
                        <View style={styles.cardTitle}>
                            <MaterialIcons key="icon" name="label" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                            <Text key="text" style={styles.cardTitleText}>标签和备注</Text>
                        </View>
                        
                        {/* 标签 */}
                        <View style={styles.tagsSection}>
                            <Text style={styles.subsectionLabel}>标签</Text>
                            <View style={styles.tagsContainer}>
                                {cardTags.length > 0 ? (
                                    cardTags.map((tag) => tag && (
                                        <View 
                                            key={tag.id}
                                            style={[styles.tagChip, { backgroundColor: tag.color + '20', borderColor: tag.color }]}
                                        >
                                            <Text style={[styles.tagChipText, { color: tag.color }]}>
                                                {tag.name}
                                            </Text>
                                        </View>
                                    ))
                                ) : (
                                    !isEditMode && (
                                        <Text style={styles.emptyText}>暂无标签</Text>
                                    )
                                )}
                                {isEditMode && (
                                    <TouchableOpacity 
                                        style={styles.addTagButton}
                                        onPress={() => setShowTagModal(true)}
                                    >
                                        <MaterialIcons name="add" size={16} color="#4F46E5" />
                                        <Text style={styles.addTagText}>添加标签</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        
                        {/* 备注 */}
                        <View style={styles.noteSection}>
                            <Text style={styles.subsectionLabel}>备注</Text>
                            {isEditMode ? (
                                <TouchableOpacity 
                                    style={styles.noteDisplay}
                                    onPress={() => setShowNoteModal(true)}
                                >
                                    {metadata?.note ? (
                                        <Text style={styles.noteText}>{metadata.note}</Text>
                                    ) : (
                                        <Text style={styles.notePlaceholder}>点击添加备注...</Text>
                                    )}
                                    <MaterialIcons name="edit" size={16} color="#94a3b8" />
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.noteDisplayReadOnly}>
                                    {metadata?.note ? (
                                        <Text style={styles.noteText}>{metadata.note}</Text>
                                    ) : (
                                        <Text style={styles.emptyText}>暂无备注</Text>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* 联系方式 */}
                {(cardData.phone || cardData.email || cardData.wechat || cardData.address || cardData.wechatQrCode) && (
                    <View style={styles.card}>
                        <View style={styles.cardTitle}>
                            <MaterialIcons key="icon" name="contact-mail" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                            <Text key="text" style={styles.cardTitleText}>联系方式</Text>
                        </View>

                        {cardData.phone && (
                            <View style={styles.contactItem}>
                                <MaterialIcons name="phone" size={18} color="#64748b" style={styles.contactIcon} />
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactLabel}>{FIELD_DISPLAY_NAMES.phone}</Text>
                                    <Text style={styles.contactValue}>{cardData.phone}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.copyButton}
                                    onPress={() => handleCopy(cardData.phone!, FIELD_DISPLAY_NAMES.phone)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <MaterialIcons name="content-copy" size={18} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {cardData.email && (
                            <View style={styles.contactItem}>
                                <MaterialIcons name="email" size={18} color="#64748b" style={styles.contactIcon} />
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactLabel}>{FIELD_DISPLAY_NAMES.email}</Text>
                                    <Text style={styles.contactValue}>{cardData.email}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.copyButton}
                                    onPress={() => handleCopy(cardData.email!, FIELD_DISPLAY_NAMES.email)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <MaterialIcons name="content-copy" size={18} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {cardData.wechat && (
                            <View style={styles.contactItem}>
                                <MaterialIcons name="chat" size={18} color="#64748b" style={styles.contactIcon} />
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactLabel}>{FIELD_DISPLAY_NAMES.wechat}</Text>
                                    <Text style={styles.contactValue}>{cardData.wechat}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.copyButton}
                                    onPress={() => handleCopy(cardData.wechat!, FIELD_DISPLAY_NAMES.wechat)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <MaterialIcons name="content-copy" size={18} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {cardData.address && (
                            <View style={styles.contactItem}>
                                <MaterialIcons name="location-on" size={18} color="#64748b" style={styles.contactIcon} />
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactLabel}>{FIELD_DISPLAY_NAMES.address}</Text>
                                    <Text style={styles.contactValue}>{cardData.address}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.copyButton}
                                    onPress={() => handleCopy(cardData.address!, FIELD_DISPLAY_NAMES.address)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <MaterialIcons name="content-copy" size={18} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {(cardData.wechatQrCodeId || cardData.wechatQrCode) && (
                            <View style={styles.qrCodeSection}>
                                <Text style={styles.contactLabel}>{FIELD_DISPLAY_NAMES.wechatQrCode}</Text>
                                {cardData.wechatQrCodeId ? (
                                    <LazyImage 
                                        imageId={cardData.wechatQrCodeId}
                                        style={styles.qrCodeImage}
                                        useThumbnail={false}
                                    />
                                ) : cardData.wechatQrCode ? (
                                    <Image 
                                        source={{ uri: cardData.wechatQrCode }}
                                        style={styles.qrCodeImage}
                                        resizeMode="contain"
                                    />
                                ) : null}
                            </View>
                        )}
                    </View>
                )}

                {/* 社交媒体 */}
                {cardData.socialMedia && cardData.socialMedia.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.cardTitle}>
                            <MaterialIcons key="icon" name="share" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                            <Text key="text" style={styles.cardTitleText}>社交媒体</Text>
                        </View>
                        {cardData.socialMedia.map((account, index) => {
                            const url = generateSocialMediaUrl(account.platform, account.accountId, account.url);
                            return (
                                <TouchableOpacity
                                    key={account.id || index}
                                    style={styles.socialMediaItem}
                                    onPress={() => {
                                        const accountInfo = account.displayName || account.accountId;
                                        const buttons: any[] = [];
                                        
                                        if (url) {
                                            buttons.push({
                                                text: '打开链接',
                                                onPress: async () => {
                                                    try {
                                                        await Linking.openURL(url);
                                                    } catch (error) {
                                                        Alert.alert('错误', '打开链接失败');
                                                    }
                                                }
                                            });
                                            buttons.push({
                                                text: '复制链接',
                                                onPress: () => handleCopy(url, getPlatformName(account.platform))
                                            });
                                        }
                                        
                                        buttons.push({
                                            text: '复制账号',
                                            onPress: () => handleCopy(accountInfo, `${getPlatformName(account.platform)}账号`)
                                        });
                                        
                                        buttons.push({ text: '取消', style: 'cancel' });
                                        
                                        Alert.alert(
                                            getPlatformName(account.platform),
                                            accountInfo,
                                            buttons
                                        );
                                    }}
                                >
                                    <View style={styles.socialMediaLeft}>
                                        <MaterialIcons 
                                            name={getPlatformIcon(account.platform) as any} 
                                            size={20} 
                                            color={getPlatformColor(account.platform)} 
                                            style={styles.contactIcon} 
                                        />
                                        <View style={styles.contactInfo}>
                                            <Text style={styles.contactLabel}>{getPlatformName(account.platform)}</Text>
                                            <Text style={styles.contactValue}>
                                                {account.displayName || account.accountId}
                                            </Text>
                                        </View>
                                    </View>
                                    <MaterialIcons name="open-in-new" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                    {/* 个人简介 */}
                    {cardData.aboutMe && (
                        <View style={styles.card}>
                            <View style={styles.cardTitle}>
                                <MaterialIcons key="icon" name="description" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                                <Text key="text" style={styles.cardTitleText}>个人简介</Text>
                            </View>
                            <Text style={styles.sectionContent}>{cardData.aboutMe}</Text>
                        </View>
                    )}

                    {/* 个人背景 */}
                    {(cardData.hometown || cardData.residence || cardData.hobbies || cardData.personality || cardData.focusIndustry || cardData.circles) && (
                        <View style={styles.card}>
                            <View style={styles.cardTitle}>
                                <MaterialIcons key="icon" name="person-outline" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                                <Text key="text" style={styles.cardTitleText}>个人背景</Text>
                            </View>

                            {cardData.hometown && (
                                <View style={styles.contactItem}>
                                    <MaterialIcons name="home" size={20} color="#64748b" style={styles.contactIcon} />
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactLabel}>家乡</Text>
                                        <Text style={styles.contactValue}>{cardData.hometown}</Text>
                                    </View>
                                </View>
                            )}

                            {cardData.residence && (
                                <View style={styles.contactItem}>
                                    <MaterialIcons name="place" size={20} color="#64748b" style={styles.contactIcon} />
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactLabel}>常驻</Text>
                                        <Text style={styles.contactValue}>{cardData.residence}</Text>
                                    </View>
                                </View>
                            )}

                            {cardData.hobbies && (
                                <View style={styles.contactItem}>
                                    <MaterialIcons name="favorite" size={20} color="#64748b" style={styles.contactIcon} />
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactLabel}>兴趣爱好</Text>
                                        <Text style={styles.contactValue}>{cardData.hobbies}</Text>
                                    </View>
                                </View>
                            )}

                            {cardData.personality && (
                                <View style={styles.contactItem}>
                                    <MaterialIcons name="psychology" size={20} color="#64748b" style={styles.contactIcon} />
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactLabel}>性格特点</Text>
                                        <Text style={styles.contactValue}>{cardData.personality}</Text>
                                    </View>
                                </View>
                            )}

                            {cardData.focusIndustry && (
                                <View style={styles.contactItem}>
                                    <MaterialIcons name="trending-up" size={20} color="#64748b" style={styles.contactIcon} />
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactLabel}>关注行业</Text>
                                        <Text style={styles.contactValue}>{cardData.focusIndustry}</Text>
                                    </View>
                                </View>
                            )}

                            {cardData.circles && (
                                <View style={styles.contactItem}>
                                    <MaterialIcons name="groups" size={20} color="#64748b" style={styles.contactIcon} />
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactLabel}>加入的圈层</Text>
                                        <Text style={styles.contactValue}>{cardData.circles}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* 公司图片 */}
                    {((cardData.companyImageIds && cardData.companyImageIds.length > 0) || (cardData.companyImages && cardData.companyImages.length > 0)) && (
                        <View style={styles.card}>
                            <View style={styles.cardTitle}>
                                <MaterialIcons key="icon" name="photo-library" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                                <Text key="text" style={styles.cardTitleText}>公司图片</Text>
                            </View>
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.imageGallery}
                            >
                                {cardData.companyImageIds && cardData.companyImageIds.length > 0 ? (
                                    cardData.companyImageIds.map((imageId, index) => (
                                        <View key={imageId || index} style={styles.companyImageItem}>
                                            <LazyImage 
                                                imageId={imageId}
                                                style={styles.companyImage}
                                                useThumbnail={true}
                                            />
                                        </View>
                                    ))
                                ) : cardData.companyImages && cardData.companyImages.length > 0 ? (
                                    cardData.companyImages.map((imageUrl, index) => (
                                        <View key={index} style={styles.companyImageItem}>
                                            <Image 
                                                source={{ uri: imageUrl }}
                                                style={styles.companyImage}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    ))
                                ) : null}
                            </ScrollView>
                        </View>
                    )}

                    {/* 公司简介 */}
                    {cardData.companyIntro && (
                        <View style={styles.card}>
                            <View style={styles.cardTitle}>
                                <MaterialIcons key="icon" name="business" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                                <Text key="text" style={styles.cardTitleText}>公司简介</Text>
                            </View>
                            <RichTextRenderer 
                                content={cardData.companyIntro} 
                                style={styles.sectionContent}
                            />
                        </View>
                    )}

                    {/* 主营业务 */}
                    {cardData.mainBusiness && cardData.mainBusiness.length > 0 && (
                        <View style={styles.card}>
                            <View style={styles.cardTitle}>
                                <MaterialIcons key="icon" name="work" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                                <Text key="text" style={styles.cardTitleText}>主营业务</Text>
                            </View>
                            {cardData.mainBusiness.map((item, index) => (
                                <View key={item.id || index} style={styles.businessItem}>
                                    <View style={styles.businessHeader}>
                                        <Text style={styles.businessName}>{item.name}</Text>
                                    </View>
                                    {item.description && (
                                        <Text style={styles.businessDescription}>{item.description}</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* 服务需求 */}
                    {cardData.serviceNeeds && cardData.serviceNeeds.length > 0 && (
                        <View style={styles.card}>
                            <View style={styles.cardTitle}>
                                <MaterialIcons key="icon" name="flag" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                                <Text key="text" style={styles.cardTitleText}>服务需求</Text>
                            </View>
                            {cardData.serviceNeeds.map((item, index) => (
                                <View key={item.id || index} style={styles.businessItem}>
                                    <View style={styles.businessHeader}>
                                        <Text style={styles.businessName}>{item.name}</Text>
                                    </View>
                                    {item.description && (
                                        <Text style={styles.businessDescription}>{item.description}</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* 多媒体信息 */}
                    {(cardData.introVideoUrl || cardData.videoChannelId) && (
                        <View style={styles.card}>
                            <View style={styles.cardTitle}>
                                <MaterialIcons key="icon" name="videocam" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                                <Text key="text" style={styles.cardTitleText}>多媒体</Text>
                            </View>

                            {cardData.introVideoUrl && (
                                <View style={styles.contactItem}>
                                    <MaterialIcons name="play-circle" size={20} color="#64748b" style={styles.contactIcon} />
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactLabel}>个人介绍视频</Text>
                                        <Text style={styles.contactValue}>已上传</Text>
                                    </View>
                                </View>
                            )}

                            {cardData.videoChannelId && (
                                <View style={styles.contactItem}>
                                    <MaterialIcons name="video-library" size={20} color="#64748b" style={styles.contactIcon} />
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactLabel}>视频号ID</Text>
                                        <Text style={styles.contactValue}>{cardData.videoChannelId}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.spacer} />
                </ScrollView>
                
                {/* 标签选择模态框 */}
                <Modal
                    visible={showTagModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => setShowTagModal(false)}
                >
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>选择标签</Text>
                            <TouchableOpacity onPress={() => setShowTagModal(false)}>
                                <MaterialIcons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalContent}>
                            {tags.length === 0 ? (
                                <View style={styles.emptyTags}>
                                    <MaterialIcons name="label-outline" size={48} color="#cbd5e1" />
                                    <Text style={styles.emptyTagsText}>暂无标签</Text>
                                    <Text style={styles.emptyTagsHint}>请先在"我的"页面创建标签</Text>
                                </View>
                            ) : (
                                <View style={styles.tagsList}>
                                    {tags.map((tag) => {
                                        const isSelected = metadata?.tags.includes(tag.id);
                                        return (
                                            <TouchableOpacity
                                                key={tag.id}
                                                style={[
                                                    styles.tagSelectItem,
                                                    isSelected && styles.tagSelectItemActive
                                                ]}
                                                onPress={() => handleToggleTag(tag.id)}
                                            >
                                                <View style={styles.tagSelectInfo}>
                                                    <View style={[styles.tagColorDot, { backgroundColor: tag.color }]} />
                                                    <Text style={styles.tagSelectName}>{tag.name}</Text>
                                                </View>
                                                {isSelected && (
                                                    <MaterialIcons name="check" size={20} color="#4F46E5" />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </ScrollView>
                    </SafeAreaView>
                </Modal>
                
                {/* 备注编辑模态框 */}
                <Modal
                    visible={showNoteModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => setShowNoteModal(false)}
                >
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>编辑备注</Text>
                            <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                                <MaterialIcons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.noteModalContent}>
                            <TextInput
                                style={styles.noteInput}
                                value={noteText}
                                onChangeText={setNoteText}
                                placeholder="输入备注信息..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                textAlignVertical="top"
                            />
                            <TouchableOpacity 
                                style={styles.saveNoteButton}
                                onPress={handleSaveNote}
                            >
                                <Text style={styles.saveNoteButtonText}>保存</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.background,
    },
    // 顶部导航栏
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: ThemeConfig.spacing.base,
        paddingVertical: ThemeConfig.spacing.md,
        backgroundColor: ThemeConfig.colors.background,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.backgroundTertiary,
    },
    backButton: {
        padding: ThemeConfig.spacing.sm,
        marginLeft: -8,
        width: 40,
    },
    headerTitle: {
        fontSize: ThemeConfig.fontSize.lg + 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
    },
    iconButton: {
        padding: ThemeConfig.spacing.sm,
    },
    // 滚动区域
    scrollView: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    // 名片展示区域
    cardSection: {
        backgroundColor: ThemeConfig.colors.background,
        padding: ThemeConfig.spacing.base,
        borderBottomWidth: 8,
        borderBottomColor: ThemeConfig.colors.backgroundSecondary,
    },
    // 卡片样式
    card: {
        backgroundColor: ThemeConfig.colors.background,
        marginHorizontal: ThemeConfig.spacing.base,
        marginTop: ThemeConfig.spacing.md,
        paddingHorizontal: ThemeConfig.spacing.lg,
        paddingVertical: ThemeConfig.spacing.lg,
        borderRadius: ThemeConfig.borderRadius.lg,
        ...ThemeConfig.shadow.sm,
    },
    cardTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: ThemeConfig.spacing.base,
    },
    cardTitleIcon: {
        marginRight: ThemeConfig.spacing.sm,
    },
    cardTitleText: {
        fontSize: ThemeConfig.fontSize.xl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
    },
    // 联系方式项
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.backgroundTertiary,
    },
    contactIcon: {
        marginRight: 14,
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: ThemeConfig.fontSize.xs,
        color: ThemeConfig.colors.textTertiary,
        marginBottom: 3,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    contactValue: {
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.medium,
        color: ThemeConfig.colors.textPrimary,
    },
    copyButton: {
        padding: ThemeConfig.spacing.sm,
        marginLeft: ThemeConfig.spacing.sm,
    },
    // 业务项
    businessItem: {
        paddingVertical: ThemeConfig.spacing.base,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.backgroundTertiary,
    },
    businessHeader: {
        marginBottom: ThemeConfig.spacing.sm,
    },
    businessName: {
        fontSize: ThemeConfig.fontSize.lg + 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
    },
    businessDescription: {
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textSecondary,
        lineHeight: 22,
    },
    // 段落内容
    sectionContent: {
        fontSize: ThemeConfig.fontSize.md,
        color: '#475569',
        lineHeight: 24,
    },
    // 底部间距
    spacer: {
        height: ThemeConfig.spacing.xxxl - 16,
    },
    // 标签和备注样式
    tagsSection: {
        marginBottom: ThemeConfig.spacing.base,
    },
    subsectionLabel: {
        fontSize: ThemeConfig.fontSize.sm,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: ThemeConfig.spacing.sm,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ThemeConfig.spacing.sm,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ThemeConfig.spacing.sm + 2,
        paddingVertical: 6,
        borderRadius: ThemeConfig.borderRadius.md,
        borderWidth: ThemeConfig.borderWidth.thin,
    },
    tagChipText: {
        fontSize: ThemeConfig.fontSize.sm,
        fontWeight: ThemeConfig.fontWeight.semibold,
    },
    addTagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ThemeConfig.spacing.sm + 2,
        paddingVertical: 6,
        borderRadius: ThemeConfig.borderRadius.md,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
        borderStyle: 'dashed',
        gap: 4,
    },
    addTagText: {
        fontSize: ThemeConfig.fontSize.sm,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.primary,
    },
    noteSection: {
        marginTop: ThemeConfig.spacing.sm,
    },
    noteDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        padding: ThemeConfig.spacing.md,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    noteText: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textPrimary,
        lineHeight: 20,
    },
    notePlaceholder: {
        flex: 1,
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textTertiary,
    },
    noteDisplayReadOnly: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        padding: ThemeConfig.spacing.md,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
        minHeight: 44,
    },
    emptyText: {
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textDisabled,
        fontStyle: 'italic',
    },
    // 模态框样式
    modalContainer: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: ThemeConfig.spacing.lg,
        paddingVertical: ThemeConfig.spacing.base,
        backgroundColor: ThemeConfig.colors.background,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.border,
    },
    modalTitle: {
        fontSize: ThemeConfig.fontSize.xl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
    },
    modalContent: {
        flex: 1,
        padding: ThemeConfig.spacing.base,
    },
    emptyTags: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTagsText: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
        marginTop: ThemeConfig.spacing.base,
        marginBottom: ThemeConfig.spacing.sm,
    },
    emptyTagsHint: {
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textTertiary,
    },
    tagsList: {
        gap: ThemeConfig.spacing.sm,
    },
    tagSelectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: ThemeConfig.colors.background,
        padding: ThemeConfig.spacing.base,
        borderRadius: ThemeConfig.borderRadius.md,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    tagSelectItemActive: {
        borderColor: ThemeConfig.colors.primary,
        backgroundColor: '#eff6ff',
    },
    tagSelectInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.md,
    },
    tagColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    tagSelectName: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.medium,
        color: ThemeConfig.colors.textPrimary,
    },
    noteModalContent: {
        flex: 1,
        padding: ThemeConfig.spacing.base,
    },
    noteInput: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textPrimary,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
        marginBottom: ThemeConfig.spacing.base,
    },
    saveNoteButton: {
        backgroundColor: ThemeConfig.colors.primary,
        paddingVertical: ThemeConfig.spacing.base,
        borderRadius: ThemeConfig.borderRadius.md,
        alignItems: 'center',
    },
    saveNoteButtonText: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.white,
    },
    // 重要度样式
    importanceSection: {
        gap: ThemeConfig.spacing.sm,
    },
    importanceEditContainer: {
        gap: ThemeConfig.spacing.md,
    },
    importanceInputWrapper: {
        gap: ThemeConfig.spacing.sm,
    },
    importanceInputLabel: {
        fontSize: ThemeConfig.fontSize.base - 1,
        color: ThemeConfig.colors.textSecondary,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    importanceInputField: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderRadius: ThemeConfig.borderRadius.md,
        padding: ThemeConfig.spacing.base,
        fontSize: ThemeConfig.fontSize.xl,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        borderWidth: ThemeConfig.borderWidth.base,
        borderColor: ThemeConfig.colors.primary,
    },
    importanceDisplayReadOnly: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        padding: ThemeConfig.spacing.base,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
        gap: ThemeConfig.spacing.sm,
    },
    importanceLabel: {
        fontSize: ThemeConfig.fontSize.xs,
        color: ThemeConfig.colors.textTertiary,
        fontWeight: ThemeConfig.fontWeight.medium,
    },
    importanceValue: {
        fontSize: 32,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.primary,
    },
    importanceHint: {
        fontSize: ThemeConfig.fontSize.sm,
        color: ThemeConfig.colors.textTertiary,
    },
    // 微信二维码样式
    qrCodeSection: {
        paddingVertical: ThemeConfig.spacing.base,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.backgroundTertiary,
        alignItems: 'center',
        gap: ThemeConfig.spacing.md,
    },
    qrCodeImage: {
        width: 200,
        height: 200,
        borderRadius: ThemeConfig.borderRadius.md,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    // 公司图片样式
    imageGallery: {
        paddingVertical: ThemeConfig.spacing.sm,
        gap: ThemeConfig.spacing.md,
    },
    companyImageItem: {
        width: 120,
        height: 120,
        borderRadius: ThemeConfig.borderRadius.md,
        overflow: 'hidden',
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    companyImage: {
        width: '100%',
        height: '100%',
    },
    // 社交媒体样式
    socialMediaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: ThemeConfig.borderWidth.thin,
        borderBottomColor: ThemeConfig.colors.backgroundTertiary,
    },
    socialMediaLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
});

export default CardDetailScreen;
