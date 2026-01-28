export default function AssignedClasses() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Assigned Classes</h2>

      <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
        <p>
          This page shows the classes assigned to the instructor.
        </p>
        <p>
          Later this will be connected to backend to load:
        </p>
        <ul>
          <li>Class name</li>
          <li>Schedule</li>
          <li>Enrolled children count</li>
        </ul>
      </div>
    </div>
  );
}
