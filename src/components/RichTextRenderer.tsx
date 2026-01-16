import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { ThemeConfig } from '../constants/theme';

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
    fontSize: ThemeConfig.fontSize.md,
    color: '#475569',
    lineHeight: 24,
  },
  heading1: {
    fontSize: ThemeConfig.fontSize.xxxl,
    fontWeight: ThemeConfig.fontWeight.bold,
    color: ThemeConfig.colors.textPrimary,
    marginTop: ThemeConfig.spacing.base,
    marginBottom: ThemeConfig.spacing.sm,
  },
  heading2: {
    fontSize: ThemeConfig.fontSize.xxl,
    fontWeight: ThemeConfig.fontWeight.semibold,
    color: ThemeConfig.colors.textPrimary,
    marginTop: ThemeConfig.spacing.md,
    marginBottom: 6,
  },
  heading3: {
    fontSize: ThemeConfig.fontSize.xl,
    fontWeight: ThemeConfig.fontWeight.semibold,
    color: '#334155',
    marginTop: ThemeConfig.spacing.sm + 2,
    marginBottom: ThemeConfig.spacing.xs,
  },
  paragraph: {
    fontSize: ThemeConfig.fontSize.md,
    color: '#475569',
    lineHeight: 24,
    marginBottom: ThemeConfig.spacing.md,
  },
  strong: {
    fontWeight: ThemeConfig.fontWeight.bold,
    color: ThemeConfig.colors.textPrimary,
  },
  em: {
    fontStyle: 'italic',
    color: '#475569',
  },
  link: {
    color: ThemeConfig.colors.primary,
    textDecorationLine: 'underline',
  },
  listItem: {
    fontSize: ThemeConfig.fontSize.md,
    color: '#475569',
    lineHeight: 24,
    marginBottom: ThemeConfig.spacing.xs,
  },
  bulletList: {
    marginBottom: ThemeConfig.spacing.md,
  },
  orderedList: {
    marginBottom: ThemeConfig.spacing.md,
  },
  codeInline: {
    fontFamily: 'Courier',
    backgroundColor: ThemeConfig.colors.backgroundTertiary,
    paddingHorizontal: ThemeConfig.spacing.xs,
    paddingVertical: 2,
    borderRadius: ThemeConfig.borderRadius.sm,
    fontSize: ThemeConfig.fontSize.base,
    color: '#dc2626',
  },
  codeBlock: {
    fontFamily: 'Courier',
    backgroundColor: ThemeConfig.colors.backgroundTertiary,
    padding: ThemeConfig.spacing.md,
    borderRadius: ThemeConfig.borderRadius.base,
    fontSize: ThemeConfig.fontSize.base,
    color: ThemeConfig.colors.textPrimary,
    marginBottom: ThemeConfig.spacing.md,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: ThemeConfig.colors.textDisabled,
    paddingLeft: ThemeConfig.spacing.md,
    marginLeft: ThemeConfig.spacing.sm,
    fontStyle: 'italic',
    color: ThemeConfig.colors.textSecondary,
  },
});
