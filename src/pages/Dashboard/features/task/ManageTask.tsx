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

export default function ManageTask() {
  // Sample task data
  const allTasks = [
    {
      id: 1,
      title: "Insurance Policy Review",
      customerName: "Victor Moses",
      taskType: "Policy Review",
      assignedRep: "Sarah Johnson",
      dateTime: "2024-01-15 10:00 AM",
      status: "completed",
    },
    {
      id: 2,
      title: "Sales Follow-up Call",
      customerName: "Victor Moses",
      taskType: "Follow-up",
      assignedRep: "Mike Moses",
      dateTime: "2024-01-15 10:00 AM",
      status: "pending",
    },
    {
      id: 3,
      title: "Insurance Policy Review",
      customerName: "Victor Moses",
      taskType: "Policy Review",
      assignedRep: "Sarah Johnson",
      dateTime: "2024-01-15 10:00 AM",
      status: "completed",
    },
    {
      id: 4,
      title: "Insurance Policy Review",
      customerName: "Victor Moses",
      taskType: "Policy Review",
      assignedRep: "Sarah Johnson",
      dateTime: "2024-01-15 10:00 AM",
      status: "overdue",
    },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("");
  const [tasks, setTasks] = useState(allTasks);

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
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedRep.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesType = typeFilter === "all" || task.taskType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this task?")) {
      setTasks(tasks.filter((task) => task.id !== id));
    }
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
          <button className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
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
                  <option value="Policy Review">Policy Review</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Call">Call</option>
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
                          {task.title}
                        </td>
                        <td className="py-4 px-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                          {task.customerName}
                        </td>
                        <td className="py-4 px-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                          {task.taskType}
                        </td>
                        <td className="py-4 px-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                          {task.assignedRep}
                        </td>
                        <td className="py-4 px-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                          {task.dateTime}
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
                              className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              title="View"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                            </button>
                            <button
                              className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
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
              </div>
            </div>

            {filteredTasks.length === 0 && (
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
  );
}
