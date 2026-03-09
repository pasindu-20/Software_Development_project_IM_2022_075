import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Users, ArrowRight, Check } from "lucide-react";
import { listPublicClassesApi } from "../../api/publicApi";

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
            <span className="classListBadge">Our Classes</span>
            <h1 className="classListTitle">Explore All Available Classes</h1>
            <p className="classListDesc">
              Discover fun and enriching classes designed to help children learn and grow.
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
          <div className="classListGrid">
            {classes.map((cls) => (
              <div key={cls.id} className="classListCard">
                <div className="classListImageWrap">
                  <img
                    src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800"
                    alt={cls.title || "Class"}
                    className="classListImage"
                  />
                  <div className="classListSpots">Available</div>
                </div>

                <div className="classListBody">
                  <div className="classListBadgeRow">
                    <span className="classListMiniBadge">
                      {cls.age || `${cls.age_min}-${cls.age_max} years`}
                    </span>
                  </div>

                  <h2 className="classListCardTitle">{cls.title}</h2>
                  <p className="classListCardDesc">{cls.description || "Class details will appear here."}</p>

                  <div className="classListInfo">
                    <div className="classListInfoItem">
                      <Calendar size={16} />
                      <span>Kids Program</span>
                    </div>
                    <div className="classListInfoItem">
                      <Clock size={16} />
                      <span>See details on enrollment</span>
                    </div>
                    <div className="classListInfoItem">
                      <Users size={16} />
                      <span>Poddo Team</span>
                    </div>
                  </div>

                  <div className="classListFooter">
                    <div className="classListPrice">
                      LKR {Number(cls.fee || 0).toFixed(2)}
                    </div>

                    {isParent ? (
                      <Link
                        to={`/profile/enroll?class_id=${encodeURIComponent(cls.id)}`}
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

          {classes.length === 0 && !err ? (
            <div className="classListBottomCard">
              No active classes yet.
            </div>
          ) : null}

          <div className="classListBottomCard">
            <h3 className="classListBottomTitle">Why choose our classes?</h3>
            <div className="classListBenefits">
              <div className="classListBenefitItem"><Check size={16} /><span>Friendly instructors</span></div>
              <div className="classListBenefitItem"><Check size={16} /><span>Safe environment</span></div>
              <div className="classListBenefitItem"><Check size={16} /><span>Age-appropriate learning</span></div>
              <div className="classListBenefitItem"><Check size={16} /><span>Simple enrollment process</span></div>
            </div>

            <div className="classListActions">
              <Link to="/services" className="classListBtnSecondary">Back to Services</Link>
              <Link to="/contact" className="classListBtnSecondary">Ask About Classes</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}