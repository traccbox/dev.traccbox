import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  AlertCircle,
} from "lucide-react";
import { TaskResponse, EditTask } from "@/api/field-Sales-repsApi/TaskService";

interface TaskEditModalProps {
  task: TaskResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, taskData: EditTask) => void;
  isLoading?: boolean;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    task_title: "",
    task_type: "",
    customer_name: "",
    customer_phone: "",
    description: "",
    location: "",
    date: "",
    time: "",
    priority: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setFormData({
        task_title: task.task_title || "",
        task_type: task.task_type || "",
        customer_name: task.customer_name || "",
        customer_phone: task.customer_phone || "",
        description: task.description || "",
        location: task.location || "",
        date: task.date || "",
        time: task.time || "",
        priority: task.priority || "",
      });
      setErrors({});
    }
  }, [task]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.task_title.trim()) {
      newErrors.task_title = "Task title is required";
    }
    if (!formData.task_type) {
      newErrors.task_type = "Task type is required";
    }
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = "Customer name is required";
    }
    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = "Customer phone is required";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !task) return;

    const editData: EditTask = {
      task_title: formData.task_title,
      task_type: formData.task_type,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      description: formData.description || null,
      location: formData.location || null,
      date: formData.date,
      time: formData.time || null,
      priority: formData.priority as "important" | "normal" | "low",
      ...(task.latitude && { latitude: task.latitude }),
      ...(task.longitude && { longitude: task.longitude }),
    };

    onSave(task.id, editData);
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              name="task_title"
              value={formData.task_title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                errors.task_title ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.task_title && (
              <p className="mt-1 text-sm text-red-600">{errors.task_title}</p>
            )}
          </div>

          {/* Task Type and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Type *
              </label>
              <select
                name="task_type"
                value={formData.task_type}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                  errors.task_type ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isLoading}
              >
                <option value="">Select task type</option>
                <option value="meeting">Meeting</option>
                <option value="call">Call</option>
                <option value="visit">Visit</option>
                <option value="followup">Follow-up</option>
              </select>
              {errors.task_type && (
                <p className="mt-1 text-sm text-red-600">{errors.task_type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                  errors.priority ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isLoading}
              >
                <option value="">Select Priority</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
              </select>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                  errors.customer_name ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.customer_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.customer_name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Phone *
              </label>
              <input
                type="tel"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                  errors.customer_phone ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.customer_phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.customer_phone}
                </p>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                  errors.date ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                  errors.time ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEditModal;
