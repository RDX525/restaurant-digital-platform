export default function RestaurantPageLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-4 h-12 w-72 max-w-full" />
      <div className="skeleton mt-4 h-20 w-full max-w-2xl" />
      <div className="mt-10 space-y-4">
        <div className="skeleton h-36" />
        <div className="skeleton h-36" />
        <div className="skeleton h-36" />
      </div>
    </div>
  );
}
