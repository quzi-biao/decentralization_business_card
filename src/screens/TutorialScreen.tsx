import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PageHeader from '../components/PageHeader';

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
                    backgroundColor="#f8fafc"
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
                        <MaterialIcons name="check-circle" size={20} color="#10b981" />
                        <Text style={styles.featureText}>AI 智能对话创建名片</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={20} color="#10b981" />
                        <Text style={styles.featureText}>扫码快速交换名片</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={20} color="#10b981" />
                        <Text style={styles.featureText}>加密存储保护隐私</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={20} color="#10b981" />
                        <Text style={styles.featureText}>去中心化身份管理</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={20} color="#10b981" />
                        <Text style={styles.featureText}>数据备份与恢复</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <MaterialIcons name="check-circle" size={20} color="#10b981" />
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
                        color={currentStep === 0 ? '#cbd5e1' : '#4F46E5'} 
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
                    <MaterialIcons name="chevron-right" size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>
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
    spacer: {
        height: 100,
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e2e8f0',
    },
    stepDotActive: {
        width: 24,
        backgroundColor: '#4F46E5',
    },
    stepDotCompleted: {
        backgroundColor: '#10b981',
    },
    stepCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
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
        marginBottom: 24,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
    },
    stepDescription: {
        fontSize: 15,
        color: '#64748b',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 16,
    },
    stepCounter: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
    },
    featuresList: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
    },
    featuresTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    featureText: {
        fontSize: 14,
        color: '#475569',
    },
    footer: {
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    navButtonDisabled: {
        opacity: 0.4,
        backgroundColor: '#f8fafc',
    },
    navButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4F46E5',
    },
    navButtonTextDisabled: {
        color: '#94a3b8',
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        gap: 4,
    },
    nextButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
});

export default TutorialScreen;
