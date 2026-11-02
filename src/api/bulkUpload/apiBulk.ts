import api from "../AxiosInstance";


interface BulkUploadParams {
  companyId: string;
  managerId: string;
  file: File;
}

export interface BulkUploadResponse {
  total_rows: number;
  created: number;
  skipped: number;
  skipped_details?: Array<{
    row: number;
    email: string;
    reason: string;
  }>;
  staff: Array<{
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    job_title: string;
    department: string;
    role: string;
    qr_code?: string;
  }>;
}

export const bulkUploadStaff = async ({
  companyId,
  managerId,
  file,
}: BulkUploadParams): Promise<BulkUploadResponse> => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post<BulkUploadResponse>(
    // `/api/v1/staffs/${companyId}/bulk-upload`,
    `/staffs/${companyId}/bulk-upload`,
    formData,
    {
      params: {
        manager_id: managerId,
      },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};