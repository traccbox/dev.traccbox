import api from "../AxiosInstance";


interface BulkUploadParams {
  companyId: string;
  managerId: string;
  file: File;
}

export const bulkUploadStaff = async ({
  companyId,
  managerId,
  file,
}: BulkUploadParams) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
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