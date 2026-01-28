export default function StatCard({ title, value, sub }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 14,
        minHeight: 90,
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>
        {value ?? "-"}
      </div>
      {sub ? <div style={{ marginTop: 6, fontSize: 12, color: "#888" }}>{sub}</div> : null}
    </div>
  );
}
