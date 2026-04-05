import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function PortalLayout({ menuTitle, items }) {
  const location = useLocation();
  const isInstructorPortal = location.pathname.startsWith("/instructor");
  const isReceptionPortal = location.pathname.startsWith("/reception");
  const isStaffPortal = isInstructorPortal || isReceptionPortal;

  return (
    <div className={`portalLayout${isStaffPortal ? " portalLayoutInstructor" : ""}`}>
      <Sidebar title={menuTitle} items={items} />

      <main className={`portalMain${isStaffPortal ? " portalMainInstructor" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}