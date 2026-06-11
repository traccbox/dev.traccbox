import { bulkUploadStaff } from "@/api/bulkUpload/apiBulk";
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
    console.log(data);
    try {
      const response = await bulkUploadStaff({
        companyId: user.id,
        managerId: "26f606c7-e8e8-4217-a1d0-daa00429bba8",
        file: data.file,
      });

      console.log(response);
      toast.success("Staff uploaded successfully");
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
          Upload a CSV or Excel file with columns: <br />{" "}
          <span className="font-normal">
            full_name | email | phone_number | job_title | department
          </span>{" "}
          <br />
          <a
            href="csv/upload-template.csv"
            className="text-traccbox-700  hover:underline underline-offset-2 text-base font-medium"
            download="sample_file.csv"
          >
            Click here to download sample file
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
      </div>
    </div>
  );
}
