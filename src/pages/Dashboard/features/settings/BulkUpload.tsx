import {
  bulkUploadStaff,
  type BulkUploadResponse,
} from "@/api/bulkUpload/apiBulk";
import { useAuth } from "@/components/auth/AuthProvider";
import { formSchema, FormValues } from "@/type/formSchema";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function BulkUpload() {
  const [fileName, setFileName] = useState("");
  const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(
    null,
  );
  const navigate = useNavigate();

  const { user } = useAuth();
  console.log("user", user);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined,
    },
  });

  async function onSubmit(data: FormValues) {
    setUploadResult(null);
    try {
      const response = await bulkUploadStaff({
        companyId: user.id,
        managerId: "26f606c7-e8e8-4217-a1d0-daa00429bba8",
        file: data.file,
      });

      setUploadResult(response);
      const summary = `${response.created} staff member${response.created === 1 ? "" : "s"} created; ${response.skipped} skipped.`;
      if (response.skipped > 0) {
        toast.warning("Bulk upload completed with skipped rows", {
          description: summary,
        });
      } else {
        toast.success("Staff uploaded successfully", {
          description: summary,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
      <div
        onClick={() => navigate(-1)}
        className="w-12 h-12 cursor-pointer bg-traccbox-700 text-white flex justify-center items-center rounded-full"
      >
        <ArrowLeft />
      </div>

      <div className="mt-10 flex flex-col w-full items-center justify-start">
        {" "}
        <h1 className="text-center  text-xl">
          Upload a CSV or Excel file with these columns: <br />{" "}
          <span className="font-normal">
            full_name, email, phone_number, job_title, department
          </span>{" "}
          <br />
          <a
            href="/staff-upload-template.csv"
            className="text-traccbox-700  hover:underline underline-offset-2 text-base font-medium"
            download="staff-upload-template.csv"
          >
            Download sample CSV template
          </a>
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="w-[70%] mt-10">
          <label className="w-full gap-2 text-xs" htmlFor="staff-file">
            <div className="border-primary flex h-[250px] w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-10">
              <Upload size={40} className="text-primary" />

              <h2 className="mt-10 text-xl text-traccbox-900 font-medium">
                Drop your file here, or{" "}
                <span className="text-primary font-semibold">
                  click to browse
                </span>
              </h2>

              <p className="mt-1 text-xs">
                CSV (.csv) and Excel (.xlsx, .xls) files are allowed
              </p>

              {fileName && (
                <p className="text-orange mt-3 text-xs font-medium">
                  {fileName}
                </p>
              )}
            </div>

            <input
              type="file"
              hidden
              id="staff-file"
              accept=".csv,.xlsx,.xls"
              {...register("file")}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  setFileName(file.name);

                  setValue("file", file, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
            />
          </label>

          <button
            disabled={isSubmitting}
            className="w-full text-center rounded-xl py-3 mt-5 px-5 bg-[#1658E5] text-white font-bold"
          >
            {isSubmitting ? "Loading" : "Submit"}
          </button>
        </form>

        {uploadResult && (
          <section
            aria-live="polite"
            className={`mt-6 w-[70%] rounded-lg border p-5 ${
              uploadResult.skipped > 0
                ? "border-amber-300 bg-amber-50"
                : "border-green-300 bg-green-50"
            }`}
          >
            <h2
              className={`text-lg font-semibold ${
                uploadResult.skipped > 0 ? "text-amber-900" : "text-green-900"
              }`}
            >
              {uploadResult.skipped > 0
                ? "Upload completed with skipped rows"
                : "Upload completed"}
            </h2>
            <p className="mt-1 text-sm text-gray-700">
              {uploadResult.total_rows} rows processed: {uploadResult.created}{" "}
              created and {uploadResult.skipped} skipped.
            </p>

            {uploadResult.skipped_details &&
              uploadResult.skipped_details.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-amber-900">
                    Rows that need attention
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {uploadResult.skipped_details.map((detail) => (
                      <li
                        key={`${detail.row}-${detail.email}`}
                        className="rounded-md border border-amber-200 bg-white px-3 py-2 text-sm"
                      >
                        <p className="font-medium text-gray-900">
                          Row {detail.row}: {detail.email}
                        </p>
                        <p className="text-gray-600">{detail.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </section>
        )}
      </div>
    </div>
  );
}
