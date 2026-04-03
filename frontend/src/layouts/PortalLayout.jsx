import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function PortalLayout({ menuTitle, items }) {
  const location = useLocation();
  const isInstructorPortal = location.pathname.startsWith("/instructor");

  return (
    <div
      className={`portalLayout${isInstructorPortal ? " portalLayoutInstructor" : ""}`}
    >
      <Sidebar title={menuTitle} items={items} />

      <main
        className={`portalMain${isInstructorPortal ? " portalMainInstructor" : ""}`}
      >
        <Outlet />
      </main>
    </div>
  );
}