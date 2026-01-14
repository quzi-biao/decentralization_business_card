class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value!;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

class ImageCacheManager {
  private uriCache: LRUCache<string, string>;
  private base64Cache: LRUCache<string, string>;

  constructor() {
    this.uriCache = new LRUCache<string, string>(100);
    this.base64Cache = new LRUCache<string, string>(20);
  }

  getCachedUri(imageId: string, useThumbnail: boolean = false): string | undefined {
    const cacheKey = `${imageId}_${useThumbnail ? 'thumb' : 'original'}`;
    return this.uriCache.get(cacheKey);
  }

  setCachedUri(imageId: string, uri: string, useThumbnail: boolean = false): void {
    const cacheKey = `${imageId}_${useThumbnail ? 'thumb' : 'original'}`;
    this.uriCache.set(cacheKey, uri);
  }

  getCachedBase64(imageId: string, useThumbnail: boolean = false): string | undefined {
    const cacheKey = `${imageId}_${useThumbnail ? 'thumb' : 'original'}`;
    return this.base64Cache.get(cacheKey);
  }

  setCachedBase64(imageId: string, base64: string, useThumbnail: boolean = false): void {
    const cacheKey = `${imageId}_${useThumbnail ? 'thumb' : 'original'}`;
    this.base64Cache.set(cacheKey, base64);
  }

  invalidate(imageId: string): void {
    this.uriCache.delete(`${imageId}_original`);
    this.uriCache.delete(`${imageId}_thumb`);
    this.base64Cache.delete(`${imageId}_original`);
    this.base64Cache.delete(`${imageId}_thumb`);
  }

  clearAll(): void {
    this.uriCache.clear();
    this.base64Cache.clear();
  }

  getStats() {
    return {
      uriCacheSize: this.uriCache.size(),
      base64CacheSize: this.base64Cache.size(),
    };
  }
}

export const imageCache = new ImageCacheManager();
