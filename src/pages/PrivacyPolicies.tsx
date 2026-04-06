import Navbar from "@/components/Navbar";
import React from "react";

const terms = [
  {
    title: "INTRODUCTION",
    subtitle:
      "Welcome to **TraccBOX** (“Company”, “we”, “our”, “us”).TraccBOX is a Software-as-a-Service (SaaS) platform designed to provide workforce management, sales tracking, inventory management, and analytics solutions. This Privacy Policy explains how we collect,use, disclose, and safeguard your information when you use:",
    description: "",
    terms: [
      "Our web platform",
      "Mobile applications",
      "APIs and integrations",
      "Any related services (collectively, the “Services”)",
    ],
    summary:
      "By using TraccBOX, you agree to the terms of this Privacy Policy.",
  },
];
const info = [
  {
    title: "HOW WE USE YOUR INFORMATION",
    subtitle: "We use collected information to:",
    description: "",
    terms: [
      "Provide and operate our Services",
      "Manage user accounts and onboarding",
      "Track attendance and workforce performance",
      "Enable GPS-based clock-in/out functionality",
      "Generate analytics and reports",
      "Improve system performance and user experience",
      "Process payments and subscriptions",
      "Communicate updates, alerts, and support messages",
      "Ensure security and prevent fraud",
    ],
    summary: "",
  },
  {
    title: "LEGAL BASIS FOR PROCESSING",
    subtitle: "We process your data based on:",
    description: "",
    terms: [
      "Consent (e.g., location tracking)",
      "Contractual necessity (to provide services)",
      "Legal obligations",
      "Legitimate business interests (analytics, improvements)",
    ],
    summary: "",
  },
];
const dataRetention = [
  {
    title: "DATA RETENTION",
    subtitle: "We retain your data only as long as necessary to:",
    description: "",
    terms: [
      "Provide services",
      "Fulfill legal and contractual obligations",
      "Resolve disputes",
      "Enforce agreements",
    ],
    summary:
      "Organizations may control retention of employee data within their accounts.",
  },
  {
    title: "DATA SECURITY",
    subtitle: "We implement industry-standard security measures including:",
    description: "",
    terms: [
      "Encryption (SSL/TLS)",
      "Secure servers and firewalls",
      "Role-based access control",
      "Authentication and authorization mechanisms",
    ],
    summary:
      "However, no system is 100% secure. Users are responsible for safeguarding login credentials.",
  },
  {
    title: "YOUR RIGHTS",
    subtitle: "Depending on your jurisdiction, you may have rights to:",
    description: "",
    terms: [
      "Access your data",
      "Correct inaccurate information",
      "Request deletion of your data",
      "Restrict or object to processing",
      "Withdraw consent (e.g., location tracking)",
      "Request data portability.",
    ],
    summary: "To exercise your rights, contact us at: hello@traccbox.com",
  },
  {
    title: "COOKIES & TRACKING TECHNOLOGIES",
    subtitle: "We use cookies and similar technologies to:",
    description: "",
    terms: [
      "Improve user experience",
      "Analyze platform usage",
      "Maintain session authentication",
    ],
    summary: "You can manage cookie preferences via your browser settings.",
  },
  {
    title: "THIRD-PARTY LINKS & INTEGRATIONS",
    subtitle: "TraccBOX may integrate with third-party platforms such as:",
    description: "",
    terms: ["E-commerce platforms", "CRM systems", "Payment processors"],
    summary:
      "We are not responsible for the privacy practices of third-party services.",
  },
  {
    title: "CHILDREN’S PRIVACY",
    subtitle: "TraccBOX is not intended for individuals under the age of 18.",
    description: "We do not knowingly collect data from children.",
    terms: [],
    summary: "",
  },
  {
    title: "INTERNATIONAL DATA TRANSFERS",
    subtitle:
      "TYour data may be processed and stored outside your country of residence.",
    description:
      "We ensure appropriate safeguards are in place for such transfers.",
    terms: [],
    summary: "",
  },
  {
    title: "CHANGES TO THIS POLICY",
    subtitle: "We may update this Privacy Policy from time to time.",
    description: "Updates will be communicated via:",
    terms: ["Email notifications", "Platform announcements"],
    summary: "Continued use of the platform constitutes acceptance of updates.",
  },
  {
    title: "CONTACT US",
    subtitle: "We may update this Privacy Policy from time to time.",
    description: "For questions, concerns, or data requests, contact:",
    terms: [],
    summary:
      "TraccBOX Support Team \nEmail: hello@traccbox.com \nAddress: Adebola House (Suite 100, Rear Wing),\n38 Opebi Road, Ikeja, Lagos, Nigeria",
  },
  {
    title: "CONSENT",
    subtitle:
      "By using TraccBOX, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.",
    description: "",
    terms: [],
    summary: "",
  },
];

const subscription = [
  {
    title: "2. INFORMATION WE COLLECT",
    body: "INFORMATION WE COLLECT",
    options: [
      {
        subtitle: "2.1 Personal Information",
        description: "",
        terms: [
          "Full name",
          "Emai address",
          "Phone Number",
          "Job title/role",
          "Company details",
        ],
      },
      {
        subtitle: "2.2 Employee & Workforce Data",
        description: "",
        terms: [
          "Attendance records (clock-in/out times)",
          "GPS/location data (if enabled)",
          "Task assignments and performance data",
          "QR code or staff ID records",
        ],
      },
      {
        subtitle: "2.3 Device & Technical Data",
        description: "",
        terms: [
          "IP address",
          "Device type and operating system",
          "Browser type",
          "App usage, data and logs",
        ],
      },
      {
        subtitle: "2.4 Financial & Subscription Data",
        description: "",
        terms: [
          "Payment details (processed via third-party providers)",
          "Subscription plans and billing history",
        ],
      },
      {
        subtitle: "2.5 Location Data",
        description:
          "If enabled, we may collect real-time or periodic GPS location data for:",
        terms: [
          "Attendance verification",
          "Field staff tracking",
          "Task monitoring",
        ],
      },
    ],
  },
];

const dataSharing = [
  {
    title: "5. DATA SHARING & DISCLOSURE",
    body: "We do not sell your personal data. \nWe may share your data with:",
    options: [
      {
        subtitle: "5.1 Service Providers",
        description: "",
        terms: [
          "Payment gateways (e.g., Stripe, Paystack, Flutterwave)",
          "Cloud hosting providers",
          "Analytics tools",
        ],
      },
      {
        subtitle: "5.2 Employers / Organizations",
        description:
          "If you are using TraccBOX under an organization:\n Your employer/admin can access your work-related data",
        terms: ["This includes attendance, performance, and task records"],
      },
      {
        subtitle: "5.3 Legal Authorities",
        description: "We may disclose data if required to:",
        terms: [
          "Comply with laws or regulations",
          "Respond to legal requests",
          "Protect rights, safety, or property",
        ],
      },
    ],
  },
];

export default function PrivacyPolicies() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="w-full py-32 flex flex-col justify-start items-center h-full">
        <div className=" w-[92%] sm:w-4/5 md:w-[60%] bg-gray-50 p-10 shadow-2xl rounded-2xl mx-auto  ">
          <h1 className="text-traccbox-500 text-center text-4xl mb-5">
            Privacy Policies
          </h1>

          <div className="space-y-10 text-traccbox-800">
            {terms.map((term, index) => (
              <div key={term.title} className="space-y-2">
                <h2 className="text-xl">
                  {index + 1}. {term.title}
                </h2>
                <p>{term.subtitle}</p>
                <p>{term.description}</p>
                <ul className="list-disc space-y-3  pl-12">
                  {term.terms.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
                <p>{term.summary}</p>
              </div>
            ))}

            {/* Subscriptions */}
            {subscription.map((term, index) => (
              <div key={term.title} className="space-y-3">
                <h2 className="text-xl">{term.title}</h2>
                <p>{term.body}</p>

                {term.options.map((option, index) => (
                  <React.Fragment key={index}>
                    <h3>{option.subtitle}</h3>
                    <p>{option.description}</p>
                    <ul className="list-disc space-y-3  pl-12">
                      {option.terms.map((term, index) => (
                        <li key={index}>{term}</li>
                      ))}
                    </ul>
                  </React.Fragment>
                ))}
              </div>
            ))}

            {/* How we use your information */}
            {info.map((term, index) => (
              <div key={term.title} className="space-y-2">
                <h2 className="text-xl">
                  {index + 3}. {term.title}
                </h2>
                <p>{term.subtitle}</p>
                <p>{term.description}</p>
                <ul className="list-disc space-y-3  pl-12">
                  {term.terms.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
                <p>{term.summary}</p>
              </div>
            ))}

            {/* DataSharing */}
            {dataSharing.map((term, index) => (
              <div key={term.title} className="space-y-3">
                <h2 className="text-xl">{term.title}</h2>
                <p>{term.body}</p>

                {term.options.map((option, index) => (
                  <React.Fragment key={index}>
                    <h3>{option.subtitle}</h3>
                    <p>{option.description}</p>
                    <ul className="list-disc space-y-3  pl-12">
                      {option.terms.map((term, index) => (
                        <li key={index}>{term}</li>
                      ))}
                    </ul>
                  </React.Fragment>
                ))}
              </div>
            ))}

            {/* Data Retention */}
            {dataRetention.map((term, index) => (
              <div key={term.title} className="space-y-2">
                <h2 className="text-xl">
                  {index + 6}. {term.title}
                </h2>
                <p>{term.subtitle}</p>
                <p>{term.description}</p>
                <ul className="list-disc space-y-3  pl-12">
                  {term.terms.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
                <p>{term.summary}</p>
              </div>
            ))}
            <h2>© 2026TraccBOX. All rights reserved.</h2>
          </div>
        </div>
      </main>
    </div>
  );
}
