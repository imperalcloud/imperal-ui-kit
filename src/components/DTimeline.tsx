'use client';

import * as LucideIcons from 'lucide-react';
import type { UIComponent } from '../types';

const COLOR_CLASSES: Record<string, string> = { blue: 'bg-blue-500', green: 'bg-green-500', red: 'bg-red-500', amber: 'bg-amber-500', purple: 'bg-purple-500', gray: 'bg-gray-500' };

export const DTimeline: UIComponent = ({ node }) => {
  const { items: rawItems = [] } = node.props as { items?: any[] };
  const items = Array.isArray(rawItems) ? rawItems : [];
  return (
    <div className="space-y-0">
      {items.map((item: any, i: number) => {
        const IconComp = item.icon ? (LucideIcons as any)[item.icon] : null;
        const isLast = i === items.length - 1;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full mt-1.5 ${COLOR_CLASSES[item.color] || 'bg-blue-500'}`}>
                {IconComp && <IconComp className="w-3 h-3 text-white" />}
              </div>
              {!isLast && <div className="w-px flex-1 bg-gray-700 my-1" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium text-white">{item.title}</p>
              {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
              {item.time && <p className="text-xs text-gray-500 mt-0.5">{item.time}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
