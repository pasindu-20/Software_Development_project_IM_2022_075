// frontend/src/pages/public/Contact.jsx
import { PageContainer, SectionBox } from "../../components/PublicUI";

export default function Contact() {
  return (
    <PageContainer>
      <SectionBox icon="☎️" subtitle="Contact" title="We’d love to hear from you">
        <div style={{ display: "grid", gap: 10, maxWidth: 760 }}>
          <div style={{ fontWeight: 800, opacity: 0.9 }}>Poddo Playhouse</div>
          <div style={{ opacity: 0.85 }}>
            
          </div>

          <input placeholder="Your name" />
          <input placeholder="Your email" />
          <textarea placeholder="Write your message..." rows={6} />

          <button className="pubBtn pubBtnPrimary" type="button">
            Send Message
          </button>
        </div>
      </SectionBox>
    </PageContainer>
  );
}
