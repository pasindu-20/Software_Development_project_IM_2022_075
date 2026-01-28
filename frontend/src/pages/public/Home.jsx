// frontend/src/pages/public/Home.jsx
import { Link } from "react-router-dom";
import { PageContainer, SectionBox, FeatureGrid, FeatureCard } from "../../components/PublicUI";
import { useAuth } from "../../auth/useAuth";

export default function Home() {
  const { user } = useAuth(); // should exist after login
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isParent = !!token && role === "PARENT";

  return (
    <PageContainer>
      <SectionBox
        subtitle="Fun • Safe • Learning"
        title="A colourful play space where kids learn, play, and grow ✨"
        right={
          <div className="pubBtnRow">
            <Link className="pubBtn pubBtnSoft" to="/services">Explore Services</Link>
            <Link className="pubBtn pubBtnGhost" to="/party-packages">Party Packages</Link>
            <Link className="pubBtn pubBtnGhost" to="/contact">Contact Us</Link>
          </div>
        }
      >
        <FeatureGrid>
          <FeatureCard
            icon="🛝"
            title="Play Area"
            desc="Safe, clean, supervised play sessions for kids."
            action={<Link className="pubBtn pubBtnSoft" to="/services">View Play Area</Link>}
          />
          <FeatureCard
            icon="🧩"
            title="Classes"
            desc="Weekend learning: art, dance, skill building."
            action={<Link className="pubBtn pubBtnSoft" to="/classes">View Classes</Link>}
          />
          <FeatureCard
            icon="🎉"
            title="Events & Parties"
            desc="Birthday packages and special experiences."
            action={<Link className="pubBtn pubBtnPrimary" to="/party-packages">See Packages</Link>}
          />
        </FeatureGrid>

        {/* ✅ Message changes based on login */}
        <div style={{ marginTop: 14, opacity: 0.9, fontWeight: 800 }}>
          {isParent ? (
            <>Welcome back! You can manage bookings, enrollments and payments inside <b>My Profile</b>.</>
          ) : (
            <>Sign in to create bookings, enroll into classes, and manage payments inside <b>My Profile</b>.</>
          )}
        </div>

        {/* ✅ Buttons hidden when parent is logged in */}
        {!isParent ? (
          <div className="pubBtnRow" style={{ marginTop: 10 }}>
            <Link className="pubBtn pubBtnPrimary" to="/auth/signup">Create Account</Link>
            <Link className="pubBtn pubBtnSoft" to="/auth/signin">Sign In</Link>
            <Link className="pubBtn pubBtnGhost" to="/admin/signin">Staff Portal</Link>
          </div>
        ) : (
          <div className="pubBtnRow" style={{ marginTop: 10 }}>
            <Link className="pubBtn pubBtnPrimary" to="/profile">Go to My Profile</Link>
            <Link className="pubBtn pubBtnSoft" to="/classes">Browse Classes</Link>
          </div>
        )}
      </SectionBox>

      <SectionBox
        subtitle="What we offer"
        title="Services designed for kids & comfort for parents"
      >
        <FeatureGrid>
          <FeatureCard icon="✅" title="Easy booking" desc="Create bookings from your profile. Choose date & time slot and track status." />
          <FeatureCard icon="🎓" title="Class enrollment" desc="Add your child and enroll into classes quickly." />
          <FeatureCard icon="💳" title="Payments & receipts" desc="Pay and view payment history anytime." />
        </FeatureGrid>
      </SectionBox>
    </PageContainer>
  );
}
