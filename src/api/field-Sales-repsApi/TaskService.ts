import api from "../AxiosInstance";

// Types based
export interface TaskCreate {
  company_id?: string | null;
  staff_id?: string | null;
  task_title: string;
  task_type: string;
  customer_name: string;
  customer_phone: string;
  description?: string | null;
  location?: string | null;
  date: string; // format: date (YYYY-MM-DD)
  time?: string | null; // format: time (HH:MM:SS)
  priority?: "important" | "normal" | "low";
  attachment?: string[] | null;
  status?: "pending" | "completed" | "overdue" | null;
  latitude?: number;
  longitude?: number;
}

export interface EditTask {
  task_title: string;
  task_type: string;
  customer_name: string;
  customer_phone: string;
  description?: string | null;
  location?: string | null;
  date: string;
  time?: string | null;
  priority?: "important" | "normal" | "low";
  attachment?: string[] | null;
  latitude?: number;
  longitude?: number;
}

export interface TaskResponse {
  id: string;
  task_title: string;
  task_type: string;
  customer_name: string;
  customer_phone: string;
  description?: string | null;
  location?: string | null;
  date: string;
  time?: string | null;
  priority: string;
  attachment?: string[] | null;
  status: "pending" | "completed" | "overdue";
  latitude?: number;
  longitude?: number;
}

export interface TaskStatusUpdate {
  status: "pending" | "completed" | "overdue";
}

export interface PlaceSuggestion {
  input: string;
  language?: string;
}

export interface PlaceSuggestionResponse {
  description: string;
  latitude?: number;
  longitude?: number;
}
const AprCreateRes = {
  id: "cf67a058-f5ca-4d90-aeb0-80197b3ccfa1",
  task_title: "Store Supplies ",
  task_type: "visit",
  customer_name: "Ibrahim",
  customer_phone: "+2349073388245",
  attachment: null,
  date: "2025-10-22",
  description: "Deliver 50 goods to the store house",
  priority: "important",
  status: "pending",
  time: "10:03:00",
};
// Task API Service
const taskService = {
  createTask: async (taskData: TaskCreate) => {
    try {
      const response = await api.post("/tasks/", taskData);
      console.log("Api services For Create task=", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  getCompanyTasks: async (companyId: string) => {
    try {
      const response = await api.get(`/tasks/company/${companyId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching company tasks:", error);
      throw error;
    }
  },

  getStaffTasks: async (companyId: string, staffId: string) => {
    try {
      const response = await api.get(`/tasks/${companyId}/${staffId}/my-tasks`);
      return response.data;
    } catch (error) {
      console.error("Error fetching staff tasks:", error);
      throw error;
    }
  },

  updateTask: async (
    companyId: string,
    staffId: string,
    taskId: string,
    taskData: EditTask
  ) => {
    try {
      const response = await api.patch(
        `/tasks/${companyId}/${staffId}/${taskId}`,
        taskData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  },
  deleteTask: async (companyId: string, staffId: string, taskId: string) => {
    try {
      const response = await api.delete(
        `/tasks/${companyId}/${staffId}/${taskId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  },

  changeTaskStatus: async (
    companyId: string,
    staffId: string,
    taskId: string,
    statusData: TaskStatusUpdate
  ) => {
    try {
      const response = await api.patch(
        `/tasks/${companyId}/${staffId}/${taskId}/status`,
        statusData
      );
      return response.data;
    } catch (error) {
      console.error("Error changing task status:", error);
      throw error;
    }
  },
};

// Places API Service
const placesService = {
  //    * Get place(location) suggestions based on user input
  suggestPlaces: async (input: string, language: string) => {
    console.log("Apl Suggest Location", input, "And EN=", language);
    try {
      const response = await api.get("/places/suggest", {
        params: {
          input,
          language,
        },
      });
      console.log("PlaceResponse=", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching place suggestions:", error);
      throw error;
    }
  },
};
export { taskService, placesService };
