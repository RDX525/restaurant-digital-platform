export default function RestaurantPageLoading() {
  return (
    <div className="rs-page rs-page-body">
      <div className="skeleton h-3 w-20" />
      <div className="skeleton mt-6 h-14 w-80 max-w-full" />
      <div className="skeleton mt-5 h-24 w-full max-w-2xl" />
      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        <div className="skeleton h-72 rounded-[2rem]" />
        <div className="skeleton h-72 rounded-[2rem]" />
      </div>
    </div>
  );
}
