import { useState, useEffect } from "react";
import {
  MapPin,
  User,
  AlertCircle,
  Calendar,
  Clock,
  Paperclip,
} from "lucide-react";
import { useStaffData } from "@/api/settingsApi/hooks/useStaffData";
import {
  useCreateTask,
  usePlaceSuggestions,
} from "@/api/field-Sales-repsApi/hooks";
import {
  TaskCreate,
  PlaceSuggestionResponse,
} from "@/api/field-Sales-repsApi/TaskService";
import LeafletMap from "@/components/maps/LeafletMap";
import { useAuth } from "@/components/auth/AuthProvider";
import {useNavigate } from "react-router-dom";

export default function TaskAssignment() {
  const { user } = useAuth();
  const companyId = user?.id;
  const navigate = useNavigate()
  // Fetch staff data
  const {
    data: staffData,
    isLoading: staffLoading,
    error: staffError,
  } = useStaffData(companyId);
  console.log("Fetched staff Data for task=", staffData);
  // Initialize mutations
  const createTaskMutation = useCreateTask();

  // Place suggestions hook
  const [placeInput, setPlaceInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const { data: placeSuggestions, isLoading: suggestionsLoading } =
    usePlaceSuggestions(placeInput);

  const [formData, setFormData] = useState({
    taskTitle: "",
    taskType: "",
    customerName: "",
    customerPhone: "+234 ",
    description: "",
    salesRepId: "",
    location: "",
    date: "",
    time: "",
    priority: "",
    attachment: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Get selected sales rep details from API data
  const selectedRep = formData.salesRepId
    ? staffData?.find((rep) => rep.id === formData.salesRepId)
    : null;

  console.log("Selected Rep=", selectedRep, formData.salesRepId);
  // Form validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.taskTitle.trim()) {
      newErrors.taskTitle = "Task title is required";
    }
    if (!formData.taskType) {
      newErrors.taskType = "Task type is required";
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }
    if (!formData.customerPhone.trim() || formData.customerPhone === "+234 ") {
      newErrors.customerPhone = "Customer phone is required";
    }
    if (!formData.salesRepId) {
      newErrors.salesRepId = "Sales representative is required";
    }
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.time) {
      newErrors.time = "Time is required";
    }
    if (!formData.priority) {
      newErrors.priority = "Priority is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Handle location input for place suggestions
    if (name === "location") {
      setPlaceInput(value);
      setShowSuggestions(value.length > 2);
    }
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, attachment: e.target.files[0] }));
  };

  // Handle location suggestion selection
  const handleLocationSelect = (suggestion: PlaceSuggestionResponse) => {
    setFormData((prev) => ({ ...prev, location: suggestion.description }));
    setSelectedLocation(suggestion.description);
    setShowSuggestions(false);
    setPlaceInput(suggestion.description);

    // Set coordinates if available
    //   if (suggestion.latitude && suggestion.longitude) {
    //     setSelectedCoordinates({
    //       latitude: suggestion.latitude,
    //       longitude: suggestion.longitude,
    //     });
    //   }
    // };
    if (!suggestion.latitude && !suggestion.longitude) {
      setSelectedCoordinates({
        latitude: 6.5244,
        longitude: 3.3792,
      });
    }
  };

  // Handle clicking outside suggestions to close dropdown
  const handleLocationBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Handle location input focus
  const handleLocationFocus = () => {
    if (placeInput.length > 2) {
      setShowSuggestions(true);
    }
  };

  const handleReset = () => {
    setFormData({
      taskTitle: "",
      taskType: "",
      customerName: "",
      customerPhone: "+234 ",
      description: "",
      salesRepId: "",
      location: "",
      date: "",
      time: "",
      priority: "",
      attachment: null,
    });
    setErrors({});
    setPlaceInput("");
    setSelectedLocation("");
    setSelectedCoordinates(null);
    setShowSuggestions(false);
    setSuccessMessage("");
  };

  const handleSaveDraft = () => {
    console.log("Saving draft...", formData);
    alert("Draft saved successfully!");
  };

  const handleAssignTask = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Map priority values to API format
      const priorityMap: Record<string, "important" | "normal" | "low"> = {
        high: "important",
        medium: "normal",
        low: "low",
      };

      const taskData: TaskCreate = {
        company_id: companyId,
        staff_id: formData.salesRepId,
        task_title: formData.taskTitle,
        task_type: formData.taskType,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        description: formData.description || null,
        location: formData.location || null,
        date: formData.date,
        time: formData.time || null,
        priority: priorityMap[formData.priority] || "normal",
        attachment: formData.attachment ? [formData.attachment.name] : null,
        status: "pending",
        // Include coordinates if available
        ...(selectedCoordinates && {
          latitude: selectedCoordinates.latitude,
          longitude: selectedCoordinates.longitude,
        }),
      };

      await createTaskMutation.mutateAsync(taskData);

      // Reset form on success
      handleReset();
      setSuccessMessage("Task assigned successfully!");
      navigate("/dashboard/field-reps/manage-task")

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error assigning task:", error);
      alert("Failed to assign task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assign Task</h1>
            <p className="text-sm text-gray-600">
              Create and assign a new task to your sales team
            </p>
          </div>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            + Add Staff
          </button>
        </div>

        {/* Error Display */}
        {staffError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">
                Error loading staff data:{" "}
                {staffError.message || "Failed to load staff members"}
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 text-green-600">✓</div>
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Task Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    name="taskTitle"
                    value={formData.taskTitle}
                    onChange={handleInputChange}
                    placeholder="Enter task title"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                      errors.taskTitle ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.taskTitle && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.taskTitle}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Type
                  </label>
                  <select
                    name="taskType"
                    value={formData.taskType}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                      errors.taskType ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select task type</option>
                    <option value="meeting">Meeting</option>
                    <option value="call">Call</option>
                    <option value="visit">Visit</option>
                    <option value="followup">Follow-up</option>
                  </select>
                  {errors.taskType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.taskType}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Information
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                      errors.customerName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.customerName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    placeholder="+234 9138691147"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                      errors.customerPhone
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.customerPhone && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.customerPhone}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter task description and any special requirements..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>

            {/* Assignment Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Assignment Details
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sales Representative <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                  <select
                    name="salesRepId"
                    value={formData.salesRepId}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white ${
                      errors.salesRepId ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={staffLoading}
                  >
                    <option value="">
                      {staffLoading
                        ? "Loading staff..."
                        : "Select sales representative"}
                    </option>
                    {staffData?.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.full_name} ({rep.role})
                      </option>
                    ))}
                  </select>
                  {errors.salesRepId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.salesRepId}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    onFocus={handleLocationFocus}
                    onBlur={handleLocationBlur}
                    placeholder="Enter address or search location..."
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                      errors.location ? "border-red-500" : "border-gray-300"
                    }`}
                  />

                  {/* Location Suggestions Dropdown */}
                  {showSuggestions &&
                    placeSuggestions?.status === "success" &&
                    placeSuggestions.suggestions?.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                        {suggestionsLoading && (
                          <div className="p-3 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="text-sm mt-1">
                              Loading suggestions...
                            </p>
                          </div>
                        )}
                        {placeSuggestions.suggestions.map(
                          (
                            suggestion: PlaceSuggestionResponse,
                            index: number
                          ) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleLocationSelect(suggestion)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-sm text-gray-700">
                                    {suggestion.description}
                                  </span>
                                  {(suggestion as PlaceSuggestionResponse)
                                    .latitude &&
                                    (suggestion as PlaceSuggestionResponse)
                                      .longitude && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        📍{" "}
                                        {(
                                          suggestion as PlaceSuggestionResponse
                                        ).latitude!.toFixed(4)}
                                        ,{" "}
                                        {(
                                          suggestion as PlaceSuggestionResponse
                                        ).longitude!.toFixed(4)}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </button>
                          )
                        )}
                      </div>
                    )}

                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                        errors.date ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                        errors.time ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.time && (
                      <p className="mt-1 text-sm text-red-600">{errors.time}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                      errors.priority ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  {errors.priority && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.priority}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachment
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Paperclip className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formData.attachment
                        ? formData.attachment.name
                        : "Choose file..."}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              {/* <button
                onClick={handleSaveDraft}
                className="px-6 py-2 border  border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Save Draft
              </button> */}
              <button
                onClick={handleAssignTask}
                disabled={isSubmitting || createTaskMutation.isPending}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || createTaskMutation.isPending
                  ? "Assigning..."
                  : "Assign Task"}
              </button>
            </div>
          </div>

          {/* Right Column - Preview & Representative Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Location Preview
              </h2>

              {formData.location ? (
                <div className="space-y-4">
                  {/* Leaflet Map Preview */}
                  <div
                    className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100"
                    style={{ height: "200px" }}
                  >
                    {selectedCoordinates ? (
                      <LeafletMap
                        latitude={selectedCoordinates.latitude}
                        longitude={selectedCoordinates.longitude}
                        locationName={formData.location}
                        height="200px"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                        <MapPin className="w-12 h-12 text-purple-600 mb-3" />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Location Preview
                        </p>
                        <p className="text-xs text-gray-500 text-center px-4">
                          {formData.location}
                        </p>
                        <div className="mt-3 px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          map preview not available
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Location Info */}
                  <div className="flex items-start gap-2 text-sm p-3 bg-purple-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-purple-900">
                        Selected Location:
                      </p>
                      <span className="text-gray-700">{formData.location}</span>
                      {selectedCoordinates && (
                        <div className="text-xs text-gray-500 mt-1">
                          📍 {selectedCoordinates.latitude.toFixed(4)},{" "}
                          {selectedCoordinates.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    Map preview will appear here
                  </p>
                  <p className="text-xs text-gray-500">
                    Enter a location to see preview
                  </p>
                </div>
              )}
            </div>

            {/* Assigned Representative */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Assigned Representative
              </h2>

              {selectedRep ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedRep.full_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedRep.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">
                        {selectedRep.phone_number || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Active
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium text-gray-900">
                        {selectedRep.role || "Sales Rep"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Select a sales representative to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
