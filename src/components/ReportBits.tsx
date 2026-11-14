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
          ? "rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm"
          : "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"
      }
    >
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</p>
      <p className={`mt-1 text-lg font-bold ${found ? "text-amber-800" : "text-emerald-800"}`}>
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-2 font-semibold text-slate-700">Field</th>
            <th className="px-4 py-2 font-semibold text-slate-700">Value found</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.field}-${i}`} className="border-t border-slate-100 align-top">
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
      className={`rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-10 ${
        dragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50"
      }`}
    >
      <p className="font-medium text-slate-900">{label}</p>
      <p className="mt-1 text-sm text-slate-600">{hint}</p>
      <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
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
