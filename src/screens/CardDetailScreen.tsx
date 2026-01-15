import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { BusinessCardData } from '../store/useCardStore';
import { useTagStore } from '../store/useTagStore';
import MyCard from '../components/MyCard';
import { RichTextRenderer } from '../components/RichTextRenderer';

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
    const { tags, cardMetadata, loadTags, loadCardMetadata, addTagToCard, removeTagFromCard, setCardNote } = useTagStore();
    const [showTagModal, setShowTagModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    
    useEffect(() => {
        loadTags();
        loadCardMetadata();
    }, []);
    
    useEffect(() => {
        if (peerDid) {
            const metadata = cardMetadata.get(peerDid);
            setNoteText(metadata?.note || '');
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
                                    <Text style={styles.contactLabel}>电话</Text>
                                    <Text style={styles.contactValue}>{cardData.phone}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.copyButton}
                                    onPress={() => handleCopy(cardData.phone!, '电话')}
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
                                    <Text style={styles.contactLabel}>邮箱</Text>
                                    <Text style={styles.contactValue}>{cardData.email}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.copyButton}
                                    onPress={() => handleCopy(cardData.email!, '邮箱')}
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
                                    <Text style={styles.contactLabel}>微信</Text>
                                    <Text style={styles.contactValue}>{cardData.wechat}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.copyButton}
                                    onPress={() => handleCopy(cardData.wechat!, '微信')}
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
                                    <Text style={styles.contactLabel}>地址</Text>
                                    <Text style={styles.contactValue}>{cardData.address}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.copyButton}
                                    onPress={() => handleCopy(cardData.address!, '地址')}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <MaterialIcons name="content-copy" size={18} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {cardData.wechatQrCode && (
                            <View style={styles.contactItem}>
                                <MaterialIcons name="qr-code" size={18} color="#64748b" style={styles.contactIcon} />
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactLabel}>微信二维码</Text>
                                    <Text style={styles.contactValue}>已设置</Text>
                                </View>
                            </View>
                        )}
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

                    {/* 公司图片 */}
                    {cardData.companyImages && cardData.companyImages.length > 0 && (
                        <View style={styles.card}>
                            <View style={styles.cardTitle}>
                                <MaterialIcons key="icon" name="photo-library" size={20} color="#1e293b" style={styles.cardTitleIcon} />
                                <Text key="text" style={styles.cardTitleText}>公司图片</Text>
                            </View>
                            <Text style={styles.sectionContent}>共 {cardData.companyImages.length} 张图片</Text>
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
        backgroundColor: '#ffffff',
    },
    // 顶部导航栏
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        width: 40,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
    },
    iconButton: {
        padding: 8,
    },
    // 滚动区域
    scrollView: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    // 名片展示区域
    cardSection: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderBottomWidth: 8,
        borderBottomColor: '#f8fafc',
    },
    // 卡片样式
    card: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitleIcon: {
        marginRight: 8,
    },
    cardTitleText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    // 联系方式项
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    contactIcon: {
        marginRight: 14,
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 11,
        color: '#94a3b8',
        marginBottom: 3,
        fontWeight: '500',
    },
    contactValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1e293b',
    },
    copyButton: {
        padding: 8,
        marginLeft: 8,
    },
    // 业务项
    businessItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    businessHeader: {
        marginBottom: 8,
    },
    businessName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1e293b',
    },
    businessDescription: {
        fontSize: 15,
        color: '#64748b',
        lineHeight: 22,
    },
    // 段落内容
    sectionContent: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
    },
    // 底部间距
    spacer: {
        height: 24,
    },
    // 标签和备注样式
    tagsSection: {
        marginBottom: 16,
    },
    subsectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    tagChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    addTagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        gap: 4,
    },
    addTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
    },
    noteSection: {
        marginTop: 8,
    },
    noteDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    noteText: {
        flex: 1,
        fontSize: 14,
        color: '#1e293b',
        lineHeight: 20,
    },
    notePlaceholder: {
        flex: 1,
        fontSize: 14,
        color: '#94a3b8',
    },
    noteDisplayReadOnly: {
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        minHeight: 44,
    },
    emptyText: {
        fontSize: 14,
        color: '#cbd5e1',
        fontStyle: 'italic',
    },
    // 模态框样式
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    emptyTags: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTagsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyTagsHint: {
        fontSize: 14,
        color: '#94a3b8',
    },
    tagsList: {
        gap: 8,
    },
    tagSelectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    tagSelectItemActive: {
        borderColor: '#4F46E5',
        backgroundColor: '#eff6ff',
    },
    tagSelectInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tagColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    tagSelectName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1e293b',
    },
    noteModalContent: {
        flex: 1,
        padding: 16,
    },
    noteInput: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#1e293b',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
    },
    saveNoteButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveNoteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
});

export default CardDetailScreen;
