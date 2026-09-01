export default function DashboardLoading() {
  return (
    <div className="flex-1 p-6 sm:p-10">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-4 h-10 w-64 max-w-full" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="skeleton h-40 rounded-3xl" />
        <div className="skeleton h-40 rounded-3xl" />
        <div className="skeleton h-40 rounded-3xl" />
      </div>
    </div>
  );
}
