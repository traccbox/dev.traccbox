import { useQuery } from "@tanstack/react-query";
import { getAllStaff } from "../SettingServices";

export const useStaffData = (userId: string) => {
  return useQuery({
    queryKey: ["staff", userId],
    queryFn: () => getAllStaff(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
