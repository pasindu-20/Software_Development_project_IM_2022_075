// frontend/src/layouts/PublicLayout.jsx
import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import Footer from "../components/Footer";

export default function PublicLayout() {
  return (
    <>
      <PublicNavbar />
      <main style={{ paddingTop: 18 }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
