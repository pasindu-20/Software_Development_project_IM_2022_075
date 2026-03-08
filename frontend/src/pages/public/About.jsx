// frontend/src/pages/public/About.jsx
import { Link } from "react-router-dom";
import { Heart, Shield, Users, Sparkles, Award, Target } from "lucide-react";

export default function About() {
  const facilities = [
    {
      icon: Shield,
      title: "Safe Environment",
      description:
        "CCTV monitoring and trained staff help ensure your child's safety at all times.",
    },
    {
      icon: Sparkles,
      title: "Modern Equipment",
      description:
        "State-of-the-art play structures and educational materials.",
    },
    {
      icon: Users,
      title: "Experienced Staff",
      description:
        "Certified instructors passionate about child development.",
    },
    {
      icon: Heart,
      title: "Nurturing Atmosphere",
      description:
        "A warm, welcoming space designed with love and care.",
    },
    {
      icon: Award,
      title: "Quality Programs",
      description:
        "Age-appropriate activities that promote learning and growth.",
    },
    {
      icon: Target,
      title: "Focused Approach",
      description:
        "Individualized attention to each child's unique needs.",
    },
  ];

  return (
    <div className="aboutPage">
      {/* Hero Section */}
      <section className="aboutHero">
        <div className="aboutHeroContainer">
          <div className="aboutHeroContent">
            <span className="aboutBadge">About Us</span>
            <h1 className="aboutHeroTitle">Welcome to Poddo Play House</h1>
            <p className="aboutHeroDesc">
              Where every child's potential blooms in a nurturing environment of
              play, learning, and imagination.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="aboutSection">
        <div className="aboutStoryGrid">
          <div className="aboutStoryContent">
            <h2 className="aboutSectionTitle">Our Story</h2>
            <div className="aboutStoryText">
              <p>
                Founded in 2020, Poddo Play House was born from a simple yet
                powerful vision: to create a space where children could grow,
                learn, and thrive in an environment that celebrates their unique
                potential.
              </p>
              <p>
                What started as a small indoor play area has blossomed into a
                comprehensive children's development center, offering everything
                from safe play spaces to enriching educational programs. Our
                name "Poddo" reflects our belief that every child has the
                ability to flourish when given the right environment.
              </p>
              <p>
                Today, we proudly serve many families in our community,
                providing a second home where children feel safe, valued, and
                inspired to explore their creativity and capabilities.
              </p>
            </div>
          </div>

          <div className="aboutImageWrap">
            <img
              src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800"
              alt="Our story"
              className="aboutStoryImage"
            />
            <div className="aboutBlobLeft"></div>
            <div className="aboutBlobRight"></div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="aboutMutedSection">
        <div className="aboutSectionContainer">
          <div className="aboutMissionGrid">
            <div className="aboutInfoCard">
              <div className="aboutIconBox aboutIconPink">
                <Target size={28} />
              </div>
              <h3 className="aboutCardTitle">Our Mission</h3>
              <p className="aboutCardDesc">
                To provide a safe, nurturing, and stimulating environment where
                children can explore, learn, and grow through play-based
                experiences and quality educational programs that foster
                creativity, confidence, and social development.
              </p>
            </div>

            <div className="aboutInfoCard">
              <div className="aboutIconBox aboutIconPurple">
                <Sparkles size={28} />
              </div>
              <h3 className="aboutCardTitle">Our Vision</h3>
              <p className="aboutCardDesc">
                To be a leading children's development center recognized for
                excellence in early childhood education and care, creating a
                lasting positive impact on families and the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="aboutSection">
        <div className="aboutSectionHeader">
          <h2 className="aboutSectionTitle">Our Facilities</h2>
          <p className="aboutSectionDesc">
            Everything we do is designed with your child's safety, comfort, and
            development in mind.
          </p>
        </div>

        <div className="aboutFacilitiesGrid">
          {facilities.map((facility, index) => {
            const Icon = facility.icon;
            return (
              <div key={index} className="aboutFacilityCard">
                <div className="aboutIconBox aboutIconPink">
                  <Icon size={28} />
                </div>
                <h3 className="aboutFacilityTitle">{facility.title}</h3>
                <p className="aboutFacilityDesc">{facility.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA / Background Section */}
      <section className="aboutCtaSection">
        <div className="aboutCtaOverlay"></div>
        <div className="aboutCtaContent">
          <h2 className="aboutCtaTitle">Join Our Growing Family</h2>
          <p className="aboutCtaDesc">
            Experience the difference a nurturing, child-centered environment
            can make in your child's life.
          </p>
          <div className="aboutBtnRow">
            <Link to="/contact" className="aboutBtnPrimary">
              Schedule a Visit
            </Link>
            <Link to="/auth/signup" className="aboutBtnSecondary">
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}