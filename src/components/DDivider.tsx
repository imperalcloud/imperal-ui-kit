'use client';
import type { UIComponent } from '../types';

export const DDivider: UIComponent = ({ node }) => {
  const { label } = node.props as any;
  if (!label) return <hr className="border-hair my-2" />;
  return (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-800" />
      </div>
      <div className="relative flex justify-start pl-1">
        <span className="px-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider bg-gray-950">{label}</span>
      </div>
    </div>
  );
};
