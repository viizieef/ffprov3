import React from 'react';
import { UserRole } from '../../types';
import { ShieldCheck, UserCheck, Activity, Users, Egg } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface RoleConfigItem {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const adminConfig: RoleConfigItem = {
  label: 'System Administrator',
  bg: 'bg-rose-50 text-rose-700',
  text: 'text-rose-700',
  border: 'border-rose-200',
  icon: ShieldCheck,
  description: 'Full system control, record editing/deletion, user approval, audit logs'
};

const farmManagerConfig: RoleConfigItem = {
  label: 'Farm Manager',
  bg: 'bg-blue-50 text-blue-700',
  text: 'text-blue-700',
  border: 'border-blue-200',
  icon: UserCheck,
  description: 'Full operations management, stock, health & reports (no delete/user approval)'
};

const leadmanConfig: RoleConfigItem = {
  label: 'Leadman',
  bg: 'bg-emerald-50 text-emerald-700',
  text: 'text-emerald-700',
  border: 'border-emerald-200',
  icon: Activity,
  description: 'Record flockman module & egg production, view farm & flock profile'
};

const flockmanConfig: RoleConfigItem = {
  label: 'Flockman',
  bg: 'bg-amber-50 text-amber-700',
  text: 'text-amber-700',
  border: 'border-amber-200',
  icon: Users,
  description: 'Record designated egg production, view flockman module & profile'
};

const eggCollectorConfig: RoleConfigItem = {
  label: 'Egg Collector',
  bg: 'bg-purple-50 text-purple-700',
  text: 'text-purple-700',
  border: 'border-purple-200',
  icon: Egg,
  description: 'Record egg production for designated flocks only'
};

export const ROLE_CONFIGS: Record<string, RoleConfigItem> = {
  admin: adminConfig,
  'System Administrator': adminConfig,
  farm_manager: farmManagerConfig,
  'Farm Manager': farmManagerConfig,
  leadman: leadmanConfig,
  Leadman: leadmanConfig,
  flockman: flockmanConfig,
  Flockman: flockmanConfig,
  egg_collector: eggCollectorConfig,
  'Egg Collector': eggCollectorConfig
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showIcon = true, size = 'sm' }) => {
  const config = ROLE_CONFIGS[role] || eggCollectorConfig;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-medium'
  };

  return (
    <span
      id={`role-badge-${String(role).toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.border} ${sizeClasses[size]}`}
      title={config.description}
    >
      {showIcon && <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
