import { Link } from "react-router-dom";
import { Check, ArrowRight, PartyPopper, Users, Cake, Gift } from "lucide-react";

export default function PartyPackages() {
  const features = [
    "Private party room",
    "Dedicated party host",
    "Themed decorations",
    "Birthday cake included",
    "Party invitations",
    "Photography services",
    "Goodie bags for guests",
    "Access to play area",
  ];

  const themes = ["Princess Party", "Superhero Adventure", "Unicorn Magic", "Jungle Safari"];

  return (
    <div className="partyPage">
      <section className="partyHero">
        <div className="partyHeroContainer">
          <div className="partyHeroGrid">
            <div className="partyHeroContent">
              <span className="partyBadge">Party Area</span>
              <h1 className="partyHeroTitle">Unforgettable Birthday Celebrations</h1>
              <p className="partyHeroDesc">
                Make your child's special day truly magical with our all-inclusive
                birthday party packages. We handle everything so you can focus on
                creating memories.
              </p>

              <div className="partyBtnRow">
                <Link
                  to="/profile/book?booking_type=PARTY&package=General%20Party%20Booking"
                  className="partyBtnPrimary"
                >
                  Book a Party
                  <ArrowRight size={18} />
                </Link>

                <a href="#packages" className="partyBtnSecondary">
                  View Packages
                </a>
              </div>
            </div>

            <div className="partyHeroImageWrap">
              <img
                src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800"
                alt="Birthday party"
                className="partyHeroImage"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="partySection">
        <div className="partySectionHeader">
          <h2 className="partySectionTitle">What's Included</h2>
          <p className="partySectionDesc">
            Every party package comes with everything you need for a stress-free celebration.
          </p>
        </div>

        <div className="partyIncludedGrid">
          {[
            { icon: PartyPopper, title: "Themed Decor", description: "Choose from our exciting themes" },
            { icon: Users, title: "Party Host", description: "Dedicated staff member" },
            { icon: Cake, title: "Birthday Cake", description: "Delicious custom cake" },
            { icon: Gift, title: "Goodie Bags", description: "For all party guests" },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="partyIncludedCard">
                <div className="partyIconBox">
                  <Icon size={24} />
                </div>
                <h3 className="partyIncludedTitle">{item.title}</h3>
                <p className="partyIncludedDesc">{item.description}</p>
              </div>
            );
          })}
        </div>

        <div className="partyFeaturesCard">
          <h3 className="partyFeaturesTitle">Complete Party Features</h3>
          <div className="partyFeaturesGrid">
            {features.map((feature, index) => (
              <div key={index} className="partyFeatureItem">
                <div className="partyCheckBox">
                  <Check size={16} />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="partyMutedSection">
        <div className="partySectionContainer">
          <div className="partySectionHeader">
            <h2 className="partySectionTitle">Party Packages</h2>
            <p className="partySectionDesc">
              Choose the perfect package for your celebration.
            </p>
          </div>

          <div className="partyPackagesGrid">
            <div className="partyPackageCard">
              <div className="partyPackageBadgeWrap">
                <span className="partyPackageBadge">Package 01</span>
              </div>

              <h3 className="partyPackageTitle">Classic Party</h3>

              <div className="partyPriceWrap">
                <span className="partyPrice">25,000</span>
                <span className="partyCurrency">LKR</span>
              </div>

              <ul className="partyPackageList">
                <li><Check size={18} /> Up to 15 children</li>
                <li><Check size={18} /> 2-hour party room access</li>
                <li><Check size={18} /> Basic themed decorations</li>
                <li><Check size={18} /> Birthday cake (1kg)</li>
                <li><Check size={18} /> Party host included</li>
                <li><Check size={18} /> Simple goodie bags</li>
                <li><Check size={18} /> Complimentary invitations (15)</li>
              </ul>

              <Link
                to="/profile/book?booking_type=PARTY&package=Classic%20Party&price=25000"
                className="partyPackageBtn"
              >
                Book Package 01
              </Link>
            </div>

            <div className="partyPackageCardFeatured">
              <div className="partyPremiumBadge">Premium</div>

              <div className="partyPackageBadgeWrap">
                <span className="partyPackageBadgeFeatured">Package 02</span>
              </div>

              <h3 className="partyPackageTitleFeatured">Deluxe Party</h3>

              <div className="partyPriceWrapFeatured">
                <span className="partyPriceFeatured">50,000</span>
                <span className="partyCurrencyFeatured">LKR</span>
              </div>

              <ul className="partyPackageListFeatured">
                <li><Check size={18} /> Up to 25 children</li>
                <li><Check size={18} /> 3-hour party room access</li>
                <li><Check size={18} /> Premium themed decorations</li>
                <li><Check size={18} /> Birthday cake (2kg)</li>
                <li><Check size={18} /> Party host & assistant</li>
                <li><Check size={18} /> Premium goodie bags</li>
                <li><Check size={18} /> Professional photography</li>
                <li><Check size={18} /> Custom invitations (25)</li>
                <li><Check size={18} /> Food & beverages included</li>
              </ul>

              <Link
                to="/profile/book?booking_type=PARTY&package=Deluxe%20Party&price=50000"
                className="partyPackageBtnFeatured"
              >
                Book Package 02
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="partySection">
        <div className="partySectionHeader">
          <h2 className="partySectionTitle">Popular Themes</h2>
          <p className="partySectionDesc">
            Choose from our exciting party themes or customize your own.
          </p>
        </div>

        <div className="partyThemesGrid">
          {themes.map((theme, index) => (
            <div key={index} className="partyThemeCard">
              <div className="partyThemeIcon">
                {index === 0 && "👑"}
                {index === 1 && "🦸"}
                {index === 2 && "🦄"}
                {index === 3 && "🦁"}
              </div>
              <h3 className="partyThemeTitle">{theme}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="partyCtaSection">
        <div className="partyCtaContainer">
          <div className="partyCtaContent">
            <h2 className="partyCtaTitle">Ready to Plan the Perfect Party?</h2>
            <p className="partyCtaDesc">
              Our team is here to help you create a memorable celebration your child will treasure forever.
            </p>

            <Link
              to="/profile/book?booking_type=PARTY&package=General%20Party%20Booking"
              className="partyBtnPrimary"
            >
              Book Your Party
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}