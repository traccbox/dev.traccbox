import { useState } from "react";
import {
  Search,
  Users,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  useCompanyTasks,
  useUpdateTask,
  useDeleteTask,
} from "@/api/field-Sales-repsApi/hooks";
import { TaskResponse, EditTask } from "@/api/field-Sales-repsApi/TaskService";
import TaskViewModal from "@/components/modals/TaskViewModal";
import TaskEditModal from "@/components/modals/TaskEditModal";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function ManageTask() {
  const { user } = useAuth();
  const companyId = user?.id;
  const navigate = useNavigate()

  // State for filters and modals
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("");

  // Modal states
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [staffId, setStaffId] = useState(null);

  // Toast notifications
  const { toast } = useToast();
  // API hooks
  const {
    data: companyTasksData,
    isLoading: loadingCompanyTasks,
    error: companyTaskError,
  } = useCompanyTasks(companyId);
  console.log("companyTasksData=", companyTasksData);

  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  // Get tasks from API data
  const tasks = companyTasksData?.tasks || [];
  // Calculate statistics
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.task_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.staff_name &&
        task.staff_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesType = typeFilter === "all" || task.task_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Modal handlers
  const handleViewTask = (task: TaskResponse) => {
    setSelectedTask(task);
    setIsViewModalOpen(true);
  };

  const handleEditTask = (task: TaskResponse) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };
  // Delete Confirmation Modal Alert
  const CustomAlert = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg shadow-lg w-96">
          <h2 className="text-lg font-bold mb-2">{title}</h2>
          <p className="mb-4">{message}</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-500 text-white rounded-md"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };
  const handleDeleteTask = (task) => {
    setDeleteTaskId(task.task_title);
    setTaskId(task.id);
    setStaffId(task.staff_id);
    setIsAlertOpen(true);
  };
  const handleConfirmDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync({
        companyId: companyId!,
        staffId: staffId,
        taskId: taskId,
      });
      toast({
        title: "Task Deleted",
        description: "Task has been successfully deleted.staffkId",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAlertOpen(false);
      setTaskId(null);
      setDeleteTaskId(null);
      setStaffId(null);
    }
  };

  const handleSaveTask = async (taskId: string, taskData: EditTask) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      await updateTaskMutation.mutateAsync({
        companyId: companyId!,
        staffId: task.staff_id,
        taskId: taskId,
        taskData: taskData,
      });

      setIsEditModalOpen(false);
      setSelectedTask(null);
      toast({
        title: "Task Updated",
        description: "Task has been successfully updated.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const closeModals = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedTask(null);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "completed":
        return "bg-purple-700 text-white";
      case "pending":
        return "bg-orange-400 text-white";
      case "overdue":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Manage Task
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Monitor and manage all tasks assigned to your team members
            </p>
          </div>
          <button className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
          onClick={()=>navigate("/dashboard/field-reps/create-tasks")}
          >
            <span className="text-xl">+</span>
            Add new task
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-100 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-blue-200 rounded-full p-3">
              <Users className="w-5 h-5 text-blue-700" />
            </div>
            <div className="text-sm text-gray-700 mb-1">Total task</div>
            <div className="text-4xl font-bold text-gray-900">
              {stats.total}
            </div>
          </div>

          <div className="bg-blue-200 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-green-100 rounded-lg w-10 h-10 flex items-center justify-center">
              <div className=" bg-green-400 rounded-full w-6 h-6"></div>
            </div>
            <div className="text-sm text-gray-700 mb-1">Completed</div>
            <div className="text-4xl font-bold text-gray-900">
              {stats.completed}
            </div>
          </div>

          <div className="bg-orange-200 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-orange-100 rounded-lg w-10 h-10 flex items-center justify-center">
              <div className=" bg-orange-400 rounded-full w-6 h-6"></div>
            </div>
            <div className="text-sm text-gray-700 mb-1">Pending</div>
            <div className="text-4xl font-bold text-gray-900">
              {stats.pending}
            </div>
          </div>

          <div className="bg-yellow-200 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-purple-100 rounded-lg w-10 h-10 flex items-center justify-center">
              <div className=" bg-purple-400 rounded-full w-6 h-6"></div>
            </div>
            <div className="text-sm text-gray-700 mb-1">Overdue</div>
            <div className="text-4xl font-bold text-gray-900">
              {stats.overdue}
            </div>
          </div>
        </div>

        {/* All Tasks Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Tasks</h2>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, customer, or rep......"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:w-auto">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white pr-10"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="in-progress">In Progress</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white pr-10"
                >
                  <option value="all">All Type</option>
                  <option value="meeting">Meeting</option>
                  <option value="call">Call</option>
                  <option value="visit">Visit</option>
                  <option value="followup">Follow-up</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Date Range"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Filter Label */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter</h3>
          </div>

          {/* Tasks Table */}
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                {loadingCompanyTasks ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading tasks...</p>
                  </div>
                ) : companyTaskError ? (
                  <div className="text-center py-12">
                    <p className="text-red-500">
                      Fail to load tasks. Please try again.
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Task title
                        </th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Customer Name
                        </th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Task type
                        </th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Assigned Rep
                        </th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Date & time
                        </th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr
                          key={task.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 px-4 text-xs sm:text-sm text-gray-900">
                            {task.task_title}
                          </td>
                          <td className="py-4 px-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                            {task.customer_name}
                          </td>
                          <td className="py-4 px-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap capitalize">
                            {task.task_type}
                          </td>
                          <td className="py-4 px-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                            {task.staff_name || "N/A"}
                          </td>
                          <td className="py-4 px-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                            {new Date(task.date).toLocaleDateString()}{" "}
                            {task.time
                              ? new Date(
                                  `2000-01-01T${task.time}`
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${getStatusStyle(
                                task.status
                              )}`}
                            >
                              {task.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <button
                                onClick={() => handleViewTask(task)}
                                className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                title="View"
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleEditTask(task)}
                                className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task)}
                                className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {!loadingCompanyTasks &&
                  !companyTaskError &&
                  filteredTasks.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        No tasks found matching your filters
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <CustomAlert
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete "${deleteTaskId}"?`}
      />

      {/* Modals */}
      <TaskViewModal
        task={selectedTask}
        isOpen={isViewModalOpen}
        onClose={closeModals}
      />

      <TaskEditModal
        task={selectedTask}
        isOpen={isEditModalOpen}
        onClose={closeModals}
        onSave={handleSaveTask}
        isLoading={updateTaskMutation.isPending}
      />
    </div>
  );
}
