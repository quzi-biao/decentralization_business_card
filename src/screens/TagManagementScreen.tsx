import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTagStore, Tag, TAG_COLORS } from '../store/useTagStore';
import PageHeader from '../components/PageHeader';

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
                                            <MaterialIcons name="edit" size={20} color="#64748b" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.tagActionButton}
                                            onPress={() => handleDeleteTag(tag)}
                                        >
                                            <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
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
        backgroundColor: '#f8fafc',
    },
    scrollView: {
        flex: 1,
    },
    formCard: {
        backgroundColor: '#ffffff',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1e293b',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOptionSelected: {
        borderColor: '#1e293b',
        borderWidth: 3,
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    formButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f1f5f9',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
    },
    saveButton: {
        backgroundColor: '#4F46E5',
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
    tagsSection: {
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 12,
    },
    tagsList: {
        gap: 8,
    },
    tagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
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
        marginRight: 12,
    },
    tagName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1e293b',
    },
    tagActions: {
        flexDirection: 'row',
        gap: 8,
    },
    tagActionButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyHint: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    },
    spacer: {
        height: 24,
    },
});

export default TagManagementScreen;
