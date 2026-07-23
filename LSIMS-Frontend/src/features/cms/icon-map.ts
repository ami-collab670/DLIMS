import type { LucideIcon } from "lucide-react";
import {
  Award,
  ClipboardCheck,
  FileCheck,
  FlaskConical,
  Globe,
  Handshake,
  Microscope,
  Scale,
  ShieldCheck,
  Target,
  Truck,
  Users,
  Zap,
} from "lucide-react";

export const CMS_ICON_MAP: Record<string, LucideIcon> = {
  microscope: Microscope,
  "flask-conical": FlaskConical,
  truck: Truck,
  globe: Globe,
  "shield-check": ShieldCheck,
  "clipboard-check": ClipboardCheck,
  zap: Zap,
  users: Users,
  scale: Scale,
  target: Target,
  award: Award,
  handshake: Handshake,
  "file-check": FileCheck,
};

export function resolveCmsIcon(iconKey: string): LucideIcon {
  return CMS_ICON_MAP[iconKey] ?? Microscope;
}
