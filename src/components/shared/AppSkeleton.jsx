import { Skeleton } from "../ui/skeleton";

export default function AppSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Sidebar Skeleton (hidden on mobile, visible on md+) */}
      <aside className="hidden md:flex flex-col h-screen w-56 bg-background border-r fixed top-0 left-0 z-40">
        <div className="flex items-center justify-center h-16 border-b">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="p-2 border-t mt-auto flex flex-col gap-2">
           <Skeleton className="h-10 w-full" />
           <Skeleton className="h-10 w-full" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col w-full transition-all duration-300 ease-in-out md:pl-56">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6 md:px-6">
           <div className="md:hidden">
              <Skeleton className="h-8 w-8" />
           </div>
           <Skeleton className="h-6 w-32 md:w-48" />
           <div className="ml-auto flex items-center space-x-4">
              <Skeleton className="h-9 w-24 hidden md:flex" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full hidden sm:flex" />
              <Skeleton className="h-9 w-9 rounded-full" />
           </div>
        </header>

        {/* Content Skeleton */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-7xl space-y-4">
             {/* Stat Cards Skeleton */}
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                   <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
             </div>

             {/* Charts/Tables Skeleton */}
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="col-span-4 h-[400px] rounded-xl" />
                <Skeleton className="col-span-3 h-[400px] rounded-xl" />
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}