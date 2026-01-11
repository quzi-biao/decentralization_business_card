/**
 * Crypto Polyfill for React Native
 * 覆盖可能被 crypto-js 使用的原生 crypto 模块
 */

// 创建一个假的 crypto 对象，使用 Math.random
const cryptoPolyfill = {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  randomBytes: (size: number) => {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }
};

// 注入到全局对象
if (typeof global !== 'undefined') {
  (global as any).crypto = cryptoPolyfill;
}

if (typeof window !== 'undefined') {
  (window as any).crypto = cryptoPolyfill;
}

export default cryptoPolyfill;
