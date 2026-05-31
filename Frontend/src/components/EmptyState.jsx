export default function EmptyState({ title, description, action }) {
  return (
    <div className="travel-surface flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-3xl shadow-inner dark:bg-sky-500/15" aria-hidden="true">
        🧭
      </div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
