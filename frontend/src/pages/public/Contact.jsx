// frontend/src/pages/public/Contact.jsx
import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Contact form submitted:", formData);
    alert("Thank you for contacting us! We will get back to you soon.");
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: "",
    });
  };

  const faqs = [
    {
      question: "What age groups do you cater to?",
      answer:
        "We welcome children from 1 to 14 years old, with age-appropriate zones and activities.",
    },
    {
      question: "Do I need to book in advance?",
      answer:
        "For play area visits, walk-ins are welcome. However, we recommend booking for parties and classes.",
    },
    {
      question: "What safety measures are in place?",
      answer:
        "We have CCTV monitoring, trained staff, regular equipment sanitization, and strict safety protocols.",
    },
    {
      question: "Can parents stay with their children?",
      answer:
        "Yes! Parents are welcome to stay and supervise their children during play time.",
    },
  ];

  return (
    <div className="contactPage">
      {/* Hero Section */}
      <section className="contactHero">
        <div className="contactHeroContainer">
          <div className="contactHeroContent">
            <span className="contactBadge">Get In Touch</span>
            <h1 className="contactHeroTitle">Contact Us</h1>
            <p className="contactHeroDesc">
              Have questions? We'd love to hear from you. Send us a message and
              we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="contactSection">
        <div className="contactGrid">
          {/* Left */}
          <div className="contactInfoColumn">
            <div>
              <h2 className="contactSectionTitle">Contact Information</h2>
              <p className="contactSectionDesc">
                Reach out to us through any of the following channels. We're
                here to help.
              </p>
            </div>

            <div className="contactInfoList">
              <div className="contactInfoItem">
                <div className="contactIconBox">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="contactInfoTitle">Address</h3>
                  <p className="contactInfoText">
                    Poddo Play House
                    <br />
                    Visit our location using the map link below
                  </p>
                </div>
              </div>

              <div className="contactInfoItem">
                <div className="contactIconBox">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="contactInfoTitle">Phone</h3>
                  <p className="contactInfoText">0751179443</p>
                  
                </div>
              </div>

              <div className="contactInfoItem">
                <div className="contactIconBox">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="contactInfoTitle">Email</h3>
                  <p className="contactInfoText">hello@poddoplayhouse.com</p>
                  <p className="contactInfoText">info@poddoplayhouse.com</p>
                </div>
              </div>

              <div className="contactInfoItem">
                <div className="contactIconBox">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="contactInfoTitle">Operating Hours</h3>
                  <p className="contactInfoText">
                    Monday - Friday: 9:00 AM - 8:00 PM
                  </p>
                  <p className="contactInfoText">
                    Saturday - Sunday: 10:00 AM - 7:00 PM
                  </p>
                </div>
              </div>
            </div>

            <div className="contactMapCard">
  <iframe
    src="https://www.google.com/maps?q=6.904469,79.909818&z=15&output=embed"
    title="Poddo Play House Location"
    className="contactMapFrame"
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  ></iframe>
</div>
          </div>

          {/* Right */}
          <div className="contactFormColumn">
            <div className="contactFormCard">
              <h2 className="contactSectionTitle">Send Us a Message</h2>

              <form onSubmit={handleSubmit} className="contactForm">
                <div className="contactFieldGroup">
                  <label htmlFor="name" className="contactLabel">
                    Your Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    className="contactInput"
                  />
                </div>

                <div className="contactFormTwoCol">
                  <div className="contactFieldGroup">
                    <label htmlFor="email" className="contactLabel">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      required
                      className="contactInput"
                    />
                  </div>

                  <div className="contactFieldGroup">
                    <label htmlFor="phone" className="contactLabel">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0751179443"
                      required
                      className="contactInput"
                    />
                  </div>
                </div>

                <div className="contactFieldGroup">
                  <label htmlFor="message" className="contactLabel">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us how we can help you..."
                    rows={6}
                    required
                    className="contactTextarea"
                  />
                </div>

                <button type="submit" className="contactSubmitBtn">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="contactFaqSection">
        <div className="contactFaqContainer">
          <div className="contactFaqHeader">
            <h2 className="contactSectionTitle">
              Frequently Asked Questions
            </h2>
            <p className="contactSectionDesc">
              Quick answers to common questions about Poddo Play House.
            </p>
          </div>

          <div className="contactFaqGrid">
            {faqs.map((faq, index) => (
              <div key={index} className="contactFaqCard">
                <h3 className="contactFaqQuestion">{faq.question}</h3>
                <p className="contactFaqAnswer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}