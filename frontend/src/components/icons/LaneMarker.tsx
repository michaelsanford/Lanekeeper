import React from 'react';
import {
  CheckCircle2,
  Check,
  Play,
  Zap,
  Flame,
  Rocket,
  Activity,
  Pause,
  Clock,
  Timer,
  Hourglass,
  Eye,
  Search,
  ShieldCheck,
  GitPullRequest,
  Bug,
  AlertCircle,
  Glasses,
  FileSearch,
  CheckCheck,
  Inbox,
  Layers,
  Archive,
  Snowflake,
  Package,
  Sparkles,
  Folder,
  Database,
  ListTodo,
  Code,
  Terminal,
  GitBranch,
  Wrench,
  Hammer,
  Cpu,
  Sliders,
  Flag,
  Target,
  Compass,
  Anchor,
  Bookmark,
  Coffee,
  Shield,
  Star,
  Heart,
  Tag
} from 'lucide-react';
import { SwimlaneBuoyIcon } from './LaneIcons.js';

export interface MarkerDefinition {
  id: string;
  label: string;
  category: 'flow' | 'review' | 'planning' | 'engineering' | 'goals';
  component: React.ComponentType<{ size?: number; className?: string }>;
}

export const LANE_MARKER_DEFINITIONS: Record<string, MarkerDefinition> = {
  // Flow & Status
  'buoy': { id: 'buoy', label: 'Swimlane Buoy', category: 'flow', component: SwimlaneBuoyIcon },
  'check-circle': { id: 'check-circle', label: 'Check Circle (Done)', category: 'flow', component: CheckCircle2 },
  'check': { id: 'check', label: 'Checkmark', category: 'flow', component: Check },
  'check-check': { id: 'check-check', label: 'Double Check', category: 'flow', component: CheckCheck },
  'play': { id: 'play', label: 'Play (Started)', category: 'flow', component: Play },
  'zap': { id: 'zap', label: 'Lightning (Active)', category: 'flow', component: Zap },
  'flame': { id: 'flame', label: 'Flame (Urgent / Hot)', category: 'flow', component: Flame },
  'rocket': { id: 'rocket', label: 'Rocket (Ship / Deploy)', category: 'flow', component: Rocket },
  'activity': { id: 'activity', label: 'Activity Pulse', category: 'flow', component: Activity },
  'pause': { id: 'pause', label: 'Pause (On Hold)', category: 'flow', component: Pause },
  'clock': { id: 'clock', label: 'Clock (Pending)', category: 'flow', component: Clock },
  'timer': { id: 'timer', label: 'Timer (In Flight)', category: 'flow', component: Timer },
  'hourglass': { id: 'hourglass', label: 'Hourglass (Waiting)', category: 'flow', component: Hourglass },

  // Review & Quality
  'eye': { id: 'eye', label: 'Eye (Review)', category: 'review', component: Eye },
  'search': { id: 'search', label: 'Search (Audit / QA)', category: 'review', component: Search },
  'shield-check': { id: 'shield-check', label: 'Shield Check (Approved)', category: 'review', component: ShieldCheck },
  'git-pull-request': { id: 'git-pull-request', label: 'Pull Request', category: 'review', component: GitPullRequest },
  'glasses': { id: 'glasses', label: 'Glasses (Spec Inspect)', category: 'review', component: Glasses },
  'file-search': { id: 'file-search', label: 'File Audit', category: 'review', component: FileSearch },
  'bug': { id: 'bug', label: 'Bug (Defects)', category: 'review', component: Bug },
  'alert-circle': { id: 'alert-circle', label: 'Alert (Blocked)', category: 'review', component: AlertCircle },

  // Planning & Backlog
  'inbox': { id: 'inbox', label: 'Inbox (Triage)', category: 'planning', component: Inbox },
  'layers': { id: 'layers', label: 'Layers (Backlog)', category: 'planning', component: Layers },
  'list-todo': { id: 'list-todo', label: 'To Do List', category: 'planning', component: ListTodo },
  'archive': { id: 'archive', label: 'Archive (Cold Storage)', category: 'planning', component: Archive },
  'snowflake': { id: 'snowflake', label: 'Snowflake (Icebox)', category: 'planning', component: Snowflake },
  'package': { id: 'package', label: 'Package (Deliverable)', category: 'planning', component: Package },
  'folder': { id: 'folder', label: 'Folder (Epic)', category: 'planning', component: Folder },
  'database': { id: 'database', label: 'Database (State)', category: 'planning', component: Database },
  'sparkles': { id: 'sparkles', label: 'Sparkles (Ideas / Discovery)', category: 'planning', component: Sparkles },

  // Dev & Engineering
  'code': { id: 'code', label: 'Code Brackets', category: 'engineering', component: Code },
  'terminal': { id: 'terminal', label: 'Terminal (CLI / Ops)', category: 'engineering', component: Terminal },
  'git-branch': { id: 'git-branch', label: 'Git Branch', category: 'engineering', component: GitBranch },
  'wrench': { id: 'wrench', label: 'Wrench (Maintenance)', category: 'engineering', component: Wrench },
  'hammer': { id: 'hammer', label: 'Hammer (Build)', category: 'engineering', component: Hammer },
  'cpu': { id: 'cpu', label: 'CPU (Infra / Core)', category: 'engineering', component: Cpu },
  'sliders': { id: 'sliders', label: 'Sliders (Settings)', category: 'engineering', component: Sliders },

  // Goals & Navigation
  'flag': { id: 'flag', label: 'Flag (Milestone)', category: 'goals', component: Flag },
  'target': { id: 'target', label: 'Target (Sprint Goal)', category: 'goals', component: Target },
  'compass': { id: 'compass', label: 'Compass (Roadmap)', category: 'goals', component: Compass },
  'anchor': { id: 'anchor', label: 'Anchor (Fixed)', category: 'goals', component: Anchor },
  'bookmark': { id: 'bookmark', label: 'Bookmark (Saved)', category: 'goals', component: Bookmark },
  'coffee': { id: 'coffee', label: 'Coffee (Chore / Break)', category: 'goals', component: Coffee },
  'shield': { id: 'shield', label: 'Shield (Security)', category: 'goals', component: Shield },
  'star': { id: 'star', label: 'Star (Featured)', category: 'goals', component: Star },
  'heart': { id: 'heart', label: 'Heart (Health / UX)', category: 'goals', component: Heart },
  'tag': { id: 'tag', label: 'Tag (Categorized)', category: 'goals', component: Tag }
};

export const LANE_MARKER_CATEGORIES = [
  { id: 'all', label: 'All Markers' },
  { id: 'flow', label: 'Flow & Status' },
  { id: 'review', label: 'Review & QA' },
  { id: 'planning', label: 'Planning & Backlog' },
  { id: 'engineering', label: 'Dev & Engineering' },
  { id: 'goals', label: 'Goals & Milestones' }
] as const;

export interface LaneMarkerProps {
  icon?: string;
  color?: string;
  size?: number;
  className?: string;
  title?: string;
}

export const LaneMarker: React.FC<LaneMarkerProps> = ({
  icon,
  color,
  size = 16,
  className = '',
  title
}) => {
  const markerKey = icon || 'buoy';
  const def = LANE_MARKER_DEFINITIONS[markerKey];

  if (def) {
    const Component = def.component;
    return (
      <span
        style={{ color }}
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        title={title || def.label}
      >
        <Component size={size} />
      </span>
    );
  }

  // Custom Unicode glyph / symbol fallback
  return (
    <span
      style={{ color, fontSize: `${size}px`, lineHeight: 1 }}
      className={`inline-flex items-center justify-center shrink-0 font-bold select-none ${className}`}
      title={title || `Marker: ${markerKey}`}
    >
      {markerKey}
    </span>
  );
};
