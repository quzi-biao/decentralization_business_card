import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTagStore, Tag, TAG_COLORS } from '../store/useTagStore';
import PageHeader from '../components/PageHeader';
import { ThemeConfig } from '../constants/theme';

interface TagManagementScreenProps {
    onClose: () => void;
}

// 预置标签配置
const PRESET_TAGS = [
    { name: '朋友', color: '#ec4899' },      // 粉色
    { name: '客户', color: '#3b82f6' },      // 蓝色
    { name: '供应商', color: '#22c55e' },    // 绿色
    { name: '合作伙伴', color: '#8b5cf6' },  // 紫色
    { name: '同事', color: '#06b6d4' },      // 青色
    { name: '家人', color: '#ef4444' },      // 红色
];

const TagManagementScreen: React.FC<TagManagementScreenProps> = ({ onClose }) => {
    const { tags, addTag, updateTag, deleteTag, loadTags } = useTagStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);

    useEffect(() => {
        initializeTags();
    }, []);

    const initializeTags = async () => {
        await loadTags();
        // 如果没有标签，添加预置标签
        if (tags.length === 0) {
            for (const preset of PRESET_TAGS) {
                await addTag(preset);
            }
        }
    };

    const handleAddTag = async () => {
        if (!newTagName.trim()) {
            Alert.alert('提示', '请输入标签名称');
            return;
        }

        await addTag({
            name: newTagName.trim(),
            color: selectedColor
        });

        setNewTagName('');
        setSelectedColor(TAG_COLORS[0]);
        setIsAdding(false);
    };

    const handleUpdateTag = async () => {
        if (!editingTag || !newTagName.trim()) {
            Alert.alert('提示', '请输入标签名称');
            return;
        }

        await updateTag(editingTag.id, {
            name: newTagName.trim(),
            color: selectedColor
        });

        setEditingTag(null);
        setNewTagName('');
        setSelectedColor(TAG_COLORS[0]);
    };

    const handleDeleteTag = (tag: Tag) => {
        Alert.alert(
            '删除标签',
            `确定要删除标签"${tag.name}"吗？\n\n此操作将从所有名片中移除该标签。`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteTag(tag.id);
                    }
                }
            ]
        );
    };

    const startEdit = (tag: Tag) => {
        setEditingTag(tag);
        setNewTagName(tag.name);
        setSelectedColor(tag.color);
        setIsAdding(false);
    };

    const cancelEdit = () => {
        setEditingTag(null);
        setNewTagName('');
        setSelectedColor(TAG_COLORS[0]);
        setIsAdding(false);
    };

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <PageHeader 
                    title="标签管理"
                    onBack={onClose}
                    rightButton={{
                        icon: 'add',
                        onPress: () => {
                            setIsAdding(true);
                            setEditingTag(null);
                            setNewTagName('');
                            setSelectedColor(TAG_COLORS[0]);
                        }
                    }}
                    backgroundColor="#f8fafc"
                />

                <ScrollView style={styles.scrollView}>
                {/* 添加/编辑标签表单 */}
                {(isAdding || editingTag) && (
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>
                            {editingTag ? '编辑标签' : '新建标签'}
                        </Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>标签名称</Text>
                            <TextInput
                                style={styles.input}
                                value={newTagName}
                                onChangeText={setNewTagName}
                                placeholder="输入标签名称"
                                placeholderTextColor="#94a3b8"
                                maxLength={20}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>选择颜色</Text>
                            <View style={styles.colorPicker}>
                                {TAG_COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorOption,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.colorOptionSelected
                                        ]}
                                        onPress={() => setSelectedColor(color)}
                                    >
                                        {selectedColor === color && (
                                            <MaterialIcons name="check" size={16} color="#ffffff" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formActions}>
                            <TouchableOpacity 
                                style={[styles.formButton, styles.cancelButton]}
                                onPress={cancelEdit}
                            >
                                <Text style={styles.cancelButtonText}>取消</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.formButton, styles.saveButton]}
                                onPress={editingTag ? handleUpdateTag : handleAddTag}
                            >
                                <Text style={styles.saveButtonText}>
                                    {editingTag ? '保存' : '添加'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* 标签列表 */}
                <View style={styles.tagsSection}>
                    <Text style={styles.sectionTitle}>
                        所有标签 ({tags.length})
                    </Text>
                    
                    {tags.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="label-outline" size={64} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>暂无标签</Text>
                            <Text style={styles.emptyHint}>
                                点击右上角的 + 按钮创建标签
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.tagsList}>
                            {tags.map((tag) => (
                                <View key={tag.id} style={styles.tagItem}>
                                    <View style={styles.tagInfo}>
                                        <View 
                                            style={[
                                                styles.tagColorIndicator,
                                                { backgroundColor: tag.color }
                                            ]}
                                        />
                                        <Text style={styles.tagName}>{tag.name}</Text>
                                    </View>
                                    <View style={styles.tagActions}>
                                        <TouchableOpacity
                                            style={styles.tagActionButton}
                                            onPress={() => startEdit(tag)}
                                        >
                                            <MaterialIcons name="edit" size={20} color={ThemeConfig.colors.textSecondary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.tagActionButton}
                                            onPress={() => handleDeleteTag(tag)}
                                        >
                                            <MaterialIcons name="delete-outline" size={20} color={ThemeConfig.colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.spacer} />
                </ScrollView>
            </View>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
    },
    scrollView: {
        flex: 1,
    },
    formCard: {
        backgroundColor: ThemeConfig.colors.background,
        margin: ThemeConfig.spacing.base,
        padding: ThemeConfig.spacing.lg,
        borderRadius: ThemeConfig.borderRadius.lg,
        ...ThemeConfig.shadow.sm,
    },
    formTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textPrimary,
        marginBottom: ThemeConfig.spacing.base,
    },
    inputGroup: {
        marginBottom: ThemeConfig.spacing.base,
    },
    inputLabel: {
        fontSize: ThemeConfig.fontSize.base - 1,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: ThemeConfig.spacing.sm,
    },
    input: {
        backgroundColor: ThemeConfig.colors.backgroundSecondary,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
        paddingHorizontal: ThemeConfig.spacing.md,
        paddingVertical: ThemeConfig.spacing.md,
        fontSize: ThemeConfig.fontSize.md,
        color: ThemeConfig.colors.textPrimary,
        borderWidth: ThemeConfig.borderWidth.thin,
        borderColor: ThemeConfig.colors.border,
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ThemeConfig.spacing.md,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ThemeConfig.borderWidth.base,
        borderColor: 'transparent',
    },
    colorOptionSelected: {
        borderColor: ThemeConfig.colors.textPrimary,
        borderWidth: 3,
    },
    formActions: {
        flexDirection: 'row',
        gap: ThemeConfig.spacing.md,
        marginTop: ThemeConfig.spacing.sm,
    },
    formButton: {
        flex: 1,
        paddingVertical: ThemeConfig.spacing.md,
        borderRadius: ThemeConfig.borderRadius.sm + 2,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: ThemeConfig.colors.backgroundTertiary,
    },
    cancelButtonText: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
    },
    saveButton: {
        backgroundColor: ThemeConfig.colors.primary,
    },
    saveButtonText: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.white,
    },
    tagsSection: {
        marginHorizontal: ThemeConfig.spacing.base,
    },
    sectionTitle: {
        fontSize: ThemeConfig.fontSize.base,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
        marginBottom: ThemeConfig.spacing.md,
    },
    tagsList: {
        gap: ThemeConfig.spacing.sm,
    },
    tagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: ThemeConfig.colors.background,
        padding: ThemeConfig.spacing.base,
        borderRadius: ThemeConfig.borderRadius.md,
        ...ThemeConfig.shadow.xs,
    },
    tagInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    tagColorIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: ThemeConfig.spacing.md,
    },
    tagName: {
        fontSize: ThemeConfig.fontSize.md,
        fontWeight: ThemeConfig.fontWeight.medium,
        color: ThemeConfig.colors.textPrimary,
    },
    tagActions: {
        flexDirection: 'row',
        gap: ThemeConfig.spacing.sm,
    },
    tagActionButton: {
        padding: ThemeConfig.spacing.sm,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: ThemeConfig.spacing.xxxl - 8,
    },
    emptyTitle: {
        fontSize: ThemeConfig.fontSize.lg,
        fontWeight: ThemeConfig.fontWeight.semibold,
        color: ThemeConfig.colors.textSecondary,
        marginTop: ThemeConfig.spacing.base,
        marginBottom: ThemeConfig.spacing.sm,
    },
    emptyHint: {
        fontSize: ThemeConfig.fontSize.base,
        color: ThemeConfig.colors.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
    spacer: {
        height: ThemeConfig.spacing.xxxl - 16,
    },
});

export default TagManagementScreen;
