// frontend/src/layouts/PublicLayout.jsx
import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";

export default function PublicLayout() {
  return (
    <>
      <PublicNavbar />
      <main style={{ paddingTop: 18 }}>
        <Outlet />
      </main>
    </>
  );
}
