export default function PageHeader({ title, description, action }) {
  return (
    <div className="travel-hero mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
