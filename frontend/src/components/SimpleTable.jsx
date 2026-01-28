export default function SimpleTable({ columns = [], rows = [] }) {
  return (
    <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #eee", borderRadius: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  fontSize: 13,
                  color: "#334155",
                  borderBottom: "1px solid #eee",
                  whiteSpace: "nowrap",
                }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 14, color: "#64748b" }}>
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={r.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: "12px 14px", fontSize: 14, color: "#0f172a" }}>
                    {r?.[c.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
