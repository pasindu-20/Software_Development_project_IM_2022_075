// frontend/src/pages/public/Services.jsx
import { Link } from "react-router-dom";
import { PageContainer, SectionBox, FeatureGrid, FeatureCard } from "../../components/PublicUI";

export default function Services() {
  return (
    <PageContainer>
      <SectionBox icon="🧩" subtitle="Services" title="Everything kids love with safety first">
        <FeatureGrid>
          <FeatureCard
            icon="🛝"
            title="Play Area"
            desc="Safe supervised play. Perfect for everyday fun and energy release."
            action={<Link className="pubBtn pubBtnSoft" to="/contact">Ask Availability</Link>}
          />
          <FeatureCard
            icon="🎨"
            title="Classes"
            desc="Creative sessions like art, dance, storytelling and skill learning."
            action={<Link className="pubBtn pubBtnPrimary" to="/auth/signin">Sign in to Enroll</Link>}
          />
          <FeatureCard
            icon="🎈"
            title="Events"
            desc="Special weekend activities, group fun, and seasonal events."
            action={<Link className="pubBtn pubBtnSoft" to="/party-packages">See Party Packages</Link>}
          />
        </FeatureGrid>
      </SectionBox>
    </PageContainer>
  );
}
