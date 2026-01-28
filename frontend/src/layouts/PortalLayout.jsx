import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function PortalLayout({ menuTitle, items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
      <Sidebar title={menuTitle} items={items} />
      <main style={{ padding: 20, background: "#fafafa" }}>
        <Outlet />
      </main>
    </div>
  );
}
