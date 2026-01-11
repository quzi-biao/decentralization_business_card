import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { BusinessCardData } from '../store/useCardStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = CARD_WIDTH / 1.58;

interface Props {
    data: BusinessCardData;
}

export const PremiumCard: React.FC<Props> = ({ data }) => {
    return (
        <View
            style={[
                styles.card,
                { width: CARD_WIDTH, height: CARD_HEIGHT },
            ]}
        >
            <View style={styles.blurContainer}>
                    <View style={styles.decorativeGlow} />

                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.name} numberOfLines={1}>
                                {data.realName}
                            </Text>
                            <Text style={styles.title}>
                                {data.position} @ {data.companyName}
                            </Text>
                        </View>
                        <View style={styles.iconContainer}>
                            <Text style={styles.iconEmoji}>✨</Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.contactInfo}>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactEmoji}>📧</Text>
                                <Text style={styles.contactText}>{data.email}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactEmoji}>📞</Text>
                                <Text style={styles.contactText}>{data.phone}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Text style={styles.contactEmoji}>📍</Text>
                                <Text style={styles.contactText} numberOfLines={1}>{data.address}</Text>
                            </View>
                        </View>

                        <View style={styles.tagsContainer}>
                            {data.tags.slice(0, 2).map((tag, idx) => (
                                <View key={idx} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.bottomLine} />
            </View>

            <View style={styles.reflection} />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#475569',
        borderWidth: 0,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    blurContainer: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
        backgroundColor: 'rgba(71,85,105,0.98)',
    },
    decorativeGlow: {
        position: 'absolute',
        top: 0,
        right: 16,
        width: 48,
        height: 48,
        backgroundColor: 'rgba(148, 163, 184, 0.2)',
        borderRadius: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 10,
    },
    headerContent: {
        flex: 1,
    },
    name: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 1,
    },
    title: {
        color: '#cbd5e1',
        fontSize: 13,
        fontWeight: '400',
        letterSpacing: 0.3,
        marginTop: 6,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderColor: 'rgba(203, 213, 225, 0.3)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(148, 163, 184, 0.15)',
    },
    iconEmoji: {
        fontSize: 16,
    },
    contactEmoji: {
        fontSize: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        zIndex: 10,
    },
    contactInfo: {
        flex: 1,
        gap: 6,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactText: {
        color: '#e2e8f0',
        fontSize: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        gap: 4,
        marginLeft: 16,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(148,163,184,0.2)',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(203,213,225,0.3)',
    },
    tagText: {
        fontSize: 11,
        color: '#e2e8f0',
        fontWeight: '400',
    },
    bottomLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(203, 213, 225, 0.3)',
    },
    reflection: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
    },
});
