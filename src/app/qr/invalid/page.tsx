export default function InvalidQrPage() {
  return (
    <main className="platform-page flex min-h-[70vh] items-center justify-center px-6">
      <div className="empty-state max-w-md">
        <h1 className="font-display text-2xl text-pine-900">This QR code is not valid</h1>
        <p className="mt-3 leading-relaxed text-pine-600">
          Ask your server for a new table code, or open the restaurant menu from the link they
          give you.
        </p>
      </div>
    </main>
  );
}
