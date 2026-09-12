import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { updateCompanyInfo, UpdateCompanyPayload } from "@/api/auth";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { toast } from "sonner";
import { Camera, Edit, Loader2, Building2, Upload } from "lucide-react";

const industries = [
  "Technology",
  "Pharmaceutical",
  "Finance",
  "Insurance",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Consulting",
  "Other",
];

const currencies = ["NGN", "USD", "EUR", "GBP", "GHS", "KES", "ZAR"];

const GeneralSettings: React.FC = () => {
  const { user, setUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  console.log("user data: ", user)

  const getInitialState = () => ({
    company_name: user?.company_name || "",
    company_industry: user?.company_industry || "",
    phone_number: user?.phone_number || "",
    address: user?.address || "",
    city: user?.city || "",
    zip_code: user?.zip_code || "",
    country: user?.country || "",
    currency: user?.currency || "NGN",
    image_url: user?.image_url || user?.profile_pic || "",
  });

  const [company, setCompany] = useState(getInitialState);
  const [editCompany, setEditCompany] = useState(getInitialState);

  useEffect(() => {
    const updated = getInitialState();
    setCompany(updated);
    setEditCompany(updated);
    setPreviewUrl(updated.image_url);
  }, [user]);

  const handleEdit = () => {
    setEditCompany(company);
    setPreviewUrl(company.image_url);
    setLogoFile(null);
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditCompany(company);
    setPreviewUrl(company.image_url);
    setLogoFile(null);
  };

  // Directly trigger the hidden input — no state change before click
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setEditMode(true);
    }
    e.target.value = "";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditCompany((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User session invalid.");
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = editCompany.image_url;

      if (logoFile) {
        toast.info("Uploading company logo...");
        finalImageUrl = await uploadToCloudinary(logoFile);
      }

      const payload: UpdateCompanyPayload = {
        company_name: editCompany.company_name,
        company_industry: editCompany.company_industry,
        phone_number: editCompany.phone_number,
        address: editCompany.address,
        city: editCompany.city,
        zip_code: editCompany.zip_code,
        country: editCompany.country,
        currency: editCompany.currency,
        image_url: finalImageUrl,
      };

      await updateCompanyInfo(user.id, payload);

      toast.success("Company profile updated successfully!");

      const updatedState = { ...editCompany, image_url: finalImageUrl };
      setCompany(updatedState);
      setEditCompany(updatedState);

      if (setUser) {
        setUser({
          ...user,
          company_name: payload.company_name,
          company_industry: payload.company_industry,
          phone_number: payload.phone_number,
          address: payload.address,
          city: payload.city,
          zip_code: payload.zip_code,
          country: payload.country,
          currency: payload.currency,
          image_url: finalImageUrl,
          profile_pic: finalImageUrl,
        });
      }

      setEditMode(false);
      setLogoFile(null);
    } catch (error: any) {
      console.error("Save company error:", error);
      toast.error(
        error?.response?.data?.message ||
        error.message ||
        "Failed to update profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const data = editMode ? editCompany : company;

  const industriesList =
    industries.includes(data.company_industry) || !data.company_industry
      ? industries
      : [
        data.company_industry,
        ...industries.filter((i) => i !== data.company_industry),
      ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Company Profile Settings
          </h1>
          <p className="text-gray-500 text-sm">
            Manage your organization&apos;s public details, address, and
            branding
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border shadow-sm p-8 relative">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <span className="text-lg font-semibold flex items-center gap-2 text-gray-900">
            <Building2 className="w-5 h-5 text-blue-600" />
            Company Details
          </span>
          {!editMode && (
            <button
              className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4 text-gray-600" /> Edit Profile
            </button>
          )}
        </div>

        {/* Logo and Primary Fields */}
        <div className="flex flex-col sm:flex-row gap-8 mb-8">
          {/* Logo Section */}
          <div className="flex flex-col items-center sm:items-start">
            <span className="block text-xs font-semibold text-gray-700 mb-2">
              Company Logo
            </span>

            {/* Hidden file input — no id needed, driven by ref */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Logo preview box */}
            <button
              type="button"
              onClick={openFilePicker}
              className="relative group w-24 h-24 rounded-2xl bg-gray-100 border flex items-center justify-center overflow-hidden shadow-inner hover:border-blue-500 transition-colors focus:outline-none"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Company Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-10 h-10 text-gray-400" />
              )}
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">
                  {previewUrl ? "Change Logo" : "Upload Logo"}
                </span>
              </div>
            </button>

            {/* Text trigger below logo */}
            <button
              type="button"
              onClick={openFilePicker}
              className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
              {previewUrl ? "Change Logo" : "Upload Logo"}
            </button>
          </div>

          {/* Primary Form Fields */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75 text-gray-900"
                name="company_name"
                value={data.company_name}
                disabled={!editMode}
                onChange={handleChange}
                placeholder="Company Name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Industry
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75 text-gray-900"
                name="company_industry"
                value={data.company_industry}
                disabled={!editMode}
                onChange={handleChange}
              >
                <option value="">Select Industry</option>
                {industriesList.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Company Email (Account)
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                value={user?.email || ""}
                disabled
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75 text-gray-900"
                name="phone_number"
                value={data.phone_number}
                disabled={!editMode}
                onChange={handleChange}
                placeholder="+234..."
              />
            </div>
          </div>
        </div>

        {/* Location & Address Section */}
        <div className="pt-4 border-t">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">
            Address & Regional Info
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75 text-gray-900"
                name="address"
                value={data.address}
                disabled={!editMode}
                onChange={handleChange}
                placeholder="12 Alausa Way..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75 text-gray-900"
                name="city"
                value={data.city}
                disabled={!editMode}
                onChange={handleChange}
                placeholder="e.g. Ikeja"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Zip Code
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75 text-gray-900"
                name="zip_code"
                value={data.zip_code}
                disabled={!editMode}
                onChange={handleChange}
                placeholder="e.g. 100001"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75 text-gray-900"
                name="country"
                value={data.country}
                disabled={!editMode}
                onChange={handleChange}
                placeholder="e.g. Nigeria"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75 text-gray-900"
                name="currency"
                value={data.currency}
                disabled={!editMode}
                onChange={handleChange}
              >
                {currencies.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {editMode && (
          <div className="flex gap-3 mt-8 justify-end pt-4 border-t">
            <button
              type="button"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              onClick={handleSave}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralSettings;