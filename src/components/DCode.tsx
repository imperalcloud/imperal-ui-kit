'use client';
import type { UIComponent } from '../types';

export const DCode: UIComponent = ({ node }) => {
  const { content, language = '', line_numbers = false } = node.props as any;
  const lines = content?.split('\n') || [];
  return (
    <pre className="bg-gray-900 border border-gray-800 rounded-md p-3 overflow-x-auto text-sm">
      <code>
        {lines.map((line: string, i: number) => (
          <div key={i} className="flex">
            {line_numbers && <span className="select-none text-gray-600 w-8 text-right mr-3 flex-shrink-0">{i + 1}</span>}
            <span className="text-gray-300">{line}</span>
          </div>
        ))}
      </code>
    </pre>
  );
};
