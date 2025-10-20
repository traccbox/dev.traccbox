import { useQuery } from "@tanstack/react-query";
import { taskService } from "../TaskService";

// Hook for fetching company tasks
export const useCompanyTasks = (companyId: string) => {
  return useQuery({
    queryKey: ["company-tasks", companyId],
    queryFn: () => taskService.getCompanyTasks(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}; 

// Hook for fetching staff tasks
export const useStaffTasks = (companyId: string, staffId: string) => {
  return useQuery({
    queryKey: ["staff-tasks", companyId, staffId],
    queryFn: () => taskService.getStaffTasks(companyId, staffId),
    enabled: !!companyId && !!staffId,
    staleTime: 5 * 60 * 1000, 
    gcTime: 30 * 60 * 1000, 
  });
};
