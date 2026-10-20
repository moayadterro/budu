import { Card, CardContent } from '@/shared/ui/card'
import { Icon, type IconName } from '@/shared/ui/icon'

/** Dashboard number tile: icon + label, big value, small note. */
export function StatTile({ icon, label, value, note }: { icon: IconName; label: string; value: number | string; note: string }) {
  return (
    <Card size="sm">
      <CardContent className="gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon name={icon} className="size-4" />
          </span>
          {label}
        </div>
        <div className="text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </CardContent>
    </Card>
  )
}
