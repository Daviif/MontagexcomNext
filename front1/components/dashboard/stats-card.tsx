import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
}: StatsCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-card border-l-4 border-l-primary border-border',
    warning: 'bg-card border-l-4 border-l-chart-3 border-border',
    destructive: 'bg-card border-l-4 border-l-destructive border-border',
  }

  const iconStyles = {
    default: 'bg-secondary text-muted-foreground',
    success: 'bg-primary/10 text-primary',
    warning: 'bg-chart-3/10 text-chart-3',
    destructive: 'bg-destructive/10 text-destructive',
  }

  return (
    <div className={cn('rounded-lg border p-4 transition-all hover:shadow-md', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-card-foreground">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p className={cn(
              'mt-2 text-xs font-medium',
              trend.isPositive ? 'text-primary' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% em relacao ao mes anterior
            </p>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5', iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
