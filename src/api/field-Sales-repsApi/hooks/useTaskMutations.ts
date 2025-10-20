import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  taskService,
  TaskCreate,
  EditTask,
  TaskStatusUpdate,
} from "../TaskService";

// Hook for creating tasks
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: TaskCreate) => taskService.createTask(taskData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch company tasks
      if (variables.company_id) {
        queryClient.invalidateQueries({
          queryKey: ["company-tasks", variables.company_id],
        });
      }
      // Invalidate and refetch staff tasks if staff_id is provided
      if (variables.staff_id && variables.company_id) {
        queryClient.invalidateQueries({
          queryKey: ["staff-tasks", variables.company_id, variables.staff_id],
        });
      }
    },
    onError: (error) => {
      console.error("Error creating task:", error);
    },
  });
};

// Hook for updating tasks
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      staffId,
      taskId,
      taskData,
    }: {
      companyId: string;
      staffId: string;
      taskId: string;
      taskData: EditTask;
    }) => taskService.updateTask(companyId, staffId, taskId, taskData),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["company-tasks", variables.companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["staff-tasks", variables.companyId, variables.staffId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "task",
          variables.companyId,
          variables.staffId,
          variables.taskId,
        ],
      });
    },
    onError: (error) => {
      console.error("Error updating task:", error);
    },
  });
};

// Hook for deleting tasks
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      staffId,
      taskId,
    }: {
      companyId: string;
      staffId: string;
      taskId: string;
    }) => taskService.deleteTask(companyId, staffId, taskId),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["company-tasks", variables.companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["staff-tasks", variables.companyId, variables.staffId],
      });
      queryClient.removeQueries({
        queryKey: [
          "task",
          variables.companyId,
          variables.staffId,
          variables.taskId,
        ],
      });
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
    },
  });
};

// Hook for changing task status
export const useChangeTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      staffId,
      taskId,
      statusData,
    }: {
      companyId: string;
      staffId: string;
      taskId: string;
      statusData: TaskStatusUpdate;
    }) => taskService.changeTaskStatus(companyId, staffId, taskId, statusData),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["company-tasks", variables.companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["staff-tasks", variables.companyId, variables.staffId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "task",
          variables.companyId,
          variables.staffId,
          variables.taskId,
        ],
      });
    },
    onError: (error) => {
      console.error("Error changing task status:", error);
    },
  });
};
