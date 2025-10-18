import { cn } from "../../lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  );
}

export default function AppSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Skeleton Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm sm:px-6">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="hidden h-6 w-48 md:block" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <div className="hidden items-center gap-2 md:flex">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </header>
      
      {/* Skeleton Main Content */}
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <Skeleton className="h-10 w-64" />
        </div>

        {/* Skeleton for Stat Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[105px] w-full" />
          <Skeleton className="h-[105px] w-full" />
          <Skeleton className="h-[105px] w-full" />
          <Skeleton className="h-[105px] w-full" />
        </div>

        {/* Skeleton for Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-12">
          <Skeleton className="h-[400px] lg:col-span-7" />
          <Skeleton className="h-[400px] lg:col-span-5" />
        </div>
      </main>
    </div>
  );
}