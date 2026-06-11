import { z } from "zod";

export const formSchema = z.object({
  file: z
    .instanceof(File, {
      message: "Please upload a file",
    })
    .refine(
      (file) =>
        [
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ].includes(file.type),
      {
        message: "Only CSV, XLS, and XLSX files are allowed",
      }
    ),
});

export type FormValues = z.infer<typeof formSchema>;