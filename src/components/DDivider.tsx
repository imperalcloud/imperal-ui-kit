'use client';
import type { UIComponent } from '../types';

export const DDivider: UIComponent = ({ node }) => {
  const { label } = node.props as any;
  if (!label) return <hr className="border-hair my-2" />;
  return (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-hair" />
      </div>
      <div className="relative flex justify-start pl-1">
        <span className="px-2 text-[.625rem] font-medium text-muted uppercase tracking-wider bg-app">{label}</span>
      </div>
    </div>
  );
};
