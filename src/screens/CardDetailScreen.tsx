import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { BusinessCardData } from '../store/useCardStore';
import MyCard from '../components/MyCard';
import { RichTextRenderer } from '../components/RichTextRenderer';

const { width } = Dimensions.get('window');

interface CardDetailScreenProps {
    cardData: BusinessCardData;
    onClose: () => void;
}

/**
 * 名片详情页面
 * 完整的独立页面展示名片信息
 */
const CardDetailScreen: React.FC<CardDetailScreenProps> = ({ cardData, onClose }) => {
    const handleCopy = async (text: string, label: string) => {
        try {
            await Clipboard.setStringAsync(text);
            Alert.alert('已复制', `${label}已复制到剪贴板`);
        } catch (error) {
            Alert.alert('复制失败', '无法复制到剪贴板');
        }
    };
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* 顶部导航栏 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>名片详情</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* 名片展示 */}
                <View style={styles.cardSection}>
                    <MyCard cardData={cardData} />
                </View>

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
});

export default CardDetailScreen;
