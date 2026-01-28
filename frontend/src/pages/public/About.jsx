// frontend/src/pages/public/About.jsx
import { Link } from "react-router-dom";
import { PageContainer, SectionBox, FeatureGrid, FeatureCard } from "../../components/PublicUI";

export default function About() {
  return (
    <PageContainer>
      <SectionBox icon="🌟" subtitle="About Poddo" title="A joyful place for kids — and peace of mind for parents">
        <FeatureGrid>
          <FeatureCard icon="🧼" title="Clean Space" desc="Hygiene-focused play environment." />
          <FeatureCard icon="🛡️" title="Safety First" desc="Supervised sessions and safe play rules." />
          <FeatureCard icon="😊" title="Friendly Staff" desc="Supportive and caring team." />
        </FeatureGrid>

        <div className="pubBtnRow" style={{ marginTop: 14 }}>
          <Link className="pubBtn pubBtnPrimary" to="/auth/signup">Create Account</Link>
          <Link className="pubBtn pubBtnSoft" to="/contact">Contact Us</Link>
        </div>
      </SectionBox>
    </PageContainer>
  );
}
