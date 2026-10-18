export default function AppLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Загрузка">
      <div className="skeleton h-8 w-52" />
      <div className="skeleton h-4 w-80" />
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="skeleton h-64 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-40 w-full" />
      </div>
    </div>
  );
}
