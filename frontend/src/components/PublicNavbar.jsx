import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useEffect, useRef, useState } from "react";
import "../global.css";

export default function PublicNavbar() {
  const { token, role } = useAuth();
  const location = useLocation();

  const isParent = !!token && role === "PARENT";

  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const navItemClass = ({ isActive }) =>
    "navLink" + (isActive ? " navLinkActive" : "");

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="navWrap">
      <div className="navInner">
        {/* Brand */}
        <Link to="/" className="brand">
          <span className="brandIcon">
            <img
              src="profile.png"
              width="44"
              style={{ borderRadius: "5px" }}
              alt="Profile"
            />
          </span>
          <span className="brandText">
            <span className="brandTitle">Poddo Playhouse</span>
            <span className="brandTag">Fun • Safe • Learning</span>
          </span>
        </Link>

        {/* Center Nav */}
        <nav className="navLinks">
          <NavLink end className={navItemClass} to="/">
            Home
          </NavLink>

          <div className="navDropdown" ref={dropdownRef}>
            <span
              className={`navLink ${openDropdown === "services" ? "navLinkActive" : ""}`}
              onClick={() => toggleDropdown("services")}
              style={{ cursor: "pointer" }}
            >
              Services
            </span>

            {openDropdown === "services" && (
              <div className="dropdownMenu">
                <Link
                  to="/classes"
                  className="dropdownItem"
                  onClick={() => setOpenDropdown(null)}
                >
                  Classes
                </Link>
                <Link
                  to="/play-area"
                  className="dropdownItem"
                  onClick={() => setOpenDropdown(null)}
                >
                  Play Area
                </Link>
                <Link
                  to="/party-packages"
                  className="dropdownItem"
                  onClick={() => setOpenDropdown(null)}
                >
                  Party Area
                </Link>
              </div>
            )}
          </div>

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
            <Link
              to="/profile"
              className={
                location.pathname.startsWith("/profile")
                  ? "navBtn navBtnPrimary navBtnActive"
                  : "navBtn navBtnPrimary"
              }
            >
              My Profile
            </Link>
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