import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Users, ArrowRight, Check } from "lucide-react";
import { listPublicClassesApi } from "../../api/publicApi";

function formatDate(dateValue) {
  if (!dateValue) return "Date will be announced";

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "Date will be announced";

  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "";

  const parts = String(value).split(":");
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return "Time will be announced";
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

export default function EventClasses() {
  const [classes, setClasses] = useState([]);
  const [err, setErr] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isParent = !!token && role === "PARENT";

  useEffect(() => {
    const run = async () => {
      setErr("");
      try {
        const res = await listPublicClassesApi();
        setClasses(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setClasses([]);
        setErr(e?.response?.data?.message || "Failed to load classes");
      }
    };

    run();
  }, []);

  return (
    <div className="classListPage">
      <section className="classListHero">
        <div className="classListContainer">
          <div className="classListHeroContent">
            <span className="classListBadge">Our Classes & Events</span>
            <h1 className="classListTitle">Explore All Available Programs</h1>
            <p className="classListDesc">
              Discover fun and enriching programs for children.
            </p>
          </div>
        </div>
      </section>

      {err ? (
        <div className="classListContainer">
          <div className="classListError">{err}</div>
        </div>
      ) : null}

      <section className="classListSection">
        <div className="classListContainer">
          <div className="homeClassesGrid">
            {classes.map((cls) => {
              const imageSrc =
                cls.image_url && String(cls.image_url).trim()
                  ? cls.image_url
                  : "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800";

              const instructorName = cls.instructor_name || "Poddo Team";

              const ageText =
                cls.age_min != null && cls.age_max != null
                  ? `${cls.age_min}-${cls.age_max} years`
                  : cls.age_min != null
                  ? `${cls.age_min}+ years`
                  : "All age groups";

              const dateText = formatDate(cls.event_date);
              const timeText = formatTimeRange(cls.start_time, cls.end_time);
              const typeText = cls.item_type === "EVENT" ? "Event" : "Class";

              return (
                <div key={cls.id} className="homeClassCard">
                  <div className="homeClassImageWrap">
                    <img
                      src={imageSrc}
                      alt={cls.title || "Class"}
                      className="homeClassImage"
                    />
                    <div className="homeSpots">{typeText}</div>
                  </div>

                  <div className="homeClassBody">
                    <div
                      style={{
                        display: "inline-block",
                        background: "#fff1f2",
                        color: "#db2777",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: 999,
                        marginBottom: 12,
                      }}
                    >
                      {ageText}
                    </div>

                    <h3 className="homeClassTitle">{cls.title}</h3>
                    <p className="homeInstructor">by {instructorName}</p>

                    <div className="homeClassMeta">
                      <Calendar size={16} />
                      <span>{dateText}</span>
                    </div>

                    <div className="homeClassMeta">
                      <Clock size={16} />
                      <span>{timeText}</span>
                    </div>

                    <div className="homeClassMeta">
                      <Users size={16} />
                      <span>
                        {cls.description && String(cls.description).trim()
                          ? cls.description
                          : "Limited seats available"}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#111827",
                        }}
                      >
                        LKR {Number(cls.fee || 0).toFixed(2)}
                      </div>

                      {isParent ? (
                        <Link
                          to={`/profile/enroll?class_id=${encodeURIComponent(cls.id)}`}
                          className="homeEnrollBtn"
                          style={{
                            width: "auto",
                            minWidth: 170,
                            textAlign: "center",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            textDecoration: "none",
                          }}
                        >
                          Enroll Now
                          <ArrowRight size={16} />
                        </Link>
                      ) : (
                        <Link
                          to="/auth/signin"
                          className="homeEnrollBtn"
                          style={{
                            width: "auto",
                            minWidth: 170,
                            textAlign: "center",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            textDecoration: "none",
                          }}
                        >
                          Sign in to Enroll
                          <ArrowRight size={16} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {classes.length === 0 && !err ? (
            <div className="classListBottomCard">
              No active classes or events yet.
            </div>
          ) : null}

          <div className="classListBottomCard">
            <h3 className="classListBottomTitle">Why choose our programs?</h3>

            <div className="classListBenefits">
              <div className="classListBenefitItem">
                <Check size={16} />
                <span>Friendly instructors</span>
              </div>
              <div className="classListBenefitItem">
                <Check size={16} />
                <span>Safe environment</span>
              </div>
              <div className="classListBenefitItem">
                <Check size={16} />
                <span>Age-appropriate learning</span>
              </div>
              <div className="classListBenefitItem">
                <Check size={16} />
                <span>Simple enrollment process</span>
              </div>
            </div>

            <div className="classListActions">
              <Link to="/services" className="classListBtnSecondary">
                Back to Services
              </Link>
              <Link to="/contact" className="classListBtnSecondary">
                Ask About Classes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}