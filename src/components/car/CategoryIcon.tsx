import { Factory, ClipboardList, Handshake, Car, Warehouse, Wrench, AlertTriangle, Sparkles } from "lucide-react";
import type { CategoryIconName } from "@/data/carEventCategories";
import { cn } from "@/lib/utils";

const iconComponents: Record<CategoryIconName, React.ComponentType<{ className?: string }>> = {
  Factory,
  ClipboardList,
  Handshake,
  Car,
  Warehouse,
  Wrench,
  AlertTriangle,
  Sparkles,
};

interface CategoryIconProps {
  iconName: CategoryIconName;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export function CategoryIcon({ iconName, size = 'md', className }: CategoryIconProps) {
  const IconComponent = iconComponents[iconName] || Sparkles;
  return <IconComponent className={cn(sizeClasses[size], className)} />;
}
