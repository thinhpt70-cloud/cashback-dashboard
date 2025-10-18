import { Skeleton } from "../ui/skeleton";

export default function AppSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-8 w-24" />
      </header>

      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </div>

      <footer className="p-4 border-t">
        <div className="flex justify-center">
          <Skeleton className="h-10 w-full max-w-md rounded-full" />
        </div>
      </footer>
    </div>
  );
}