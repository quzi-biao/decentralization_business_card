import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PageHeader from '../components/PageHeader';

interface Props {
    onClose: () => void;
}

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
}

const FAQScreen: React.FC<Props> = ({ onClose }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const faqs: FAQ[] = [
        {
            id: '1',
            category: '基础使用',
            question: '什么是去中心化数字名片？',
            answer: '去中心化数字名片是基于区块链技术的数字身份名片。与传统名片不同，您的数据完全存储在本地设备，不依赖中心化服务器，真正实现数据自主权。'
        },
        {
            id: '2',
            category: '基础使用',
            question: '如何创建我的第一张名片？',
            answer: '点击底部导航栏的"AI助手"，AI 会通过对话引导您填写名片信息。您也可以在"我的"页面点击"编辑我的名片"手动填写。'
        },
        {
            id: '3',
            category: '基础使用',
            question: '如何与他人交换名片？',
            answer: '进入"交换"页面，可以选择扫描对方二维码或展示自己的二维码让对方扫描。未来还将支持 NFC 近场通信交换。'
        },
        {
            id: '4',
            category: '安全隐私',
            question: '什么是助记词？为什么重要？',
            answer: '助记词是一组 12 个单词，是恢复您账户的唯一凭证。如果更换设备或重装应用，只有助记词能恢复您的身份和数据。请务必抄写在纸上并妥善保管，不要截图或保存在云端。'
        },
        {
            id: '5',
            category: '安全隐私',
            question: '我的数据存储在哪里？',
            answer: '所有数据都经过 AES 加密后存储在您的手机本地。我们不会上传您的任何数据到服务器，您完全掌控自己的信息。'
        },
        {
            id: '6',
            category: '安全隐私',
            question: '如何保护我的隐私？',
            answer: '您可以在"访问权限管理"中控制应用权限，在名片编辑中选择哪些字段对外展示。所有敏感信息都经过加密存储。'
        },
        {
            id: '7',
            category: '数据管理',
            question: '如何备份我的数据？',
            answer: '进入"我的" → "备份与恢复" → "立即备份"，系统会导出您的聊天记录和名片数据。建议定期备份并保存到安全的地方。'
        },
        {
            id: '8',
            category: '数据管理',
            question: '更换手机后如何恢复数据？',
            answer: '在新设备上安装应用后，使用助记词恢复身份，然后在"备份与恢复"中导入之前的备份文件即可恢复所有数据。'
        },
        {
            id: '9',
            category: '数据管理',
            question: '可以删除所有数据吗？',
            answer: '可以。进入"我的"页面，在"数据管理"部分点击"清除所有数据"。注意：此操作不可恢复，清除前请确保已备份重要数据。'
        },
        {
            id: '10',
            category: '功能特性',
            question: 'AI 助手如何帮助我？',
            answer: 'AI 助手会通过自然对话引导您填写名片信息，自动识别和提取关键信息，让创建名片变得简单有趣。它还会根据您的回答提供个性化建议。'
        },
        {
            id: '11',
            category: '功能特性',
            question: '什么是 DID 和公钥？',
            answer: 'DID（去中心化身份标识）是您在区块链上的唯一身份标识，类似于钱包地址。公钥用于验证您的身份和签名，可以安全地分享给他人。'
        },
        {
            id: '12',
            category: '功能特性',
            question: '支持哪些名片模板？',
            answer: '目前提供多种专业名片模板，包括商务风格、创意风格、简约风格等。您可以在"名片模板选择"中预览和切换不同模板。'
        },
        {
            id: '13',
            category: '故障排查',
            question: 'AI 助手无法响应怎么办？',
            answer: '请检查网络连接是否正常。AI 助手需要联网才能工作。如果网络正常但仍无法响应，请尝试重启应用或联系我们。'
        },
        {
            id: '14',
            category: '故障排查',
            question: '扫码功能无法使用？',
            answer: '请确保已授予相机权限。进入"访问权限管理"检查相机权限是否开启。如果权限已开启但仍无法使用，请检查系统设置中的应用权限。'
        },
        {
            id: '15',
            category: '故障排查',
            question: '忘记助记词怎么办？',
            answer: '很遗憾，如果丢失助记词且设备损坏或应用被卸载，将无法恢复您的身份和数据。这是去中心化的特性，没有中心化服务器可以帮您找回。请务必妥善保管助记词。'
        }
    ];

    const categories = Array.from(new Set(faqs.map(faq => faq.category)));

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <PageHeader 
                    title="常见问题"
                    onBack={onClose}
                    backgroundColor="#f8fafc"
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.infoCard}>
                    <MaterialIcons name="help-outline" size={24} color="#4F46E5" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>帮助中心</Text>
                        <Text style={styles.infoText}>
                            这里收集了最常见的问题和解答。如果没有找到您需要的答案，请通过"联系我们"与我们取得联系。
                        </Text>
                    </View>
                </View>

                {categories.map(category => (
                    <View key={category} style={styles.categorySection}>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        {faqs
                            .filter(faq => faq.category === category)
                            .map(faq => (
                                <TouchableOpacity
                                    key={faq.id}
                                    style={styles.faqCard}
                                    onPress={() => toggleExpand(faq.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.faqHeader}>
                                        <Text style={styles.faqQuestion}>{faq.question}</Text>
                                        <MaterialIcons
                                            name={expandedId === faq.id ? 'expand-less' : 'expand-more'}
                                            size={24}
                                            color="#64748b"
                                        />
                                    </View>
                                    {expandedId === faq.id && (
                                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                    </View>
                ))}

                <View style={styles.contactCard}>
                    <MaterialIcons name="email" size={24} color="#4F46E5" />
                    <View style={styles.contactContent}>
                        <Text style={styles.contactTitle}>还有其他问题？</Text>
                        <Text style={styles.contactText}>
                            如果以上内容没有解决您的问题，请通过"联系我们"页面与我们取得联系。
                        </Text>
                    </View>
                </View>
            </ScrollView>
            </View>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: 16,
    },
    infoCard: {
        backgroundColor: '#ede9fe',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4F46E5',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#6366f1',
        lineHeight: 18,
    },
    categorySection: {
        marginBottom: 24,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
        paddingLeft: 4,
    },
    faqCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    faqQuestion: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        lineHeight: 20,
    },
    faqAnswer: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    contactCard: {
        backgroundColor: '#ede9fe',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    contactContent: {
        flex: 1,
    },
    contactTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4F46E5',
        marginBottom: 4,
    },
    contactText: {
        fontSize: 13,
        color: '#6366f1',
        lineHeight: 18,
    },
});

export default FAQScreen;
