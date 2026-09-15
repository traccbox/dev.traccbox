import React from "react";
import {
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  AlertCircle,
} from "lucide-react";
import { TaskResponse } from "@/api/field-Sales-repsApi/TaskService";

interface TaskViewModalProps {
  task: TaskResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskViewModal: React.FC<TaskViewModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !task) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "important":
        return "bg-red-100 text-red-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "Not specified";
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Task Title and Status */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {task.task_title}
              </h3>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}{" "}
                  Priority
                </span>
              </div>
            </div>
          </div>

          {/* Task Type */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Task Type</p>
              <p className="text-sm text-gray-600 capitalize">
                {task.task_type}
              </p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Customer Information
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {task.customer_name}
                  </p>
                  <p className="text-xs text-gray-500">Customer Name</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {task.customer_phone}
                  </p>
                  <p className="text-xs text-gray-500">Phone Number</p>
                </div>
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(task.date)}
                </p>
                <p className="text-xs text-gray-500">Scheduled Date</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatTime(task.time || "")}
                </p>
                <p className="text-xs text-gray-500">Scheduled Time</p>
              </div>
            </div>
          </div>

          {/* Location */}
          {(task.location || ((task.lat ?? task.latitude) !== undefined && (task.lng ?? task.longitude) !== undefined)) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Location</p>
                {task.location && <p className="text-sm text-gray-600 mt-1">{task.location}</p>}
                {(task.lat ?? task.latitude) !== undefined && (task.lng ?? task.longitude) !== undefined && (task.lat ?? task.latitude) !== null && (task.lng ?? task.longitude) !== null && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    📍 Lat: {Number(task.lat ?? task.latitude).toFixed(5)}, Lng: {Number(task.lng ?? task.longitude).toFixed(5)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Description
              </h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {task.description}
              </p>
            </div>
          )}

          {/* Attachments */}
          {task.attachment && task.attachment.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Attachments
              </h4>
              <div className="space-y-2">
                {task.attachment.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        📎
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">{file}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task ID */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">Task ID: {task.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskViewModal;
