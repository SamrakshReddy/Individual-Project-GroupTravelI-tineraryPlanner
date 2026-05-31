export default function StatCard({ title, value, icon: Icon, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  };

  return (
    <div className="travel-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone]}`}>
          {typeof Icon === 'string' ? (
            <span className="block h-6 w-6 text-center text-xl leading-6" aria-hidden="true">{Icon}</span>
          ) : (
            <Icon className="h-6 w-6" />
          )}
        </div>
      </div>
    </div>
  );
}
