import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Briefcase,
  Building,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  Clock,
  Droplets,
  GitBranch,
  Hourglass,
  IndianRupee,
  MapPin,
  MessageSquare,
  ShieldAlert,
  SprayCan,
  Store,
  TrainFront,
  Utensils,
  Circle,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Briefcase,
  Building,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  Clock,
  Droplets,
  GitBranch,
  Hourglass,
  IndianRupee,
  MapPin,
  MessageSquare,
  ShieldAlert,
  SprayCan,
  Store,
  TrainFront,
  Utensils,
};

export function lucideIcon(name: string): LucideIcon {
  return ICONS[name] ?? Circle;
}
