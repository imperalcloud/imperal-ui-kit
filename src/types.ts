// Declarative UI type system — JSON → React renderer contract

export interface UINode {
  type: string;
  props: Record<string, unknown>;
}

export interface UIAction {
  action: 'call' | 'navigate' | 'send' | 'open';
  function?: string;
  params?: Record<string, unknown>;
  path?: string;
  message?: string;
  url?: string;
}

export type UIComponent = React.FC<{
  node: UINode;
  onAction?: (action: UIAction) => void;
}>;

// Common prop shapes shared across components

export interface ChildrenProps {
  children?: UINode[];
}

export interface ListItemData {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  avatar?: UINode;
  badge?: UINode;
  selected?: boolean;
  on_click?: UIAction;
}

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  editable?: boolean;
  edit_type?: 'toggle' | 'text' | 'number';
}

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}
