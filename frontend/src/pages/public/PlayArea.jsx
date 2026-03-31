import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Clock, Users, Shield, Sparkles, ArrowRight } from "lucide-react";
import { listPublicPlayAreasApi } from "../../api/publicApi";

export default function PlayArea() {
  const [zones, setZones] = useState([]);
  const [err, setErr] = useState("");

  const features = [
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Soft-padded equipment and CCTV monitoring",
    },
    {
      icon: Users,
      title: "Age-Appropriate",
      description: "Separate zones for different age groups",
    },
    {
      icon: Sparkles,
      title: "Clean Environment",
      description: "Sanitized daily for your peace of mind",
    },
    {
      icon: Clock,
      title: "Flexible Hours",
      description: "Open 7 days a week from 9 AM to 8 PM",
    },
  ];

  useEffect(() => {
    const run = async () => {
      setErr("");
      try {
        const res = await listPublicPlayAreasApi();
        setZones(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Play area load error:", e);
        setZones([]);
        setErr(e?.response?.data?.message || "Failed to load play areas");
      }
    };

    run();
  }, []);

  const heroImage = useMemo(() => {
    return (
      zones.find((zone) => zone.image_url)?.image_url ||
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800"
    );
  }, [zones]);

  const buildBookingLink = (zone) => {
    if (!zone) return "/profile/book?booking_type=PLAY_AREA";

    return `/profile/book?booking_type=PLAY_AREA&play_area_id=${encodeURIComponent(
      zone.id
    )}&play_area_name=${encodeURIComponent(
      zone.name || ""
    )}&price=${encodeURIComponent(zone.price || 0)}&capacity=${encodeURIComponent(
      zone.capacity || 0
    )}`;
  };

  const primaryBookingLink = useMemo(() => {
    return buildBookingLink(zones[0]);
  }, [zones]);

  return (
    <div className="playAreaPage">
      <section className="playAreaHero">
        <div className="playAreaContainer">
          <div className="playAreaHeroGrid">
            <div className="playAreaHeroContent">
              <span className="playAreaBadge">Play Area</span>
              <h1 className="playAreaHeroTitle">Indoor Adventure Awaits</h1>
              <p className="playAreaHeroDesc">
                A world of fun and excitement where children can explore, climb,
                slide, and play in a safe, climate-controlled environment designed
                for endless entertainment.
              </p>

              <div className="playAreaBtnRow">
                <Link to={primaryBookingLink} className="playAreaBtnPrimary">
                  Book Now
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="playAreaHeroImageWrap">
              <img src={heroImage} alt="Play area" className="playAreaHeroImage" />
            </div>
          </div>
        </div>
      </section>

      <section className="playAreaSection">
        <div className="playAreaContainer">
          <div className="playAreaFeaturesGrid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="playAreaFeatureCard">
                  <div className="playAreaIconBox">
                    <Icon size={24} />
                  </div>
                  <h3 className="playAreaFeatureTitle">{feature.title}</h3>
                  <p className="playAreaFeatureDesc">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="playAreaMutedSection">
        <div className="playAreaContainer">
          <div className="playAreaSectionHeader">
            <h2 className="playAreaSectionTitle">Our Play Zones</h2>
            <p className="playAreaSectionDesc">
              Thoughtfully designed spaces catering to different developmental
              stages and interests.
            </p>
          </div>

          {err ? <div className="classListError">{err}</div> : null}

          <div className="playAreaZonesGrid">
            {zones.map((zone) => (
              <div key={zone.id} className="playAreaZoneCard">
                <div className="playAreaZoneImageWrap">
                  <img
                    src={
                      zone.image_url ||
                      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800"
                    }
                    alt={zone.name}
                    className="playAreaZoneImage"
                  />
                </div>

                <div className="playAreaZoneBody">
                  <div className="playAreaZoneHeader">
                    <h3 className="playAreaZoneTitle">{zone.name}</h3>
                    <span className="playAreaZoneAge">
                      {zone.age_group || "All ages"}
                    </span>
                  </div>

                  <p className="playAreaZoneDesc">
                    {zone.description || "Play area details coming soon."}
                  </p>

                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      Capacity: {Number(zone.capacity || 0)} kids
                    </div>

                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "18px",
                        color: "#111827",
                      }}
                    >
                      LKR {Number(zone.price || 0).toFixed(0)}
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: "13px",
                          color: "#6b7280",
                          marginLeft: "4px",
                        }}
                      >
                        /visit
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    <Link
                      to={buildBookingLink(zone)}
                      className="playAreaPriceBtnSecondary"
                    >
                      Book This Zone
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {zones.length === 0 && !err ? (
            <div className="classListBottomCard">No active play areas yet.</div>
          ) : null}
        </div>
      </section>

      <section className="playAreaCtaSection">
        <div className="playAreaContainer">
          <div className="playAreaCtaContent">
            <h2 className="playAreaCtaTitle">Ready for Fun?</h2>
            <p className="playAreaCtaDesc">
              Book your visit today and let your children experience the joy of
              safe, engaging play.
            </p>

            <Link to={primaryBookingLink} className="playAreaBtnPrimary">
              Book Your Visit
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}