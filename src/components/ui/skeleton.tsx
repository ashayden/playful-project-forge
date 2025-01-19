import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function CardSkeleton() {
  return (
    <div
      data-testid="card-skeleton"
      className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-4"
    >
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-20" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton data-testid="profile-avatar" className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

function TableRowSkeleton() {
  return (
    <div data-testid="table-row" className="flex items-center space-x-4 p-4">
      <Skeleton className="h-12 w-12" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-3 w-[150px]" />
      </div>
    </div>
  )
}

export { Skeleton, CardSkeleton, ProfileSkeleton, TableRowSkeleton }
