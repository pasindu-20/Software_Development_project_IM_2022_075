// frontend/src/pages/public/PartyPackages.jsx
import { Link } from "react-router-dom";
import { PageContainer, SectionBox, FeatureGrid, FeatureCard } from "../../components/PublicUI";

export default function PartyPackages() {
  return (
    <PageContainer>
      <SectionBox icon="🎉" subtitle="Party Packages" title="Make birthdays magical">
        <FeatureGrid>
          <FeatureCard
            icon="🎂"
            title="Classic Party"
            desc="Decorations + games + snacks. Perfect for small groups."
            action={<Link className="pubBtn pubBtnPrimary" to="/contact">Contact to Reserve</Link>}
          />
          <FeatureCard
            icon="🪄"
            title="Premium Party"
            desc="Extra activities + custom theme. Great for bigger celebrations."
            action={<Link className="pubBtn pubBtnSoft" to="/contact">Ask Pricing</Link>}
          />
          <FeatureCard
            icon="👑"
            title="Custom Package"
            desc="Tell us your idea — we can plan it together."
            action={<Link className="pubBtn pubBtnGhost" to="/contact">Send Message</Link>}
          />
        </FeatureGrid>
      </SectionBox>
    </PageContainer>
  );
}
