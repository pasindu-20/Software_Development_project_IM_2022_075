// frontend/src/components/PublicNavbar.jsx
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function PublicNavbar() {
  const { token, role, logout } = useAuth();
  const location = useLocation();
  const nav = useNavigate();

  const isParent = !!token && role === "PARENT";

  const navItemClass = ({ isActive }) =>
    "navLink" + (isActive ? " navLinkActive" : "");

  const onLogout = () => {
    logout();
    nav("/"); // go home after logout
  };

  return (
    <header className="navWrap">
      <div className="navInner">
        {/* Brand */}
        <Link to="/" className="brand">
          <span className="brandIcon">🧸</span>
          <span className="brandText">
            <span className="brandTitle">Poddo Playhouse</span>
            <span className="brandTag">Fun • Safe • Learning</span>
          </span>
        </Link>

        {/* Center Nav */}
        <nav className="navLinks">
          <NavLink className={navItemClass} to="/">
            Home
          </NavLink>
          <NavLink className={navItemClass} to="/services">
            Services
          </NavLink>
          <NavLink className={navItemClass} to="/party-packages">
            Party Area
          </NavLink>
          <NavLink className={navItemClass} to="/about">
            About
          </NavLink>
          <NavLink className={navItemClass} to="/contact">
            Contact
          </NavLink>
        </nav>

        {/* Right Actions */}
        <div className="navActions">
          {isParent ? (
            <>
              <Link
                to="/profile"
                className={
                  location.pathname.startsWith("/profile")
                    ? "navBtn navBtnSoft navBtnActive"
                    : "navBtn navBtnSoft"
                }
              >
                My Profile
              </Link>
              <button className="navBtn navBtnPrimary" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="navBtn navBtnSoft" to="/auth/signin">
                Sign in
              </Link>
              <Link className="navBtn navBtnPrimary" to="/auth/signup">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
