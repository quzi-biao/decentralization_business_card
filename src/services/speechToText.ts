import * as FileSystem from 'expo-file-system/legacy';
import { N8N_CONFIG } from '../config/n8n.config';

/**
 * 语音转文字服务
 * 使用腾讯云一句话识别 API（通过 n8n 工作流）
 */
export class SpeechToTextService {
  /**
   * 将音频文件转换为文字
   * @param audioUri 音频文件的本地 URI
   * @param format 音频格式 (wav, mp3, m4a)
   * @param sampleRate 采样率 (8000 或 16000)
   * @returns 识别的文字内容
   */
  static async convertAudioToText(
    audioUri: string,
    format: 'wav' | 'mp3' | 'm4a' = 'wav',
    sampleRate: 8000 | 16000 = 16000
  ): Promise<string> {
    try {
      // 读取音频文件并转换为 Base64
      const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: 'base64',
      });

      // 构建 webhook URL
      const webhookUrl = `${N8N_CONFIG.baseUrl}/webhook/${N8N_CONFIG.speechToTextWebhookPath}`;

      console.log('调用语音识别 API:', webhookUrl);

      // 调用 n8n 工作流
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: audioBase64,
          format: format,
          sampleRate: sampleRate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('语音识别成功:', result.text);
        return result.text;
      } else {
        throw new Error(result.error || '语音识别失败');
      }
    } catch (error) {
      console.error('语音识别错误:', error);
      throw new Error(
        error instanceof Error ? error.message : '语音识别服务暂时不可用'
      );
    }
  }

  /**
   * 检查音频文件是否符合要求
   * @param audioUri 音频文件 URI
   * @returns 是否符合要求
   */
  static async validateAudioFile(audioUri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      
      if (!fileInfo.exists) {
        throw new Error('音频文件不存在');
      }

      // 检查文件大小（限制 10MB）
      if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
        throw new Error('音频文件过大，请控制在 10MB 以内');
      }

      return true;
    } catch (error) {
      console.error('音频文件验证失败:', error);
      throw error;
    }
  }
}
