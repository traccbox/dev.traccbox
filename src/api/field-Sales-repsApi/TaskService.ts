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
  lat?: number | null;
  lng?: number | null;
  date: string;
  time?: string | null;
  priority?: "important" | "normal" | "low";
  attachment?: string[] | null;
  status?: "pending" | "completed" | "overdue" | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface EditTask {
  task_title: string;
  task_type: string;
  customer_name: string;
  customer_phone: string;
  description?: string | null;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  date: string;
  time?: string | null;
  priority?: "important" | "normal" | "low";
  attachment?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface TaskResponse {
  id: string;
  task_title: string;
  task_type: string;
  customer_name: string;
  customer_phone: string;
  description?: string | null;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  date: string;
  time?: string | null;
  priority: string;
  attachment?: string[] | null;
  status: "pending" | "completed" | "overdue";
  latitude?: number | null;
  longitude?: number | null;
  staff_id: string;
  staff_name?: string;
}

export interface TaskStatusUpdate {
  status: "pending" | "completed" | "overdue";
}

export interface PlaceSuggestion {
  input: string;
  language?: string;
}

export interface PlaceSuggestionItem {
  description: string;
  place_id: string;
}

export interface PlaceSuggestionResponse {
  status?: string;
  query?: string;
  suggestions?: PlaceSuggestionItem[];
  description?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  place_id?: string;
}

export interface PlaceCoordinatesResponse {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
}

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
  suggestPlaces: async (input: string, language: string = "en") => {
    console.log("Api Suggest Location", input, "And lang=", language);
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

  getPlaceCoordinates: async (placeId: string) => {
    try {
      const response = await api.get("/places/place-coordinates", {
        params: {
          place_id: placeId,
        },
      });
      console.log("PlaceCoordinatesResponse=", response.data);
      return response.data as PlaceCoordinatesResponse;
    } catch (error) {
      console.error("Error fetching place coordinates:", error);
      throw error;
    }
  },
};
export { taskService, placesService };
