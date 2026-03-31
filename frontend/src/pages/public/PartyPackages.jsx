import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, PartyPopper, Users, Cake, Gift } from "lucide-react";
import { listPublicPartyPackagesApi } from "../../api/publicApi";

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

function buildBookingLink(pkg) {
  return `/profile/book?booking_type=PARTY&package=${encodeURIComponent(
    pkg.name || "Party Package"
  )}&price=${encodeURIComponent(Number(pkg.price || 0))}`;
}

export default function PartyPackages() {
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

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

  useEffect(() => {
    const loadPackages = async () => {
      setLoadingPackages(true);
      try {
        const res = await listPublicPartyPackagesApi();
        setPackages(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to load party packages:", error);
        setPackages([]);
      } finally {
        setLoadingPackages(false);
      }
    };

    loadPackages();
  }, []);

  const featuredPackageId = useMemo(() => {
    const featured = packages.find((pkg) => pkg.is_featured);
    return featured?.id || null;
  }, [packages]);

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

          {loadingPackages ? (
            <div className="partySectionDesc" style={{ textAlign: "center" }}>Loading packages...</div>
          ) : packages.length === 0 ? (
            <div className="partySectionDesc" style={{ textAlign: "center" }}>
              No active party packages available right now.
            </div>
          ) : (
            <div className="partyPackagesGrid">
              {packages.map((pkg, index) => {
                const isFeatured = pkg.id === featuredPackageId;
                const itemList = Array.isArray(pkg.features) ? pkg.features : [];

                return (
                  <div
                    key={pkg.id || index}
                    className={isFeatured ? "partyPackageCardFeatured" : "partyPackageCard"}
                  >
                    {isFeatured && pkg.badge_text ? (
                      <div className="partyPremiumBadge">{pkg.badge_text}</div>
                    ) : null}

                    <div className="partyPackageBadgeWrap">
                      <span
                        className={
                          isFeatured
                            ? "partyPackageBadgeFeatured"
                            : "partyPackageBadge"
                        }
                      >
                        {pkg.package_code || `Package ${String(index + 1).padStart(2, "0")}`}
                      </span>
                    </div>

                    <h3
                      className={
                        isFeatured
                          ? "partyPackageTitleFeatured"
                          : "partyPackageTitle"
                      }
                    >
                      {pkg.name}
                    </h3>

                    <div className={isFeatured ? "partyPriceWrapFeatured" : "partyPriceWrap"}>
                      <span className={isFeatured ? "partyPriceFeatured" : "partyPrice"}>
                        {formatMoney(pkg.price)}
                      </span>
                      <span className={isFeatured ? "partyCurrencyFeatured" : "partyCurrency"}>
                        LKR
                      </span>
                    </div>

                    <ul className={isFeatured ? "partyPackageListFeatured" : "partyPackageList"}>
                      {itemList.map((item, itemIndex) => (
                        <li key={`${pkg.id || index}-${itemIndex}`}>
                          <Check size={18} /> {item}
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={buildBookingLink(pkg)}
                      className={isFeatured ? "partyPackageBtnFeatured" : "partyPackageBtn"}
                    >
                      {`Book ${pkg.package_code || `Package ${String(index + 1).padStart(2, "0")}`}`}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
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