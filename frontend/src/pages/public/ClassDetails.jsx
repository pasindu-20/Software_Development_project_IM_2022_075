// frontend/src/pages/public/ClassDetails.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Users, ArrowRight, Check } from "lucide-react";
import { getPublicClassApi } from "../../api/publicApi";

export default function ClassDetails() {
  const [classes, setClasses] = useState([]);
  const [err, setErr] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isParent = !!token && role === "PARENT";

  useEffect(() => {
    const run = async () => {
      setErr("");
      try {
        const res = await getPublicClassApi();

        if (Array.isArray(res.data)) {
          setClasses(res.data);
        } else if (Array.isArray(res.data?.classes)) {
          setClasses(res.data.classes);
        } else {
          setClasses([]);
        }
      } catch (e) {
        setClasses([
          {
            id: 1,
            title: "Art & Craft Workshop",
            description:
              "A creative class that helps children explore colors, drawing, and craft activities.",
            schedule: "Every Saturday, 10:00 AM",
            fee: 5000,
            age: "5-10 years",
            duration: "1 hour",
            spots: 12,
            instructor: "Ms. Sarah Johnson",
            image:
              "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800",
          },
          {
            id: 2,
            title: "Music & Movement",
            description:
              "A fun and energetic class designed to improve rhythm, coordination, and confidence.",
            schedule: "Every Sunday, 2:00 PM",
            fee: 4500,
            age: "4-8 years",
            duration: "1 hour",
            spots: 10,
            instructor: "Mr. David Lee",
            image:
              "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
          },
          {
            id: 3,
            title: "Creative Storytelling",
            description:
              "A class that builds imagination, speaking skills, and confidence through stories and activities.",
            schedule: "Every Friday, 4:00 PM",
            fee: 4000,
            age: "6-12 years",
            duration: "1.5 hours",
            spots: 15,
            instructor: "Ms. Emily Brown",
            image:
              "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
          },
        ]);
        setErr(e?.response?.data?.message || "");
      }
    };

    run();
  }, []);

  return (
    <div className="classListPage">
      {/* Hero */}
      <section className="classListHero">
        <div className="classListContainer">
          <div className="classListHeroContent">
            <span className="classListBadge">Our Classes</span>
            <h1 className="classListTitle">Explore All Available Classes</h1>
            <p className="classListDesc">
              Discover fun and enriching classes designed to help children
              learn, grow, and express their creativity in a joyful
              environment.
            </p>
          </div>
        </div>
      </section>

      {/* Error */}
      {err ? (
        <div className="classListContainer">
          <div className="classListError">{err}</div>
        </div>
      ) : null}

      {/* Class cards */}
      <section className="classListSection">
        <div className="classListContainer">
          <div className="classListGrid">
            {classes.map((cls, index) => (
              <div key={cls.id || index} className="classListCard">
                <div className="classListImageWrap">
                  <img
                    src={
                      cls.image ||
                      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800"
                    }
                    alt={cls.title || "Class"}
                    className="classListImage"
                  />
                  <div className="classListSpots">
                    {cls.spots ?? 12} spots available
                  </div>
                </div>

                <div className="classListBody">
                  <div className="classListBadgeRow">
                    <span className="classListMiniBadge">
                      {cls.age || "Kids Class"}
                    </span>
                  </div>

                  <h2 className="classListCardTitle">{cls.title || "Class"}</h2>
                  <p className="classListCardDesc">
                    {cls.description || "Class details will appear here."}
                  </p>

                  <div className="classListInfo">
                    <div className="classListInfoItem">
                      <Calendar size={16} />
                      <span>{cls.schedule || "—"}</span>
                    </div>
                    <div className="classListInfoItem">
                      <Clock size={16} />
                      <span>{cls.duration || "1 hour"}</span>
                    </div>
                    <div className="classListInfoItem">
                      <Users size={16} />
                      <span>{cls.instructor || "Poddo Team"}</span>
                    </div>
                  </div>

                  <div className="classListFooter">
                    <div className="classListPrice">
                      LKR {Number(cls.fee ?? cls.class_fee ?? cls.price ?? 0).toFixed(2)}
                    </div>

                    {isParent ? (
                      <Link
                        to={`/profile/enroll?class_id=${encodeURIComponent(cls.id ?? "")}`}
                        className="classListBtnPrimary"
                      >
                        Enroll Now
                        <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <Link to="/auth/signin" className="classListBtnPrimary">
                        Sign in to Enroll
                        <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="classListBottomCard">
            <h3 className="classListBottomTitle">Why choose our classes?</h3>
            <div className="classListBenefits">
              <div className="classListBenefitItem">
                <Check size={16} />
                <span>Friendly and experienced instructors</span>
              </div>
              <div className="classListBenefitItem">
                <Check size={16} />
                <span>Safe and engaging environment</span>
              </div>
              <div className="classListBenefitItem">
                <Check size={16} />
                <span>Age-appropriate lessons and activities</span>
              </div>
              <div className="classListBenefitItem">
                <Check size={16} />
                <span>Simple enrollment and payment process</span>
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