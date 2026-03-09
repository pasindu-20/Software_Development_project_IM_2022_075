import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { PageContainer, SectionBox, FeatureGrid, FeatureCard } from "../../components/PublicUI";
import { listPublicEventsApi } from "../../api/publicApi";

export default function Services() {
  const [events, setEvents] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    const run = async () => {
      setErr("");
      try {
        const res = await listPublicEventsApi();
        setEvents(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setEvents([]);
        setErr(e?.response?.data?.message || "");
      }
    };
    run();
  }, []);

  return (
    <PageContainer>
      <SectionBox icon="🧩" subtitle="Services" title="Everything kids love with safety first">
        <FeatureGrid>
          <FeatureCard
            icon="🛝"
            title="Play Area"
            desc="Safe supervised play. Perfect for everyday fun and energy release."
            action={<Link className="pubBtn pubBtnSoft" to="/play-area">View Play Areas</Link>}
          />
          <FeatureCard
            icon="🎨"
            title="Classes"
            desc="Creative sessions like art, dance, storytelling and skill learning."
            action={<Link className="pubBtn pubBtnPrimary" to="/classes">View Classes</Link>}
          />
          <FeatureCard
            icon="🎈"
            title="Events"
            desc="Special weekend activities, group fun, and seasonal events."
            action={<Link className="pubBtn pubBtnSoft" to="/services#events">See Events</Link>}
          />
        </FeatureGrid>
      </SectionBox>

      <SectionBox icon="🎉" subtitle="Live Events" title="Upcoming events from the admin dashboard">
        {err ? <div>{err}</div> : null}

        <div id="events" style={{ display: "grid", gap: 12 }}>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                background: "#fff",
                borderRadius: 18,
                padding: 18,
                boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 20 }}>{event.title}</div>
              <div style={{ marginTop: 8, opacity: 0.8 }}>{event.description || "Event details coming soon."}</div>
              <div style={{ marginTop: 10, fontWeight: 700 }}>
                Age: {event.age || `${event.age_min}-${event.age_max} years`}
              </div>
              <div style={{ marginTop: 6, fontWeight: 700 }}>
                Fee: LKR {Number(event.fee || 0).toFixed(2)}
              </div>
            </div>
          ))}

          {events.length === 0 && !err ? <div>No active events yet.</div> : null}
        </div>
      </SectionBox>
    </PageContainer>
  );
}