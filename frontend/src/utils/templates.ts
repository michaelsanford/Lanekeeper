import type { LaneType } from '../types/index.js';

export interface TemplateLane {
  id: string;
  name: string;
  color: string;
  type: LaneType;
  wipLimit?: number;
  icon?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'engineering' | 'agile' | 'operations' | 'product' | 'general';
  icon: string;
  lanes: TemplateLane[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'software-dev',
    name: 'Software Engineering',
    description: 'Full engineering lifecycle with backlog triage, active development, code review, and QA verification.',
    category: 'engineering',
    icon: 'code',
    lanes: [
      { id: 'triage', name: 'Triage / Inbox', color: '#64748b', type: 'backlog', icon: 'inbox' },
      { id: 'backlog', name: 'Backlog', color: '#8b5cf6', type: 'unstarted', icon: 'layers' },
      { id: 'todo', name: 'Ready to Dev', color: '#3b82f6', type: 'unstarted', icon: 'play' },
      { id: 'inprogress', name: 'In Development', color: '#f59e0b', type: 'started', wipLimit: 3, icon: 'code' },
      { id: 'review', name: 'Code Review', color: '#06b6d4', type: 'started', wipLimit: 2, icon: 'git-pull-request' },
      { id: 'qa', name: 'QA & Testing', color: '#a855f7', type: 'started', wipLimit: 2, icon: 'shield-check' },
      { id: 'done', name: 'Shipped / Done', color: '#10b981', type: 'completed', icon: 'rocket' }
    ]
  },
  {
    id: 'simple-kanban',
    name: 'Simple Kanban',
    description: 'Minimalist lean flow for straightforward task tracking and personal productivity.',
    category: 'agile',
    icon: 'list-todo',
    lanes: [
      { id: 'todo', name: 'To Do', color: '#3b82f6', type: 'unstarted', icon: 'list-todo' },
      { id: 'inprogress', name: 'In Progress', color: '#f59e0b', type: 'started', wipLimit: 4, icon: 'zap' },
      { id: 'done', name: 'Done', color: '#10b981', type: 'completed', icon: 'check-circle' }
    ]
  },
  {
    id: 'bug-tracker',
    name: 'Bug & Incident Tracking',
    description: 'Defect management lifecycle from intake and investigation to patch verification and closure.',
    category: 'engineering',
    icon: 'bug',
    lanes: [
      { id: 'reported', name: 'Reported / Triage', color: '#ef4444', type: 'backlog', icon: 'inbox' },
      { id: 'investigating', name: 'Investigating', color: '#f97316', type: 'unstarted', icon: 'search' },
      { id: 'fixing', name: 'Fix in Progress', color: '#f59e0b', type: 'started', wipLimit: 3, icon: 'wrench' },
      { id: 'verifying', name: 'Verifying Fix', color: '#06b6d4', type: 'started', icon: 'shield-check' },
      { id: 'resolved', name: 'Resolved', color: '#10b981', type: 'completed', icon: 'check-circle' },
      { id: 'wontfix', name: "Won't Fix / Closed", color: '#64748b', type: 'cancelled', icon: 'archive' }
    ]
  },
  {
    id: 'scrum-sprint',
    name: 'Scrum Sprint',
    description: 'Sprint-focused delivery cadence with committed backlog, active WIP, blockers, and acceptance demo.',
    category: 'agile',
    icon: 'target',
    lanes: [
      { id: 'sprint-backlog', name: 'Sprint Backlog', color: '#6366f1', type: 'unstarted', icon: 'layers' },
      { id: 'in-sprint', name: 'Active Sprint', color: '#3b82f6', type: 'started', wipLimit: 5, icon: 'flame' },
      { id: 'blocked', name: 'Blocked / On Hold', color: '#ef4444', type: 'started', icon: 'alert-circle' },
      { id: 'acceptance', name: 'Review & Acceptance', color: '#8b5cf6', type: 'started', icon: 'eye' },
      { id: 'done', name: 'Sprint Done', color: '#10b981', type: 'completed', icon: 'check-circle' }
    ]
  },
  {
    id: 'product-discovery',
    name: 'Product Discovery & Delivery',
    description: 'Dual-track agile workflow spanning opportunity validation, UX specification, build, and GA rollout.',
    category: 'product',
    icon: 'compass',
    lanes: [
      { id: 'opportunity', name: 'Ideas & Discovery', color: '#eab308', type: 'backlog', icon: 'sparkles' },
      { id: 'research', name: 'Research & Specs', color: '#8b5cf6', type: 'unstarted', icon: 'compass' },
      { id: 'ready-build', name: 'Ready for Build', color: '#3b82f6', type: 'unstarted', icon: 'play' },
      { id: 'building', name: 'Building', color: '#f59e0b', type: 'started', wipLimit: 3, icon: 'hammer' },
      { id: 'validating', name: 'Beta & Validating', color: '#06b6d4', type: 'started', icon: 'activity' },
      { id: 'launched', name: 'Launched (GA)', color: '#10b981', type: 'completed', icon: 'rocket' }
    ]
  },
  {
    id: 'content-pipeline',
    name: 'Content & Editorial Pipeline',
    description: 'Editorial calendar workflow for articles, release notes, documentation, and media production.',
    category: 'general',
    icon: 'layers',
    lanes: [
      { id: 'pitch', name: 'Pitch & Concepts', color: '#64748b', type: 'backlog', icon: 'sparkles' },
      { id: 'outlining', name: 'Outline & Research', color: '#3b82f6', type: 'unstarted', icon: 'layers' },
      { id: 'drafting', name: 'Drafting', color: '#f59e0b', type: 'started', wipLimit: 2, icon: 'code' },
      { id: 'editing', name: 'Editorial Review', color: '#8b5cf6', type: 'started', icon: 'glasses' },
      { id: 'scheduled', name: 'Scheduled', color: '#06b6d4', type: 'unstarted', icon: 'clock' },
      { id: 'published', name: 'Published', color: '#10b981', type: 'completed', icon: 'check-circle' }
    ]
  },
  {
    id: 'it-helpdesk',
    name: 'IT Support & Service Desk',
    description: 'Ticket management workflow for support inquiries, hardware requests, and vendor escalations.',
    category: 'operations',
    icon: 'wrench',
    lanes: [
      { id: 'triage', name: 'New Ingestion', color: '#6366f1', type: 'backlog', icon: 'inbox' },
      { id: 'queued', name: 'Queued / Assigned', color: '#3b82f6', type: 'unstarted', icon: 'clock' },
      { id: 'troubleshooting', name: 'In Troubleshooting', color: '#f59e0b', type: 'started', wipLimit: 4, icon: 'wrench' },
      { id: 'waiting', name: 'Waiting on User / Vendor', color: '#eab308', type: 'started', icon: 'pause' },
      { id: 'resolved', name: 'Resolved', color: '#10b981', type: 'completed', icon: 'check-circle' }
    ]
  }
];

export const DEFAULT_TEMPLATE_ID = 'software-dev';

export function getWorkflowTemplate(templateId?: string): WorkflowTemplate {
  if (!templateId) {
    return WORKFLOW_TEMPLATES[0];
  }
  const found = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
  return found || WORKFLOW_TEMPLATES[0];
}
