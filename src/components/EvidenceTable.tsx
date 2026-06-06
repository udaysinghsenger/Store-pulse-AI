type EvidenceValue = string | number | boolean | null | undefined;

type EvidenceRow = [string, EvidenceValue];

export default function EvidenceTable({
  evidence,
}: {
  evidence: Record<string, any> | null | undefined;
}) {
  const allRows: EvidenceRow[] = [
    ["Source", evidence?.source],
    ["Product", evidence?.product_name],
    ["Color", evidence?.color],
    ["Size", evidence?.size],
    ["Section", evidence?.section],
    ["Stock count", evidence?.stock_count],
    ["Shelf count", evidence?.shelf_count],
    ["Area", evidence?.issue?.area || evidence?.area],
    ["Status", evidence?.issue?.status || evidence?.status],
    ["Average wait minutes", evidence?.latest_queue_log?.avg_wait_minutes],
    ["Billing counters open", evidence?.latest_queue_log?.billing_counters_open],
  ];

  const rows = allRows.filter((row): row is EvidenceRow => {
    return row[1] !== undefined && row[1] !== null && row[1] !== "";
  });

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b last:border-b-0">
              <td className="w-1/3 bg-gray-50 p-3 font-medium text-gray-700">
                {label}
              </td>
              <td className="p-3 text-gray-900">{String(value)}</td>
            </tr>
          ))}

          {rows.length === 0 ? (
            <tr>
              <td className="p-3 text-gray-500">
                No structured evidence available.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}