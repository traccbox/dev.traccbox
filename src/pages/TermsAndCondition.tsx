import Navbar from "@/components/Navbar";
import React from "react";

const terms = [
  {
    title: "INTRODUCTION",
    subtitle: "Welcome to TraccBOX (“Company”, “we”, “our”, or “us”).",
    description:
      "These Terms and Conditions (“Terms”) govern your access to and use of TraccBOX’s:",
    terms: [
      "Web platform",
      "Mobile applications",
      "APIs and integrations",
      "Related services (collectively, the “Services”)",
    ],
    summary:
      "By accessing or using the Services, you agree to be bound by these Terms. If you do not agree, you must immediately discontinue use of the Services.",
  },
  {
    title: "ELIGIBILITY",
    subtitle: "To use TraccBOX, you must:",
    description: "",
    terms: [
      "Be at least 18 years old",
      "Have the legal capacity to enter into a binding agreement",
      "Where applicable, act on behalf of a duly registered organization",
    ],
    summary:
      "By using the Services, you represent and warrant that you meet these requirements.",
  },
  {
    title: "ACCOUNT REGISTRATION AND SECURITY",
    subtitle: "To access the Services, you are required to:",
    description: "",
    terms: [
      "Provide accurate, current, and complete information",
      "Maintain and promptly update your account details",
      "Safeguard login credentials and restrict unauthorized access",
    ],
    summary:
      "You are solely responsible for all activities conducted under your account. You must notify us immediately of any suspected unauthorized use or security breach.",
  },
  {
    title: "ACCEPTABLE USE",
    subtitle:
      "You agree to use TraccBOX strictly for lawful business purposes.",
    description: "You shall not:",
    terms: [
      "Engage in illegal, fraudulent, or deceptive activities",
      "Interfere with or disrupt the integrity or performance of the platform",
      "Attempt unauthorized access to systems, accounts, or data",
      "Reverse engineer, duplicate, copy, sell, or exploit any portion of the Services",
    ],
    summary:
      "We reserve the right to investigate and take appropriate action for violations.",
  },
];

const subscription = [
  {
    title: "6. SUBSCRIPTION, BILLING, AND PAYMENTS",
    options: [
      {
        subtitle: "6.1 Subscription Model",
        description:
          "TraccBOX operates on a subscription basis. Pricing and plans may be updated periodically with prior notice.",
        terms: [],
      },
      {
        subtitle: "6.2 Payment Terms",
        description: "",
        terms: [
          "Fees are billed in advance on a recurring basis",
          "Payments may be processed via authorized third-party payment providers",
          "You agree to provide valid and up-to-date payment details",
        ],
      },
      {
        subtitle: "6.3 Suspension for Non-Payment",
        description: "Failure to make payment may result in:",
        terms: [
          "Suspension of access",
          "Restriction of features",
          "Termination of account",
        ],
      },
      {
        subtitle: "6.4 Refunds",
        description:
          "All payments are non-refundable except where required by applicable law or expressly agreed in writing.",
        terms: [],
      },
    ],
  },
];

const data = [
  {
    title: "DATA PROTECTION AND PRIVACY",
    subtitle: "Your use of the Services is subject to our Privacy Policy.",
    description: "You acknowledge and agree that:",
    terms: [
      "We may collect, process, and store data in accordance with applicable laws",
      "Organizations may access employee-related operational data",

      "You are responsible for obtaining any required employee or user consent",
    ],
    summary: "",
  },
  {
    title: "INTELLECTUAL PROPERTY RIGHTS",
    subtitle:
      "All rights, title, and interest in and to the Services, including but not limited to:",
    description: "You acknowledge and agree that:",
    terms: [
      "Software and codebase",
      "Platform architecture",
      "Features, designs, and trademarks",
    ],
    summary:
      "remain the exclusive property of TraccBOX.\n You are granted a limited, non-exclusive, non-transferable, and revocable license to use the Services.",
  },
];
const thirdParty = [
  {
    title: "SERVICE AVAILABILITY",
    subtitle:
      "While we strive for high system availability, we do not guarantee uninterrupted or errorfree service.",
    description: "We reserve the right to:",
    terms: [
      "Perform scheduled or emergency maintenance",
      "Modify or discontinue features",
      "Temporarily suspend access where necessary",
    ],
    summary: "",
  },
  {
    title: "THIRD-PARTY INTEGRATIONS",
    subtitle:
      "The Services may integrate with third-party platforms (e.g., payment gateways, CRM tools).",
    description: "TraccBOX is not responsible for:",
    terms: [
      "The availability or performance of third-party services",
      "Third-party data handling, security, or privacy practices",
    ],
    summary: "Use of such services is at your own risk.",
  },
  {
    title: "LIMITATION OF LIABILITY",
    subtitle: "To the fullest extent permitted under applicable law:",
    description: "TraccBOX shall not be liable for:",
    terms: [
      "Indirect, incidental, or consequential damages",
      "Loss of profits, revenue, data, or business opportunities",
      "Service interruptions beyond reasonable control",
    ],
    summary:
      "Our total aggregate liability shall not exceed the total fees paid by you in the preceding three (3) months.",
  },
  {
    title: "INDEMNIFICATION",
    subtitle:
      "You agree to indemnify, defend, and hold harmless TraccBOX, its officers, employees, and partners from any claims, damages, or liabilities arising from:",
    description: "",
    terms: [
      "Your misuse of the Services",
      "Violation of these Terms",
      "Breach of applicable laws or regulations",
    ],
    summary: "",
  },
  {
    title: "TERMINATION",
    subtitle: "We reserve the right to suspend or terminate your access where:",
    description: "",
    terms: [
      "You breach these Terms",
      "Payment obligations are not fulfilled",
      "Required by applicable law",
    ],
    summary: "You may terminate your account at any time. \n Upon termination:",
    conditions: [
      "Access to Services will cease immediately",
      "Data may be retained temporarily and deleted in accordance with our retention policy",
    ],
  },
  {
    title: "CONFIDENTIALITY",
    subtitle: "Both parties agree to:",
    description: "",
    terms: [
      "Protect confidential and proprietary information",
      "Not disclose sensitive business, operational, or technical data without authorization",
    ],
    summary: "These obligations shall survive termination of this agreement.",
  },
  {
    title: "GOVERNING LAW AND JURISDICTION",
    subtitle:
      "These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.",
    description:
      "All disputes shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.",
    terms: [],
    summary: "",
  },
  {
    title: "AMENDMENTS",
    subtitle:
      "We reserve the right to update or modify these Terms at any time.",
    description: "Such updates will be communicated via:",
    terms: ["Email notifications", "In-platform announcements"],
    summary:
      "Continued use of the Services constitutes acceptance of the revised Terms.",
  },
  {
    title: "FORCE MAJEURE",
    subtitle:
      "We shall not be liable for any delay or failure in performance resulting from events beyond our reasonable control, including but not limited to:",
    description: "",
    terms: [
      "Natural disasters",
      "Internet or infrastructure failures",
      "Government actions or regulations",
    ],
    summary: "",
  },
  {
    title: "CONTACT INFORMATION",
    subtitle: "TraccBOX Support Team",
    description:
      "Adebola House (Suite 100, Rear Wing) \n 38 Opebi Road, Ikeja, Lagos, Nigeria \nEmail: hello@traccbox.com",
    terms: [],
    summary: "",
  },
  {
    title: "ENTIRE AGREEMENT",
    subtitle:
      "These Terms constitute the entire agreement between you and TraccBOX regarding the use of the Services and supersede all prior agreements or understandings.",
    description: "",
    terms: [],
    summary: "",
  },
];

export default function TermsAndCondition() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="w-full py-32 flex flex-col justify-start items-center h-full">
        <div className=" w-[92%] sm:w-4/5 md:w-[60%] bg-gray-50 p-10 shadow-2xl rounded-2xl mx-auto  ">
          <h1 className="text-traccbox-500 text-center text-4xl mb-5">
            Terms and Conditions
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

            <div className="space-y-2">
              <h2 className="text-xl">
                5. ORGANIZATIONAL USE AND ADMINISTRATIVE CONTROL
              </h2>
              <p>Where TraccBOX is used within an organization:</p>
              {/* <p>{term.description}</p> */}
              <ul className="list-disc  pl-12">
                <li>The organization retains primary control of the account</li>
                <li>Authorized administrators may:</li>
                <ul className=" pl-5 mt-2 text-sm space-y-3">
                  <li className="flex justify-start items-center gap-3">
                    <span>
                      <img src="circle.png" className="w-3 h-3" alt="" />
                    </span>{" "}
                    Access employee-related data
                  </li>
                  <li className="flex justify-start items-center gap-3">
                    <span>
                      <img src="circle.png" className="w-3 h-3" alt="" />
                    </span>{" "}
                    Assign roles and permissions
                  </li>
                  <li className="flex justify-start items-center gap-3">
                    <span>
                      <img src="circle.png" className="w-3 h-3" alt="" />
                    </span>{" "}
                    Monitor usage, activity, and performance metrics
                  </li>
                </ul>
              </ul>
              <p>
                By using the platform, employees acknowledge and consent to such
                access and monitoring by their employer.
              </p>
            </div>

            {/* Subscriptions */}
            {subscription.map((term, index) => (
              <div key={term.title} className="space-y-3">
                <h2 className="text-xl">{term.title}</h2>

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

            {/* Data privacy */}
            {data.map((term, index) => (
              <div key={term.title} className="space-y-2">
                <h2 className="text-xl">
                  {index + 7}. {term.title}
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

            {/* number 9 */}
            <div className="space-y-2">
              <h2 className="text-xl">9. DATA OWNERSHIP</h2>

              <ul className="list-disc  pl-12">
                <li>
                  Organizations retain ownership of their proprietary business
                  data
                </li>
                <li>TraccBOX retains ownership of:</li>
                <ul className=" pl-5 mt-2 text-sm space-y-3">
                  <li className="flex justify-start items-center gap-3">
                    <span>
                      <img src="circle.png" className="w-3 h-3" alt="" />
                    </span>{" "}
                    Platform infrastructure
                  </li>
                  <li className="flex justify-start items-center gap-3">
                    <span>
                      <img src="circle.png" className="w-3 h-3" alt="" />
                    </span>{" "}
                    System design and architecture
                  </li>
                  <li className="flex justify-start items-center gap-3">
                    <span>
                      <img src="circle.png" className="w-3 h-3" alt="" />
                    </span>{" "}
                    Aggregated and anonymized data used for analytics and
                    service improvement
                  </li>
                </ul>
              </ul>
              <p>
                By using the platform, employees acknowledge and consent to such
                access and monitoring by their employer.
              </p>
            </div>

            {/* third party blah blah  */}
            {thirdParty.map((term, index) => (
              <div key={term.title} className="space-y-2">
                <h2 className="text-xl">
                  {index + 10}. {term.title}
                </h2>
                <p>{term.subtitle}</p>
                <p>{term.description}</p>
                <ul className="list-disc space-y-3  pl-12">
                  {term.terms.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
                <p>{term.summary}</p>
                {term.conditions && (
                  <ul className="list-disc space-y-3  pl-12">
                    {term.conditions.map((condition, index) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <h2>© 2026TraccBOX. All rights reserved.</h2>
          </div>
        </div>
      </main>
    </div>
  );
}
