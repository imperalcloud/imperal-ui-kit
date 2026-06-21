'use client';
import type { UIComponent } from '../types';

export const DHeader: UIComponent = ({ node }) => {
  const { text, level = 2, subtitle } = node.props as {
    text?: string;
    level?: 1 | 2 | 3 | 4;
    subtitle?: string;
  };

  const sizes: Record<number, string> = {
    1: 'text-2xl',
    2: 'text-xl',
    3: 'text-lg',
    4: 'text-base',
  };
  const cls = `${sizes[level] || 'text-xl'} font-semibold text-body`;

  const heading =
    level === 1 ? <h1 className={cls}>{text}</h1> :
    level === 3 ? <h3 className={cls}>{text}</h3> :
    level === 4 ? <h4 className={cls}>{text}</h4> :
    <h2 className={cls}>{text}</h2>;

  if (!subtitle) return heading;
  return (
    <div>
      {heading}
      <p className="text-sm text-muted mt-1">{subtitle}</p>
    </div>
  );
};
