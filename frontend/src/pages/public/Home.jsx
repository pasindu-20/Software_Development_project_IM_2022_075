import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  PartyPopper,
  GraduationCap,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { listPublicClassesApi } from "../../api/publicApi";

function getDayNameFromDate(dateValue) {
  if (!dateValue) return "";

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function getScheduleLabel(cls) {
  if (cls?.schedule_text && String(cls.schedule_text).trim()) {
    return String(cls.schedule_text).trim();
  }

  const dayName = getDayNameFromDate(cls?.event_date);
  return dayName || "Schedule will be announced";
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

function getAgeLabel(cls) {
  if (cls?.age) return cls.age;

  if (cls?.age_min != null && cls?.age_max != null) {
    return `${cls.age_min}-${cls.age_max} years`;
  }

  if (cls?.age_min != null) {
    return `${cls.age_min}+ years`;
  }

  if (cls?.age_max != null) {
    return `Up to ${cls.age_max} years`;
  }

  return "Latest Class";
}

export default function Home() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isParent = !!token && role === "PARENT";

  const [latestClasses, setLatestClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);

  useEffect(() => {
    const loadLatestClasses = async () => {
      setClassesLoading(true);

      try {
        const res = await listPublicClassesApi();
        const rows = Array.isArray(res.data) ? res.data : [];
        setLatestClasses(rows.slice(0, 3));
      } catch (error) {
        console.error("Failed to load latest classes:", error);
        setLatestClasses([]);
      } finally {
        setClassesLoading(false);
      }
    };

    loadLatestClasses();
  }, []);

  return (
    <div className="homePage">
      <section className="homeHero">
        <div className="homeHeroContainer">
          <div className="homeHeroGrid">
            <div className="homeHeroContent">
              <span className="homeBadge">Welcome to Poddo Play House</span>

              <h1 className="homeTitle">
                Where Learning Meets
                <span className="homeTitleAccent"> Play & Joy</span>
              </h1>

              <p className="homeDesc">
                A premium indoor play space designed for children to explore,
                learn, and create unforgettable memories in a safe and nurturing
                environment.
              </p>

              <div className="homeBtnRow">
                <Link to="/services" className="homeBtnPrimary">
                  Explore Now
                  <ArrowRight size={18} />
                </Link>

                <Link to="/contact" className="homeBtnSecondary">
                  Contact Us
                </Link>
              </div>

              <div className="homeMessage">
                {isParent ? (
                  <>
                    Welcome back! You can manage bookings, enrollments and
                    payments inside <b>My Profile</b>.
                  </>
                ) : (
                  <>
                    Sign in to create bookings, enroll into classes, and manage
                    payments inside <b>My Profile</b>.
                  </>
                )}
              </div>

              {!isParent ? (
                <div className="homeBtnRow">
                  <Link to="/auth/signup" className="homeBtnPrimary">
                    Create Account
                  </Link>
                  <Link to="/auth/signin" className="homeBtnSecondary">
                    Sign In
                  </Link>
                  <Link to="/admin/signin" className="homeBtnGhost">
                    Staff Portal
                  </Link>
                </div>
              ) : (
                <div className="homeBtnRow">
                  <Link to="/profile" className="homeBtnPrimary">
                    Go to My Profile
                  </Link>
                  <Link to="/classes" className="homeBtnSecondary">
                    Browse Classes
                  </Link>
                </div>
              )}
            </div>

            <div className="homeHeroImageWrap">
              <img
                src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800"
                alt="Children playing"
                className="homeHeroImage"
              />
              <div className="homeBlobTop"></div>
              <div className="homeBlobBottom"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="homeServices">
        <div className="homeServicesGrid">
          <Link to="/services" className="homeServiceCard">
            <div className="homeServiceIcon homeServiceIconPink">
              <Sparkles size={28} />
            </div>
            <h3 className="homeServiceTitle">Play Area</h3>
            <p className="homeServiceDesc">
              Safe and exciting indoor playground with age-appropriate
              activities and equipment.
            </p>
            <span className="homeServiceMore">
              Learn More <ArrowRight size={16} />
            </span>
          </Link>

          <Link to="/party-packages" className="homeServiceCard">
            <div className="homeServiceIcon homeServiceIconPurple">
              <PartyPopper size={28} />
            </div>
            <h3 className="homeServiceTitle">Party Area</h3>
            <p className="homeServiceDesc">
              Host unforgettable birthday parties with customizable packages and
              dedicated spaces.
            </p>
            <span className="homeServiceMore">
              Learn More <ArrowRight size={16} />
            </span>
          </Link>

          <Link to="/classes" className="homeServiceCard">
            <div className="homeServiceIcon homeServiceIconOrange">
              <GraduationCap size={28} />
            </div>
            <h3 className="homeServiceTitle">Classes</h3>
            <p className="homeServiceDesc">
              Enriching educational programs from art to music, designed to
              inspire creativity.
            </p>
            <span className="homeServiceMore">
              Learn More <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>

      <section className="homeSection">
        <div className="homeSectionCenter">
          <span className="homeSectionBadge">Upcoming Events</span>
          <h2 className="homeSectionTitle">Join Our Next Classes</h2>
          <p className="homeSectionDesc">
            Discover exciting learning opportunities designed to nurture your
            child's talents and interests.
          </p>
        </div>

        <div className="homeClassesGrid">
          {classesLoading ? (
            <div className="classListBottomCard">Loading latest classes...</div>
          ) : latestClasses.length > 0 ? (
            latestClasses.map((classItem) => {
              const imageSrc =
                classItem.image_url && String(classItem.image_url).trim()
                  ? classItem.image_url
                  : "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800";

              const instructorName =
                classItem.instructor_name && String(classItem.instructor_name).trim()
                  ? classItem.instructor_name
                  : "Poddo Team";

              const scheduleText = getScheduleLabel(classItem);
              const timeText = formatTimeRange(
                classItem.start_time,
                classItem.end_time
              );
              const badgeText = getAgeLabel(classItem);

              return (
                <div key={classItem.id} className="homeClassCard">
                  <div className="homeClassImageWrap">
                    <img
                      src={imageSrc}
                      alt={classItem.title || "Class"}
                      className="homeClassImage"
                    />
                    <div className="homeSpots">{badgeText}</div>
                  </div>

                  <div className="homeClassBody">
                    <h3 className="homeClassTitle">{classItem.title}</h3>
                    <p className="homeInstructor">by {instructorName}</p>

                    <div className="homeClassMeta">
                      <Calendar size={16} />
                      <span>{scheduleText}</span>
                    </div>

                    <div className="homeClassMeta">
                      <Clock size={16} />
                      <span>{timeText}</span>
                    </div>

                    <div className="homeClassMeta">
                      <Users size={16} />
                      <span>
                        {classItem.description && String(classItem.description).trim()
                          ? classItem.description
                          : "Limited seats available"}
                      </span>
                    </div>

                    <Link
                      to={
                        isParent
                          ? `/profile/enroll?class_id=${encodeURIComponent(
                              classItem.id
                            )}`
                          : "/auth/signin"
                      }
                      className="homeEnrollBtn"
                    >
                      {isParent ? "Enroll Now" : "Sign In to Enroll"}
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="classListBottomCard">
              No active classes available right now.
            </div>
          )}
        </div>
      </section>

      <section className="homeSection">
        <div className="homeSectionCenter">
          <span className="homeSectionBadge">What We Offer</span>
          <h2 className="homeSectionTitle">
            Services designed for kids & comfort for parents
          </h2>
        </div>

        <div className="homeFeaturesGrid">
          <div className="homeFeatureCard">
            <div className="homeServiceIcon homeServiceIconPink">
              <Sparkles size={28} />
            </div>
            <h3 className="homeFeatureTitle">Easy booking</h3>
            <p className="homeFeatureDesc">
              Create bookings from your profile. Choose date & time slot and
              track status.
            </p>
          </div>

          <div className="homeFeatureCard">
            <div className="homeServiceIcon homeServiceIconOrange">
              <GraduationCap size={28} />
            </div>
            <h3 className="homeFeatureTitle">Class enrollment</h3>
            <p className="homeFeatureDesc">
              Add your child and enroll into classes quickly.
            </p>
          </div>

          <div className="homeFeatureCard">
            <div className="homeServiceIcon homeServiceIconPurple">
              <PartyPopper size={28} />
            </div>
            <h3 className="homeFeatureTitle">Payments & receipts</h3>
            <p className="homeFeatureDesc">
              Pay and view payment history anytime.
            </p>
          </div>
        </div>
      </section>

      <section className="homeCta">
        <div className="homeCtaInner">
          <div className="homeCtaContent">
            <h2 className="homeCtaTitle">Ready to Create Magical Moments?</h2>
            <p className="homeCtaDesc">
              Join hundreds of families who trust Poddo Play House for their
              children's growth and happiness.
            </p>

            <div className="homeBtnRow" style={{ justifyContent: "center" }}>
              {!isParent ? (
                <Link to="/auth/signup" className="homeCtaBtnWhite">
                  Get Started Today
                </Link>
              ) : (
                <Link to="/profile" className="homeCtaBtnWhite">
                  Go to My Profile
                </Link>
              )}

              <Link to="/about" className="homeCtaBtnGlass">
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}