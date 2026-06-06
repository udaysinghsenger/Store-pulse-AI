type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export default function StatCard({ title, value, subtitle }: Props) {
  return (
    <div className="flex h-full min-h-[120px] flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="mt-2 text-3xl font-bold text-gray-950">{value}</h3>
      </div>

      {subtitle ? <p className="mt-2 text-sm text-gray-500">{subtitle}</p> : null}
    </div>
  );
}