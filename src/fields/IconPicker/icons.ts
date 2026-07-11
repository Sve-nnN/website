import type { LucideIcon } from 'lucide-react'
import {
  Zap,
  Monitor,
  Code,
  TrendingUp,
  Shield,
  Rocket,
  Palette,
  Lightbulb,
  Target,
  Layers,
  Cpu,
  Database,
  Globe,
  Search,
  Settings,
  Smartphone,
  Server,
  Lock,
  Gauge,
  Sparkles,
  Wrench,
  LineChart,
  CheckCircle2,
  BarChart3,
} from 'lucide-react'

// Shared icon set for Payload admin icon-select fields (Phase 13 — 13-CONTEXT.md
// "Icon picker de admin"). `value` is the camelCase string persisted in the DB and
// looked up by frontend `iconMap` objects (same convention as AuthorCard.tsx's
// socialIconMap). Do not rename existing `value`s without a migration — frontend
// consumers key off these strings.
export const ICON_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'zap', label: 'Zap', Icon: Zap },
  { value: 'monitor', label: 'Monitor', Icon: Monitor },
  { value: 'code', label: 'Code', Icon: Code },
  { value: 'trendingUp', label: 'Trending Up', Icon: TrendingUp },
  { value: 'shield', label: 'Shield', Icon: Shield },
  { value: 'rocket', label: 'Rocket', Icon: Rocket },
  { value: 'palette', label: 'Palette', Icon: Palette },
  { value: 'lightbulb', label: 'Lightbulb', Icon: Lightbulb },
  { value: 'target', label: 'Target', Icon: Target },
  { value: 'layers', label: 'Layers', Icon: Layers },
  { value: 'cpu', label: 'Cpu', Icon: Cpu },
  { value: 'database', label: 'Database', Icon: Database },
  { value: 'globe', label: 'Globe', Icon: Globe },
  { value: 'search', label: 'Search', Icon: Search },
  { value: 'settings', label: 'Settings', Icon: Settings },
  { value: 'smartphone', label: 'Smartphone', Icon: Smartphone },
  { value: 'server', label: 'Server', Icon: Server },
  { value: 'lock', label: 'Lock', Icon: Lock },
  { value: 'gauge', label: 'Gauge', Icon: Gauge },
  { value: 'sparkles', label: 'Sparkles', Icon: Sparkles },
  { value: 'wrench', label: 'Wrench', Icon: Wrench },
  { value: 'lineChart', label: 'Line Chart', Icon: LineChart },
  { value: 'checkCircle', label: 'Check Circle', Icon: CheckCircle2 },
  { value: 'barChart', label: 'Bar Chart', Icon: BarChart3 },
]

// Plain {value,label} pairs for use as a Payload `select` field's `options` array —
// no React refs (options are serialized into the field config).
export const iconSelectOptions = ICON_OPTIONS.map(({ value, label }) => ({ value, label }))
