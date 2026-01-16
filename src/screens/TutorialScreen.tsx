import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PageHeader from '../components/PageHeader';
import { ThemeConfig } from '../constants/theme';

interface Props {
    onClose: () => void;
}

interface TutorialStep {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
}

const { width } = Dimensions.get('window');

const TutorialScreen: React.FC<Props> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const steps: TutorialStep[] = [
        {
            id: 'welcome',
            title: '欢迎使用智能名片',
            description: '这是一款基于区块链技术的去中心化数字名片应用。您的数据完全由您掌控，安全可靠。',
            icon: 'waving-hand',
            color: '#4F46E5'
        },
        {
            id: 'identity',
            title: '去中心化身份',
            description: '应用会为您生成唯一的 DID（去中心化身份标识）和助记词。助记词是恢复账户的唯一凭证，请务必妥善保管。',
            icon: 'fingerprint',
            color: '#10b981'
        },
        {
            id: 'ai-assistant',
            title: 'AI 智能助手',
            description: '使用 AI 助手快速创建您的名片。AI 会通过对话引导您填写信息，让创建名片变得简单有趣。',
            icon: 'smart-toy',
            color: '#f59e0b'
        },
        {
            id: 'exchange',
            title: '名片交换',
            description: '通过扫描二维码或 NFC 近场通信，快速与他人交换名片。所有交换记录都会加密保存在您的设备上。',
            icon: 'swap-horiz',
            color: '#ef4444'
        },
        {
            id: 'privacy',
            title: '隐私保护',
            description: '所有数据都经过 AES 加密存储在本地。您可以自由控制哪些信息对外展示，哪些信息保持私密。',
            icon: 'lock',
            color: '#8b5cf6'
        },
        {
            id: 'backup',
            title: '备份与恢复',
            description: '定期备份您的数据，防止意外丢失。您可以随时导出数据，并在新设备上恢复。',
            icon: 'backup',
            color: '#06b6d4'
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const currentStepData = steps[currentStep];

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <PageHeader 
                    title="使用教程"
                    onBack={onClose}
                    backgroundColor={ThemeConfig.colors.backgroundSecondary}
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.stepIndicator}>
                    {steps.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.stepDot,
                                index === currentStep && styles.stepDotActive,
                                index < currentStep && styles.stepDotCompleted
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.stepCard}>
                    <View style={[styles.iconContainer, { backgroundColor: `${currentStepData.color}20` }]}>
                        <MaterialIcons 
                            name={currentStepData.icon as any} 
                            size={64} 
                            color={currentStepData.color} 
                        />
                    </View>

                    <Text style={styles.stepTitle}>{currentStepData.title}</Text>
                    <Text style={styles.stepDescription}>{currentStepData.description}</Text>

                    <Text style={styles.stepCounter}>
                        {currentStep + 1} / {steps.length}
                    </Text>
                </View>

                <View style={styles.featuresList}>
                    <Text style={styles.featuresTitle}>核心功能</Text>
                    
                    <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={20} color={ThemeConfig.colors.success} />
                        <Text style={styles.featureText}>AI 智能对话创建名片</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={20} color={ThemeConfig.colors.success} />
                        <Text style={styles.featureText}>扫码快速交换名片</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={20} color={ThemeConfig.colors.success} />
                        <Text style={styles.featureText}>加密存储保护隐私</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={20} color={ThemeConfig.colors.success} />
                        <Text style={styles.featureText}>去中心化身份管理</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={20} color={ThemeConfig.colors.success} />
                        <Text style={styles.featureText}>数据备份与恢复</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={20} color={ThemeConfig.colors.success} />
                        <Text style={styles.featureText}>自定义名片模板</Text>
                    </View>
                </View>

                <View style={styles.spacer} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
                    onPress={handlePrev}
                    disabled={currentStep === 0}
                >
                    <MaterialIcons 
                        name="chevron-left" 
                        size={24} 
                        color={currentStep === 0 ? ThemeConfig.colors.textDisabled : ThemeConfig.colors.primary} 
                    />
                    <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
                        上一步
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                >
                    <Text style={styles.nextButtonText}>
                        {currentStep === steps.length - 1 ? '开始使用' : '下一步'}
                    </Text>
                    <MaterialIcons name="chevron-right" size={24} color={ThemeConfig.colors.white} />
                </TouchableOpacity>
            </View>
            </View>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    scrollContent: {
        padding: ThemeConfig.spacing.base,
    },
    spacer: {
        height: 100,
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: ThemeConfig.spacing.sm,
        marginBottom: ThemeConfig.spacing.xxxl - 8,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: ThemeConfig.colors.border,
    },
    stepDotActive: {
        width: 24,
        backgroundColor: ThemeConfig.colors.primary,
    },
    stepDotCompleted: {
        backgroundColor: ThemeConfig.colors.success,
    },
    stepCard: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.xxxl - 8,
        alignItems: 'center',
        marginBottom: ThemeConfig.spacing.xxxl - 16,
        shadowColor: ThemeConfig.colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: ThemeConfig.spacing.xxxl - 16,
    },
    stepTitle: {
        fontSize: ThemeConfig.fontSize.xxxl,
        fontWeight: ThemeConfig.fontWeight.bold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.md,
        textAlign: 'center',
    },
    stepDescription: {
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textSecondary,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: ThemeConfig.spacing.base,
    },
    stepCounter: {
        fontSize: ThemeConfig.fontSize.base - 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textTertiary,
    },
    featuresList: {
        backgroundColor: ThemeConfig.colors.background,
        borderRadius: ThemeConfig.borderRadius.lg,
        padding: ThemeConfig.spacing.lg,
    },
    featuresTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.base,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ThemeConfig.spacing.md,
        marginBottom: ThemeConfig.spacing.md,
    },
    featureText: {
        fontSize: ThemeConfig.fontSize.base,
        color: '#475569',
    },
    footer: {
        backgroundColor: ThemeConfig.colors.background,
        borderTopWidth: ThemeConfig.borderWidth.thin,
        borderTopColor: ThemeConfig.colors.border,
        paddingHorizontal: ThemeConfig.spacing.base,
        paddingVertical: ThemeConfig.spacing.md,
        paddingBottom: ThemeConfig.spacing.xxxl - 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: ThemeConfig.spacing.md,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ThemeConfig.spacing.lg,
        paddingVertical: ThemeConfig.spacing.md,
        borderRadius: ThemeConfig.borderRadius.md,
        backgroundColor: ThemeConfig.colors.background,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    navButtonDisabled: {
        opacity: 0.4,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    navButtonText: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.primary,
    },
    navButtonTextDisabled: {
        color: ThemeConfig.colors.textTertiary,
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: ThemeConfig.spacing.md,
        borderRadius: ThemeConfig.borderRadius.md,
        backgroundColor: ThemeConfig.colors.primary,
        gap: 4,
    },
    nextButtonText: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.white,
    },
});

export default TutorialScreen;
