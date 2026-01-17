import React, { useState, useEffect } from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeConfig } from '../constants/theme';
import { fileManager } from '../services/fileManager';

const { width, height } = Dimensions.get('window');

interface ImageViewerProps {
    visible: boolean;
    imageUrl: string; // 可以是 imageId 或直接的 URL
    onClose: () => void;
}

/**
 * 图片查看器组件
 * 用于全屏查看图片，支持点击关闭
 */
const ImageViewer: React.FC<ImageViewerProps> = ({ visible, imageUrl, onClose }) => {
    const [actualUri, setActualUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        let isMounted = true;
        
        const loadImage = async () => {
            if (!imageUrl) {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            
            // 判断是 URL 还是 imageId
            // URL 通常以 http:// 或 https:// 或 file:// 开头，或者是 data: URI
            if (imageUrl.startsWith('http://') || 
                imageUrl.startsWith('https://') || 
                imageUrl.startsWith('file://') ||
                imageUrl.startsWith('data:')) {
                // 直接使用 URL
                if (isMounted) {
                    setActualUri(imageUrl);
                    setLoading(false);
                }
            } else {
                // 当作 imageId 处理，需要获取文件 URI
                try {
                    const uri = await fileManager.getFileUri(imageUrl, false);
                    if (isMounted) {
                        setActualUri(uri);
                        setLoading(false);
                    }
                } catch (error) {
                    console.error('Failed to load image:', error);
                    if (isMounted) {
                        setLoading(false);
                    }
                }
            }
        };
        
        if (visible) {
            loadImage();
        }
        
        return () => {
            isMounted = false;
        };
    }, [imageUrl, visible]);
    
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <StatusBar barStyle="light-content" />
            <View style={styles.container}>
                <TouchableOpacity 
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    {loading ? (
                        <ActivityIndicator size="large" color="#fff" />
                    ) : actualUri ? (
                        <Image
                            source={{ uri: actualUri }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    ) : null}
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={onClose}
                >
                    <MaterialIcons name="close" size={30} color="#fff" />
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: height,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ImageViewer;
