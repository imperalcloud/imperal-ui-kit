'use client';
import type { UIComponent } from '../types';
import MarkdownMessage from './MarkdownMessage';

export const DMarkdown: UIComponent = ({ node }) => {
  const { content = '' } = node.props as { content?: string };
  return <MarkdownMessage content={String(content)} />;
};
