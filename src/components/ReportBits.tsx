import type { FieldRow } from "@/lib/byteScan";

export function VerdictCard({
  title,
  found,
  detail,
}: {
  title: string;
  found: boolean;
  detail: string;
}) {
  return (
    <div
      className={
        found
          ? "rounded-3xl border border-amber-300/80 bg-gradient-to-b from-amber-50 to-amber-50/60 p-4 shadow-[0_10px_30px_-18px_rgba(217,119,6,0.55)]"
          : "rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-emerald-50/60 p-4 shadow-[0_10px_30px_-18px_rgba(5,150,105,0.5)]"
      }
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
            found ? "bg-amber-500" : "bg-emerald-500"
          }`}
        >
          {found ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-4.5 w-4.5">
              <path d="M12 5v9" strokeLinecap="round" />
              <circle cx="12" cy="17.6" r="0.6" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-4.5 w-4.5">
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</p>
      </div>
      <p className={`mt-2.5 text-lg font-bold tracking-tight ${found ? "text-amber-800" : "text-emerald-800"}`}>
        {found ? "FOUND" : "NOT FOUND"}
      </p>
      <p className="mt-1 text-sm text-slate-700">{detail}</p>
    </div>
  );
}

export function MetadataTable({ rows, emptyText }: { rows: FieldRow[]; emptyText: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-600">{emptyText}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
          <tr>
            <th className="px-4 py-2.5 font-semibold text-slate-700">Field</th>
            <th className="px-4 py-2.5 font-semibold text-slate-700">Value found</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={`${row.field}-${i}`}
              className="border-t border-slate-100 align-top transition-colors hover:bg-emerald-50/40"
            >
              <td className="px-4 py-2 font-mono text-xs break-all text-slate-800">{row.field}</td>
              <td className="px-4 py-2 break-all text-slate-700">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FileDropZone({
  accept,
  label,
  hint,
  onFile,
  dragging,
  setDragging,
}: {
  accept: string;
  label: string;
  hint: string;
  onFile: (file: File) => void;
  dragging: boolean;
  setDragging: (value: boolean) => void;
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={`rounded-3xl border-2 border-dashed p-6 text-center transition-all duration-300 sm:p-10 ${
        dragging
          ? "scale-[1.01] border-emerald-500 bg-emerald-50 shadow-xl shadow-emerald-500/15"
          : "border-slate-300 bg-gradient-to-b from-slate-50 to-white hover:border-emerald-400 hover:bg-emerald-50/40 hover:shadow-lg hover:shadow-emerald-500/10"
      }`}
    >
      <span aria-hidden="true" className="brand-tile mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-slate-950">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-6 w-6">
          <path d="M12 16V5" strokeLinecap="round" />
          <path d="M7 9.5L12 4.5l5 5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-2.5" strokeLinecap="round" />
        </svg>
      </span>
      <p className="mt-3.5 font-semibold tracking-tight text-slate-900">{label}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{hint}</p>
      <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/25 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2">
        Choose a file
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </label>
      <p className="mt-3 text-xs text-slate-500">
        Your file stays on this device. The check runs locally in your browser.
      </p>
    </div>
  );
}

export function ReportSummaryStrip({
  checksRun,
  findingsFound,
  cleanChecks,
}: {
  checksRun: number;
  findingsFound: number;
  cleanChecks: number;
}) {
  const total = Math.max(1, findingsFound + cleanChecks);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const foundLength = (findingsFound / total) * circumference;
  const cards = [
    {
      label: "Checks run",
      value: checksRun,
      tone: "text-[#0b2447]",
      tile: "bg-slate-900 text-white",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5">
          <path d="M4 6.5l1.8 1.8L9 5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 6.5h8M12 12h8M12 17.5h8" strokeLinecap="round" />
          <path d="M4 12.5l1.8 1.8L9 11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 18.5l1.8 1.8L9 17" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Findings found",
      value: findingsFound,
      tone: "text-amber-600",
      tile: "bg-amber-500 text-white",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5">
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="M15 15L20.5 20.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Clean checks",
      value: cleanChecks,
      tone: "text-emerald-600",
      tile: "bg-emerald-500 text-white",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5">
          <path d="M12 3.5l6.5 2.5v5c0 4.6-2.8 7.7-6.5 9.5C8.3 18.7 5.5 15.6 5.5 11V6z" strokeLinejoin="round" />
          <path d="M9 11.5l2.2 2.2L15.5 9.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];
  return (
    <section aria-label="Report summary" className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-5">
        <div
          className="relative h-20 w-20 shrink-0"
          role="img"
          aria-label={`${findingsFound} findings found, ${cleanChecks} clean checks`}
        >
          <div
            aria-hidden="true"
            className="absolute inset-1 rounded-full bg-gradient-to-tr from-emerald-300/40 to-amber-300/40 blur-lg"
          />
          <svg viewBox="0 0 80 80" className="relative h-20 w-20 -rotate-90">
            <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="10" stroke="#10b981" />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              strokeWidth="10"
              stroke="#f59e0b"
              strokeDasharray={`${foundLength} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-slate-900">
              {findingsFound}/{total}
            </span>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-3 min-[420px]:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="flex items-center gap-3 rounded-2xl bg-gradient-to-b from-slate-50 to-white px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-slate-200/70"
            >
              <span
                aria-hidden="true"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm ${card.tile}`}
              >
                {card.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  {card.label}
                </span>
                <span className={`block text-2xl leading-7 font-bold tracking-tight ${card.tone}`}>
                  {card.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-emerald-100" aria-hidden="true">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-500"
          style={{ width: `${(findingsFound / total) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Amber shows the share of checks that found something. Green is the share that came back
        clean. A clean check is not proof of anything, it only means this scan found no marker.
      </p>
    </section>
  );
}
