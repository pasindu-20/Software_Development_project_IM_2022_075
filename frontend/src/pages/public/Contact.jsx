import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { createInquiryApi } from "../../api/publicApi";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

const initialErrors = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

export default function Contact() {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState(initialErrors);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const normalizePhone = (value) => value.replace(/[\s-]/g, "");

  const validateField = (name, value) => {
    const trimmed = value.trim();

    switch (name) {
      case "name":
        if (!trimmed) return "Name is required";
        if (trimmed.length < 3) return "Name must be at least 3 characters";
        if (!/^[A-Za-z\s.'-]+$/.test(trimmed)) {
          return "Name can only contain letters, spaces, apostrophes, dots, and hyphens";
        }
        return "";

      case "email":
        if (!trimmed) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return "Enter a valid email address";
        }
        return "";

      case "phone": {
        if (!trimmed) return "Phone number is required";
        const cleaned = normalizePhone(trimmed);
        if (!/^(?:0\d{9}|\+94\d{9}|94\d{9})$/.test(cleaned)) {
          return "Enter a valid Sri Lankan phone number";
        }
        return "";
      }

      case "message":
        if (!trimmed) return "Message is required";
        if (trimmed.length < 10) return "Message must be at least 10 characters";
        return "";

      default:
        return "";
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: validateField("name", formData.name),
      email: validateField("email", formData.email),
      phone: validateField("phone", formData.phone),
      message: validateField("message", formData.message),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((value) => value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const cleanedValue =
      name === "phone" ? value.replace(/[^0-9+\s-]/g, "") : value;

    setFormData((prev) => ({
      ...prev,
      [name]: cleanedValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setErr("");
    setInfo("");
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!validateForm()) {
      setErr("Please fix the highlighted fields.");
      return;
    }

    setBusy(true);
    try {
      await createInquiryApi({
        customer_name: formData.name.trim(),
        email: formData.email.trim(),
        phone: normalizePhone(formData.phone.trim()),
        inquiry_type: "WEBSITE",
        message: formData.message.trim(),
        preferred_program_id: null,
      });

      setInfo("Thank you for contacting us! We will get back to you soon.");
      setFormData(initialFormData);
      setErrors(initialErrors);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to submit inquiry");
    } finally {
      setBusy(false);
    }
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

      <section className="contactSection">
        <div className="contactGrid">
          <div className="contactInfoColumn">
            <div>
              <h2 className="contactSectionTitle">Contact Information</h2>
              <p className="contactSectionDesc">
                Reach out to us through any of the following channels. We're here to help.
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
                  <p className="contactInfoText">Monday - Friday: 9:00 AM - 8:00 PM</p>
                  <p className="contactInfoText">Saturday - Sunday: 10:00 AM - 7:00 PM</p>
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

          <div className="contactFormColumn">
            <div className="contactFormCard">
              <h2 className="contactSectionTitle">Send Us a Message</h2>

              {err ? (
                <div
                  className="kidCard"
                  style={{ padding: 12, color: "#b00020", marginBottom: 12 }}
                >
                  {err}
                </div>
              ) : null}

              {info ? (
                <div
                  className="kidCard"
                  style={{ padding: 12, color: "#0a6b2b", marginBottom: 12 }}
                >
                  {info}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="contactForm" noValidate>
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
                    onBlur={handleBlur}
                    placeholder="Enter your full name"
                    maxLength={100}
                    required
                    className={`contactInput ${errors.name ? "contactInputError" : ""}`}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name ? (
                    <small className="contactFieldError">{errors.name}</small>
                  ) : null}
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
                      onBlur={handleBlur}
                      placeholder="your@email.com"
                      maxLength={120}
                      required
                      className={`contactInput ${errors.email ? "contactInputError" : ""}`}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email ? (
                      <small className="contactFieldError">{errors.email}</small>
                    ) : null}
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
                      onBlur={handleBlur}
                      placeholder="0771234567"
                      maxLength={15}
                      required
                      className={`contactInput ${errors.phone ? "contactInputError" : ""}`}
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone ? (
                      <small className="contactFieldError">{errors.phone}</small>
                    ) : null}
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
                    onBlur={handleBlur}
                    placeholder="Tell us how we can help you..."
                    rows={6}
                    maxLength={500}
                    required
                    className={`contactTextarea ${errors.message ? "contactTextareaError" : ""}`}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message ? (
                    <small className="contactFieldError">{errors.message}</small>
                  ) : null}
                </div>

                <button type="submit" className="contactSubmitBtn" disabled={busy}>
                  {busy ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="contactFaqSection">
        <div className="contactFaqContainer">
          <div className="contactFaqHeader">
            <h2 className="contactSectionTitle">Frequently Asked Questions</h2>
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