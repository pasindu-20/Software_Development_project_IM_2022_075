import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function PortalLayout({ menuTitle, items }) {
  const location = useLocation();
  const isInstructorPortal = location.pathname.startsWith("/instructor");
  const isReceptionPortal = location.pathname.startsWith("/reception");
  const isAdminPortal = location.pathname.startsWith("/admin");
  const isStaffPortal = isInstructorPortal || isReceptionPortal;

  return (
    <div
      className={`portalLayout${
        isStaffPortal
          ? " portalLayoutInstructor"
          : isAdminPortal
          ? " portalLayoutAdmin"
          : ""
      }`}
    >
      <Sidebar title={menuTitle} items={items} />

      <main
        className={`portalMain${
          isStaffPortal
            ? " portalMainInstructor"
            : isAdminPortal
            ? " portalMainAdmin"
            : ""
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}