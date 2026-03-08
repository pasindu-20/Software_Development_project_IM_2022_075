// frontend/src/pages/public/Home.jsx
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

export default function Home() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isParent = !!token && role === "PARENT";

  const upcomingClasses = [
    {
      id: 1,
      title: "Art & Craft Workshop",
      instructor: "Ms. Sarah Johnson",
      date: "March 15, 2026",
      time: "10:00 AM - 12:00 PM",
      spots: 8,
      image:
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400",
    },
    {
      id: 2,
      title: "Music & Movement",
      instructor: "Mr. David Lee",
      date: "March 18, 2026",
      time: "2:00 PM - 3:30 PM",
      spots: 5,
      image:
        "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400",
    },
    {
      id: 3,
      title: "Creative Storytelling",
      instructor: "Ms. Emily Brown",
      date: "March 20, 2026",
      time: "11:00 AM - 12:30 PM",
      spots: 10,
      image:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
    },
  ];

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
          {upcomingClasses.map((classItem) => (
            <div key={classItem.id} className="homeClassCard">
              <div className="homeClassImageWrap">
                <img
                  src={classItem.image}
                  alt={classItem.title}
                  className="homeClassImage"
                />
                <div className="homeSpots">{classItem.spots} spots left</div>
              </div>

              <div className="homeClassBody">
                <h3 className="homeClassTitle">{classItem.title}</h3>
                <p className="homeInstructor">by {classItem.instructor}</p>

                <div className="homeClassMeta">
                  <Calendar size={16} />
                  <span>{classItem.date}</span>
                </div>
                <div className="homeClassMeta">
                  <Clock size={16} />
                  <span>{classItem.time}</span>
                </div>
                <div className="homeClassMeta">
                  <Users size={16} />
                  <span>Limited seats available</span>
                </div>

                <Link to="/classes" className="homeEnrollBtn">
                  Enroll Now
                </Link>
              </div>
            </div>
          ))}
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