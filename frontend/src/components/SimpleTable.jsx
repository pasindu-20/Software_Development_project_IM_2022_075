export default function SimpleTable({
  columns = [],
  rows = [],
  wrapperClassName = "",
  tableClassName = "",
  tableMinWidth = 700,
}) {
  return (
    <div
      className={wrapperClassName}
      style={{
        overflowX: "auto",
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 12,
        width: "100%",
        maxWidth: "100%",
      }}
    >
      <table
        className={tableClassName}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: tableMinWidth,
        }}
      >
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {columns.map((c) => (
              <th
                key={c.key}
                className={c.headerClassName || ""}
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
                  <td
                    key={c.key}
                    className={c.cellClassName || ""}
                    style={{
                      padding: "12px 14px",
                      fontSize: 14,
                      color: "#0f172a",
                      verticalAlign: "top",
                    }}
                  >
                    {typeof c.render === "function" ? c.render(r) : r?.[c.key] ?? "-"}
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