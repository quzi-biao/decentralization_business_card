import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface RichTextRendererProps {
  content: string;
  style?: TextStyle;
}

/**
 * 智能检测并渲染富文本内容
 * 支持 Markdown 和 HTML 格式，自动检测并选择合适的渲染方式
 */
export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, style }) => {
  // 检测是否为 HTML 格式
  const isHTML = /<[^>]+>/.test(content);
  
  // 检测是否为 Markdown 格式
  const isMarkdown = /[#*_\[\]`]/.test(content) || /\n[-*+]\s/.test(content);

  // 如果是 HTML，暂时使用纯文本显示（React Native 不直接支持 HTML）
  // 可以考虑使用 react-native-render-html 库来渲染 HTML
  if (isHTML) {
    // 简单的 HTML 标签清理
    const cleanText = content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    
    return <Text style={[styles.text, style]}>{cleanText}</Text>;
  }

  // 如果是 Markdown，使用 Markdown 渲染器
  if (isMarkdown) {
    return (
      <Markdown
        style={{
          body: { ...styles.text, ...style },
          heading1: styles.heading1,
          heading2: styles.heading2,
          heading3: styles.heading3,
          paragraph: styles.paragraph,
          strong: styles.strong,
          em: styles.em,
          link: styles.link,
          list_item: styles.listItem,
          bullet_list: styles.bulletList,
          ordered_list: styles.orderedList,
          code_inline: styles.codeInline,
          code_block: styles.codeBlock,
          blockquote: styles.blockquote,
        }}
      >
        {content}
      </Markdown>
    );
  }

  // 默认使用纯文本
  return <Text style={[styles.text, style]}>{content}</Text>;
};

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  heading1: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 12,
  },
  strong: {
    fontWeight: '700',
    color: '#1e293b',
  },
  em: {
    fontStyle: 'italic',
    color: '#475569',
  },
  link: {
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
  listItem: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 4,
  },
  bulletList: {
    marginBottom: 12,
  },
  orderedList: {
    marginBottom: 12,
  },
  codeInline: {
    fontFamily: 'Courier',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    color: '#dc2626',
  },
  codeBlock: {
    fontFamily: 'Courier',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 12,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#cbd5e1',
    paddingLeft: 12,
    marginLeft: 8,
    fontStyle: 'italic',
    color: '#64748b',
  },
});
