// frontend/src/pages/public/PlayArea.jsx
import { Link } from "react-router-dom";
import { Clock, Users, Shield, Sparkles, ArrowRight } from "lucide-react";

export default function PlayArea() {
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

  const zones = [
    {
      name: "Toddler Zone",
      age: "1-3 years",
      description:
        "Gentle play structures, soft play mats, and sensory toys.",
      image:
        "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400",
    },
    {
      name: "Junior Zone",
      age: "4-7 years",
      description:
        "Slides, climbing frames, ball pits, and interactive games.",
      image:
        "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400",
    },
    {
      name: "Active Zone",
      age: "8-12 years",
      description:
        "Challenging obstacles, sports activities, and team games.",
      image:
        "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400",
    },
  ];

  return (
    <div className="playAreaPage">
      {/* Hero Section */}
      <section className="playAreaHero">
        <div className="playAreaContainer">
          <div className="playAreaHeroGrid">
            <div className="playAreaHeroContent">
              <span className="playAreaBadge">Play Area</span>
              <h1 className="playAreaHeroTitle">Indoor Adventure Awaits</h1>
              <p className="playAreaHeroDesc">
                A world of fun and excitement where children can explore, climb,
                slide, and play in a safe, climate-controlled environment
                designed for endless entertainment.
              </p>

              <div className="playAreaBtnRow">
                <Link to="/profile/book" className="playAreaBtnPrimary">
                  Book Now
                  <ArrowRight size={18} />
                </Link>

                <a href="#pricing" className="playAreaBtnSecondary">
                  View Pricing
                </a>
              </div>
            </div>

            <div className="playAreaHeroImageWrap">
              <img
                src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800"
                alt="Play area"
                className="playAreaHeroImage"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
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

      {/* Play Zones */}
      <section className="playAreaMutedSection">
        <div className="playAreaContainer">
          <div className="playAreaSectionHeader">
            <h2 className="playAreaSectionTitle">Our Play Zones</h2>
            <p className="playAreaSectionDesc">
              Thoughtfully designed spaces catering to different developmental
              stages and interests.
            </p>
          </div>

          <div className="playAreaZonesGrid">
            {zones.map((zone, index) => (
              <div key={index} className="playAreaZoneCard">
                <div className="playAreaZoneImageWrap">
                  <img
                    src={zone.image}
                    alt={zone.name}
                    className="playAreaZoneImage"
                  />
                </div>

                <div className="playAreaZoneBody">
                  <div className="playAreaZoneHeader">
                    <h3 className="playAreaZoneTitle">{zone.name}</h3>
                    <span className="playAreaZoneAge">{zone.age}</span>
                  </div>
                  <p className="playAreaZoneDesc">{zone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="playAreaSection">
        <div className="playAreaContainer">
          <div className="playAreaSectionHeader">
            <h2 className="playAreaSectionTitle">Flexible Pricing</h2>
            <p className="playAreaSectionDesc">
              Choose the option that works best for your family's schedule.
            </p>
          </div>

          <div className="playAreaPricingGrid">
            {/* Hourly Pass */}
            <div className="playAreaPriceCard">
              <h3 className="playAreaPriceTitle">Hourly Pass</h3>
              <div className="playAreaPriceWrap">
                <span className="playAreaPrice">500</span>
                <span className="playAreaPriceCurrency">LKR/hour</span>
              </div>

              <ul className="playAreaPriceList">
                <li><span>✓</span> Access to all zones</li>
                <li><span>✓</span> Unlimited play time</li>
                <li><span>✓</span> Complimentary socks</li>
              </ul>

              <Link to="/profile/book" className="playAreaPriceBtnSecondary">
                Select
              </Link>
            </div>

            {/* Day Pass */}
            <div className="playAreaPriceCardFeatured">
              <div className="playAreaPopularBadge">Most Popular</div>

              <h3 className="playAreaPriceTitleFeatured">Day Pass</h3>
              <div className="playAreaPriceWrapFeatured">
                <span className="playAreaPriceFeatured">1,200</span>
                <span className="playAreaPriceCurrencyFeatured">LKR/day</span>
              </div>

              <ul className="playAreaPriceListFeatured">
                <li><span>✓</span> All-day access</li>
                <li><span>✓</span> Free snack voucher</li>
                <li><span>✓</span> Priority entry</li>
              </ul>

              <Link to="/profile/book" className="playAreaPriceBtnFeatured">
                Select
              </Link>
            </div>

            {/* Monthly Pass */}
            <div className="playAreaPriceCard">
              <h3 className="playAreaPriceTitle">Monthly Pass</h3>
              <div className="playAreaPriceWrap">
                <span className="playAreaPrice">8,000</span>
                <span className="playAreaPriceCurrency">LKR/month</span>
              </div>

              <ul className="playAreaPriceList">
                <li><span>✓</span> Unlimited visits</li>
                <li><span>✓</span> 10% off on parties</li>
                <li><span>✓</span> Guest passes included</li>
              </ul>

              <Link to="/profile/book" className="playAreaPriceBtnSecondary">
                Select
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="playAreaCtaSection">
        <div className="playAreaContainer">
          <div className="playAreaCtaContent">
            <h2 className="playAreaCtaTitle">Ready for Fun?</h2>
            <p className="playAreaCtaDesc">
              Book your visit today and let your children experience the joy of
              safe, engaging play.
            </p>

            <Link to="/profile/book" className="playAreaBtnPrimary">
              Book Your Visit
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}