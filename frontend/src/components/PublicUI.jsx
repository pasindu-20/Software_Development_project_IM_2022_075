// frontend/src/components/PublicUI.jsx
import { motion } from "framer-motion";

export function PageContainer({ children }) {
  return <div className="pubContainer">{children}</div>;
}

export function SectionBox({ title, subtitle, icon, right, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pubSection"
    >
      <div className="pubSectionHead">
        <div>
          <div className="pubKicker">
            <span className="pubKickerIcon">{icon || "✨"}</span>
            <span className="pubKickerText">{subtitle || ""}</span>
          </div>
          <h2 className="pubTitle">{title}</h2>
        </div>
        <div>{right || null}</div>
      </div>

      <div className="pubSectionBody">{children}</div>
    </motion.section>
  );
}

export function FeatureGrid({ children }) {
  return <div className="pubGrid">{children}</div>;
}

export function FeatureCard({ icon, title, desc, action }) {
  return (
    <div className="pubCard">
      <div className="pubCardIcon">{icon || "🧸"}</div>
      <div className="pubCardTitle">{title}</div>
      <div className="pubCardDesc">{desc}</div>
      {action ? <div className="pubCardAction">{action}</div> : null}
    </div>
  );
}
