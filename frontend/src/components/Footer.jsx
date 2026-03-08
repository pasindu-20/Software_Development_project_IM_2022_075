import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footerContainer">
                <div className="footerGrid">
                    <div className="footerBrand">
                        <Link to="/" className="footerLogo">
                            <div className="footerLogoIcon">
                                <span className="brandIcon">
                                    <img
                                        src="profile.png"
                                        width="44"
                                        style={{ borderRadius: "5px", border: "2px solid #f8a7eb"  }}
                                        alt="Profile"
                                    />
                                </span>
                            </div>
                            <span className="footerLogoText">Poddo Play House</span>
                        </Link>
                        <p className="footerDescription">
                            A magical place where children learn, play, and grow together.
                        </p>
                    </div>

                    <div>
                        <h4 className="footerTitle">Quick Links</h4>
                        <ul className="footerList">
                            <li><Link to="/" className="footerLink">Home</Link></li>
                            <li><Link to="/about" className="footerLink">About Us</Link></li>
                            <li><Link to="/contact" className="footerLink">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="footerTitle">Services</h4>
                        <ul className="footerList">
                            <li><Link to="/play-area" className="footerLink">Play Area</Link></li>
                            <li><Link to="/party-packages" className="footerLink">Party Area</Link></li>
                            <li><Link to="/classes" className="footerLink">Classes</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="footerTitle">Contact Us</h4>
                        <ul className="footerContactList">
                            <li className="footerContactItem">
                                <MapPin size={16} className="footerIcon" />
                                <span>161/2 Sri Gnanendra Mawatha , Nawala, Sri Lanka</span>
                            </li>
                            <li className="footerContactItem">
                                <Phone size={16} className="footerIcon" />
                                <span>075 117 9443</span>
                            </li>
                            <li className="footerContactItem">
                                <Mail size={16} className="footerIcon" />
                                <span>hello@poddoplayhouse.com</span>
                            </li>
                        </ul>

                        <div className="footerSocial">
                            <a href="#" className="footerSocialLink"><Facebook size={16} /></a>
                            <a href="#" className="footerSocialLink"><Instagram size={16} /></a>
                            <a href="#" className="footerSocialLink"><Twitter size={16} /></a>
                        </div>
                    </div>
                </div>

                <div className="footerBottom">
                    <p>© {new Date().getFullYear()} Poddo Play House. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}