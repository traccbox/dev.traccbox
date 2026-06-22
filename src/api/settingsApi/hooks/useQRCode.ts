import { useQuery, useMutation } from "@tanstack/react-query";
import { getStaffQRCode, qrClockIn } from "../QRCodeServices";

export const useStaffQRCode = (
  company_id: string,
  staff_id: string,
  format: "json" | "image" = "json",
  manager_id?: string
) => {
  return useQuery({
    queryKey: ["qr-code", company_id, staff_id, format, manager_id],
    queryFn: () => getStaffQRCode(company_id, staff_id, format, manager_id),
    enabled: !!company_id && !!staff_id,
    staleTime: 10 * 60 * 1000,
  });
};

export const useQRClockIn = () => {
  return useMutation({
    mutationFn: ({
      company_id,
      staff_id,
      manager_id,
    }: {
      company_id: string;
      staff_id: string;
      manager_id?: string;
    }) => qrClockIn(company_id, staff_id, manager_id),
  });
};
