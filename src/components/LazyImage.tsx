import React, { useState, useEffect } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { fileManager } from '../services/fileManager';
import { imageCache } from '../utils/imageCache';
import { ThemeConfig } from '../constants/theme';

interface LazyImageProps extends Omit<ImageProps, 'source'> {
  imageId: string | null | undefined;
  useThumbnail?: boolean;
  fallbackSource?: ImageProps['source'];
  showLoader?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  imageId,
  useThumbnail = false,
  fallbackSource,
  showLoader = true,
  style,
  ...imageProps
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!imageId) {
        setLoading(false);
        setError(true);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        // 检查缓存
        const cachedUri = imageCache.getCachedUri(imageId, useThumbnail);
        if (cachedUri) {
          if (isMounted) {
            setImageUri(cachedUri);
            setLoading(false);
          }
          return;
        }

        // 从存储加载
        const uri = await fileManager.getFileUri(imageId, false);
        
        if (isMounted) {
          if (uri) {
            imageCache.setCachedUri(imageId, uri, useThumbnail);
            setImageUri(uri);
          } else {
            setError(true);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load image:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [imageId, useThumbnail]);

  if (loading && showLoader) {
    return (
      <View style={[styles.loaderContainer, style]}>
        <ActivityIndicator size="small" color={ThemeConfig.colors.textSecondary} />
      </View>
    );
  }

  if (error || !imageUri) {
    if (fallbackSource) {
      return <Image source={fallbackSource} style={style} {...imageProps} />;
    }
    return (
      <View style={[styles.placeholderContainer, style]}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      {...imageProps}
      progressiveRenderingEnabled
      onError={() => setError(true)}
    />
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ThemeConfig.colors.backgroundTertiary,
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ThemeConfig.colors.backgroundTertiary,
  },
  placeholder: {
    width: '60%',
    height: '60%',
    backgroundColor: ThemeConfig.colors.textDisabled,
    borderRadius: ThemeConfig.borderRadius.base,
  },
});
