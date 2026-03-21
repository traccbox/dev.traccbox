import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, CheckCircle2, XCircle, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const companySizes = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
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

const WaitlistSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
    phone: "",
    companySize: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard: ensure companySize is selected (not covered by native required)
    if (!formData.companySize) {
      setModal({
        open: true,
        type: "error",
        title: "Missing Field",
        message: "Please select your company size before submitting.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const form = new FormData();
      form.append("type", "waitlist");
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("companyName", formData.companyName);
      form.append("phone", formData.phone);
      form.append("companySize", formData.companySize);

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
        setFormData({ name: "", email: "", companyName: "", phone: "", companySize: "" });
        setModal({
          open: true,
          type: "success",
          title: "You're on the waitlist! 🎉",
          message:
            "We've sent a confirmation to your email. We'll reach out as soon as your spot is ready.",
        });
      } else {
        throw new Error(data.message || "Failed to join waitlist.");
      }
    } catch (error) {
      console.error("Waitlist form error:", error);
      setModal({
        open: true,
        type: "error",
        title: "Submission Failed",
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

      <section id="waitlist" className="py-24 bg-blue-wave-bottom bg-no-repeat bg-top bg-cover">
        <div className="container mx-auto px-4">
          <div
            className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden"
            data-aos="fade-up"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left panel */}
              <div
                className="bg-gradient-to-br from-traccbox-500 to-traccbox-700 p-8 text-white"
                data-aos="zoom-in"
              >
                <div className="flex items-center mb-6">
                  <Sparkles className="mr-3" size={24} />
                  <h3 className="text-2xl font-bold">Join the Waitlist</h3>
                </div>

                <p className="mb-6 opacity-90">
                  Be among the first to experience how TraccBox transforms field
                  sales operations. Secure your spot today.
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    "Get early access before the public launch",
                    "Receive exclusive onboarding support from our team",
                    "Lock in founding member pricing",
                  ].map((text) => (
                    <div key={text} className="flex items-start">
                      <div className="bg-white/20 rounded-full p-1 mr-3 mt-1">
                        <span className="block w-2 h-2 bg-white rounded-full" />
                      </div>
                      <p>{text}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white/10 p-4 rounded-lg">
                  <p className="text-sm opacity-80">
                    "Joining the waitlist was the best decision — TraccBox
                    solved challenges we didn't even know we had."
                  </p>
                  <p className="font-medium mt-2">— Victor Moses, Sales Director</p>
                </div>
              </div>

              {/* Right panel */}
              <div className="p-8" data-aos="zoom-in">
                <h4 className="text-xl font-semibold mb-6">Reserve Your Spot</h4>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                      Company Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@company.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="companyName" className="block text-gray-700 font-medium mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Your company"
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
                    <label htmlFor="companySize" className="block text-gray-700 font-medium mb-2">
                      Company Size <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.companySize}
                      onValueChange={(value) => handleSelectChange("companySize", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Company Size</SelectLabel>
                          {companySizes.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-traccbox-500 hover:bg-traccbox-600 text-white py-6 flex items-center justify-center gap-2"
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
                    {isLoading ? "Submitting..." : "Join Waitlist"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default WaitlistSection;