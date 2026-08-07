'use client';
import type { UIComponent } from '../types';

export const DCode: UIComponent = ({ node }) => {
  const { content, line_numbers = false } = node.props as { content?: string; line_numbers?: boolean };
  const lines = content?.split('\n') || [];
  return (
    <pre className="surface bg-code p-3 overflow-x-auto text-sm">
      <code>
        {lines.map((line: string, i: number) => (
          <div key={i} className="flex">
            {line_numbers && <span className="select-none text-subtle w-8 text-right mr-3 flex-shrink-0">{i + 1}</span>}
            <span className="text-body">{line}</span>
          </div>
        ))}
      </code>
    </pre>
  );
};
