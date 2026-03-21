import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Phone, MessageSquare, Info, CheckCircle2, XCircle, X } from "lucide-react";

const faqs = [
  {
    question: "How does the 14-day free trial work?",
    answer:
      "Our free trial gives you full access to TraccBox for 14 days. No credit card is required to start. At the end of your trial, you can choose a subscription plan to continue using TraccBox.",
  },
  {
    question: "Do you offer custom integrations?",
    answer:
      "Yes, our Enterprise plan includes custom integrations with your existing tools and systems. Our team will work with you to ensure a smooth integration process.",
  },
  {
    question: "How many users can I add to my account?",
    answer:
      "There's no limit to the number of users you can add. Our pricing is per user, so you can scale your team as needed.",
  },
  {
    question: "Is my data secure with TraccBox?",
    answer:
      "Absolutely. TraccBox employs industry-standard encryption and security protocols to protect your data. We are GDPR compliant and regularly conduct security audits.",
  },
  {
    question: "Can I export my data from TraccBox?",
    answer:
      "Yes, you can export your data in various formats including CSV, Excel, and PDF. This makes it easy to use your data in other systems or for offline analysis.",
  },
];

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzu4JQ3jE7_eeexmRcKluG8umGuV0E4tTiLana-ZYVZcmpadeLNCglVE3gjzRfRd9k/exec";

type ModalState = {
  open: boolean;
  type: "success" | "error";
  title: string;
  message: string;
};

const StatusModal = ({
  modal,
  onClose,
}: {
  modal: ModalState;
  onClose: () => void;
}) => {
  if (!modal.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>

        {modal.type === "success" ? (
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="text-green-500" size={36} />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <XCircle className="text-red-500" size={36} />
          </div>
        )}

        <h3 className="text-xl font-bold text-gray-900 mb-2">{modal.title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{modal.message}</p>

        <Button
          onClick={onClose}
          className={`mt-6 w-full ${
            modal.type === "success"
              ? "bg-traccbox-500 hover:bg-traccbox-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          {modal.type === "success" ? "Got it!" : "Try Again"}
        </Button>
      </div>
    </div>
  );
};

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = new FormData();
      form.append("type", "contact");
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("message", formData.message);

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: form,
      });

      const text = await response.text();
      let data: { success: boolean; message?: string };
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: true };
      }

      if (data.success) {
        setFormData({ name: "", email: "", phone: "", message: "" });
        setModal({
          open: true,
          type: "success",
          title: "Message Sent! ✅",
          message:
            "Thanks for reaching out. Our team will get back to you within 24 hours.",
        });
      } else {
        throw new Error(data.message || "Failed to send message.");
      }
    } catch (error: any) {
      console.error("Contact form error:", error);
      setModal({
        open: true,
        type: "error",
        title: "Message Failed",
        message:
          error.message ||
          "Something went wrong. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusModal modal={modal} onClose={() => setModal((m) => ({ ...m, open: false }))} />

      <section id="contact" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              data-aos="fade-up"
            >
              Get in Touch
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto" data-aos="fade-up">
              Have questions about TraccBox? Our team is here to help you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Form */}
            <div className="bg-white rounded-xl p-8 shadow-md" data-aos="zoom-in">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <MessageSquare className="mr-2 text-traccbox-500" size={20} />
                Send us a message
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+234 800 000 0000"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    rows={4}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-traccbox-500 hover:bg-traccbox-600 text-white flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  {isLoading ? "Sending..." : "Send Message"}
                </Button>
              </form>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="flex items-center mb-4">
                  <Phone className="text-traccbox-500 mr-3" size={18} />
                  <span className="text-gray-700">Call us: +2348031100015</span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="text-traccbox-500 mr-3" size={18} />
                  <span className="text-gray-700">Email: support@traccbox.com</span>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div data-aos="zoom-in">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <Info className="mr-2 text-traccbox-500" size={20} />
                Frequently Asked Questions
              </h3>

              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="mt-6 bg-traccbox-50 p-4 rounded-lg border border-traccbox-100">
                <p className="text-gray-700">
                  Don't see your question here? Contact our support team and
                  we'll be happy to help.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactSection;