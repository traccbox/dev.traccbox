import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Shield,
  Users,
  Briefcase,
  Eye,
  Settings,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { createStaff } from "@/api/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import type { StaffPermissions, StaffCreateRequest } from "@/api/types";
import { useNavigate } from "react-router-dom";
import PermissionsEditor from "@/components/permissions/PermissionsEditor";
import {
  usePermissionsSchema,
  useRoleDefaults,
} from "@/api/permissions/hooks";
import {
  PermissionsMap,
  emptyFromSchema,
  mergePermissions,
} from "@/api/permissions";

// Zod schema for form validation
const userFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[+]?[\d\s()-]{3,20}$/, "Please enter a valid phone number"),
  jobTitle: z
    .string()
    .min(1, "Job title is required")
    .min(2, "Job title must be at least 2 characters")
    .max(50, "Job title must be less than 50 characters"),
  department: z
    .string()
    .min(1, "Department is required")
    .refine((val) => val !== "", "Please select a department"),
});

// TypeScript type for the form data
type UserFormData = z.infer<typeof userFormSchema>;
type TabMode = "standard" | "fieldWorker" | "bulkUpload";

interface UserFormSectionProps {
  mode: TabMode;
}

interface UserFormHandle {
  getValues: () => UserFormData;
  formState: { errors: Record<string, unknown> };
  reset: () => void;
}

const UserFormSection = React.forwardRef<UserFormHandle, UserFormSectionProps>(
  ({ mode }, ref) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
      setValue,
      getValues,
      reset,
    } = useForm<UserFormData>({
      resolver: zodResolver(userFormSchema),
      defaultValues: {
        fullName: "",
        email: undefined,
        phoneNumber: "",
        jobTitle: "",
        department: "",
      },
      mode: "onChange",
    });

    // Expose form methods to parent via ref
    React.useImperativeHandle(ref, () => ({
      getValues,
      formState: { errors },
      reset,
    }));

    return (
      <div className="bg-white rounded-xl shadow p-8 mb-6">
        <h2 className="text-lg font-semibold mb-4">User Information</h2>
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1 font-medium">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("fullName")}
                className={`w-full border rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200 ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter full name"
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {mode === "standard" && (
              <div>
                <label className="block text-xs mb-1 font-medium">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className={`w-full border rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs mb-1 font-medium">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register("phoneNumber")}
                type="tel"
                className={`w-full border rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200 ${
                  errors.phoneNumber ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter phone number"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs mb-1 font-medium">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register("jobTitle")}
                className={`w-full border rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200 ${
                  errors.jobTitle ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter job title"
              />
              {errors.jobTitle && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.jobTitle.message}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-xs mb-1 font-medium">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                {...register("department")}
                className={`w-full border rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200 ${
                  errors.department ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select department</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
                <option value="Other">Other</option>
              </select>
              {errors.department && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.department.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

const roleOptions = [
  {
    key: "admin",
    title: "Admin",
    desc: "Full access to all features and settings",
    icon: <Shield className="w-7 h-7 mx-auto mb-2 text-purple-700" />,
  },
  {
    key: "manager",
    title: "Manager",
    desc: "Manage team and operations, limited admin access.",
    icon: <Users className="w-7 h-7 mx-auto mb-2 text-purple-700" />,
  },
  {
    key: "sales",
    title: "Sales Rep",
    desc: "Manage sales, leads, and client interactions.",
    icon: <Briefcase className="w-7 h-7 mx-auto mb-2 text-purple-700" />,
  },
  {
    key: "view",
    title: "View only",
    desc: "Read-only access to dashboards and reports.",
    icon: <Eye className="w-7 h-7 mx-auto mb-2 text-purple-700" />,
  },
  {
    key: "custom",
    title: "Custom Role",
    desc: "Define specific permissions for this user.",
    icon: <Settings className="w-7 h-7 mx-auto mb-2 text-purple-700" />,
  },
];

const permissionGroups = [
  {
    label: "Core Dashboard & Reporting",
    permissions: [
      "View Dashboard",
      "View Sales & Analytics",
      "Export Data",
      "View Reports",
      "Generate/Export Reports",
    ],
  },
  {
    label: "Lead & Client Management",
    permissions: [
      "View Leads",
      "Add/Edit Leads",
      "Assign Leads",
      "View Clients",
      "Add/Edit Clients",
      "Assign Client",
    ],
  },
  {
    label: "Order & Task Management",
    permissions: [
      "View Orders",
      "Create/Edit Orders",
      "Manage Orders",
      "Assign Tasks",
      "Edit Task",
    ],
  },
  {
    label: "User & Role Management",
    permissions: [
      "View Users",
      "Add/Edit Users",
      "Manage Users",
      "Assign Roles",
    ],
  },
  {
    label: "Billing & Subscription",
    permissions: [
      "View Billing",
      "Manage Billing",
      "Access Invoice",
      "Update Payment Method",
    ],
  },
  {
    label: "Integrations & API",
    permissions: ["Access Integration", "Manage API Keys", "Manage Webhooks"],
  },
  {
    label: "Commission Management",
    permissions: ["View Commissions", "Approve Commissions"],
  },
  {
    label: "Notification Management",
    permissions: ["Manage Email Notifications", "Manage SMS Notifications"],
  },
];

const insurancePermissions = [
  "View Policies",
  "Create/Edit Policies",
  "View Claims",
  "Approve Claims",
];

const viewOnlyEnabled = [
  "View Dashboard",
  "View Sales & Analytics",
  "View Reports",
  "Generate/Export Reports",
  "View Clients",
  "View Orders",
];

const managerDisabled = [
  "Add/Edit Users",
  "Manage Billing",
  "Update Payment Method",
  "Manage API Keys",
];

const RoleAssignmentSection: React.FC<{
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  mode: TabMode;
}> = ({ selectedRole, setSelectedRole, mode }) => {
  if (mode === "fieldWorker") {
    return (
      <div className="bg-white rounded-xl shadow p-8 mb-6">
        <h2 className="text-lg font-semibold mb-4">Role Assignment</h2>
        <p className="text-sm text-gray-700">
          Field workers are assigned the Sales Rep role by default.
        </p>
        <div className="mt-4 p-4 border rounded bg-purple-50 border-purple-200">
          <div className="font-semibold">Sales Rep (Fixed)</div>
          <div className="text-sm text-gray-600">
            This role is assigned automatically for non-smartphone field
            workers.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-8 mb-6">
      <h2 className="text-lg font-semibold mb-4">Role Assignment</h2>
      <div className="grid grid-cols-3 gap-4">
        {roleOptions.map((role) => (
          <button
            key={role.key}
            type="button"
            className={`border rounded-lg p-4 text-left transition-all h-full flex flex-col justify-between shadow-sm hover:border-purple-700 focus:outline-none ${
              selectedRole === role.key
                ? "border-purple-700 bg-purple-50"
                : "border-gray-200 bg-white"
            }`}
            onClick={() => setSelectedRole(role.key)}
          >
            <div className="flex flex-row items-start justify-start mb-2">
              <div className="mr-2">{role.icon}</div>
              <div className="font-bold text-base mb-1">{role.title}</div>
            </div>
            <div className="text-xs text-gray-500 mb-1 flex-1">{role.desc}</div>
            {selectedRole === role.key && (
              <div className="mt-2 text-xs text-purple-700 font-semibold">
                Selected
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const PermissionsSection = ({ selectedRole, permissions, setPermissions }) => {
  const handleToggle = (perm) => {
    setPermissions((prev) => ({ ...prev, [perm]: !prev[perm] }));
  };

  const resetPermissions = () => {
    const initialPermissions = {};
    permissionGroups.forEach((group) => {
      group.permissions.forEach((perm) => {
        initialPermissions[perm] = true;
      });
    });
    setPermissions(initialPermissions);
  };

  const isDisabled = (perm) => {
    if (selectedRole === "admin" || selectedRole === "custom") return false;
    if (selectedRole === "sales") return true;
    if (selectedRole === "view") return !viewOnlyEnabled.includes(perm);
    if (selectedRole === "manager") return managerDisabled.includes(perm);
    return false;
  };

  const isChecked = (perm) => {
    if (isDisabled(perm)) return false;
    return permissions[perm];
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <SlidersHorizontal className="text-purple-700 w-6 h-6 mr-2" />
          <h2 className="text-lg font-semibold mr-2">Permissions Management</h2>
          <span className="text-xs text-gray-400 font-normal">
            (Default permissions for admin)
          </span>
        </div>
        <button
          type="button"
          onClick={resetPermissions}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:border-gray-400"
        >
          Reset Permissions
        </button>
      </div>
      <div className="flex flex-col gap-6">
        {permissionGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <div className="font-semibold text-sm mb-2">{group.label}</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {group.permissions.map((perm) => (
                <div
                  key={perm}
                  className="flex items-center justify-between w-full"
                >
                  <span className="text-sm">{perm}</span>
                  <Switch
                    checked={isChecked(perm)}
                    onCheckedChange={() => handleToggle(perm)}
                    className="data-[state=checked]:bg-purple-700 data-[state=unchecked]:bg-gray-200"
                    disabled={isDisabled(perm)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-2 rounded-lg bg-gray-50 p-4 border border-gray-200">
          <div className="font-semibold text-sm mb-2 text-gray-400">
            Insurance Permissions (Coming Soon)
          </div>
          <div className="grid grid-cols-4 gap-2">
            {insurancePermissions.map((perm) => (
              <div
                key={perm}
                className="flex items-center justify-between w-full text-gray-400"
              >
                <span className="text-sm">{perm}</span>
                <Switch
                  checked={false}
                  onCheckedChange={() => {}}
                  disabled
                  className="bg-gray-200"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SecuritySection = ({
  password,
  setPassword,
  forceChange,
  setForceChange,
  twoFactor,
  setTwoFactor,
  sendInvite,
  setSendInvite,
}) => {
  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < 12; i++)
      pass += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pass);
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 mb-6">
      <h2 className="text-2xl font-bold mb-6">Security & Login</h2>

      <div className="flex items-center gap-4 mb-8 max-w-xl">
        <input
          type="text"
          className="flex-1 border rounded-lg px-4 py-3 text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200"
          placeholder="Generate password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          className="border font-semibold rounded-lg px-6 py-3 text-base bg-white hover:bg-gray-100 transition"
          onClick={generatePassword}
        >
          Generate
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">
              Force password change on first login
            </div>
            <div className="text-gray-500 text-sm">
              User must change password when they first log in
            </div>
          </div>
          <Switch
            checked={forceChange}
            onCheckedChange={setForceChange}
            className="data-[state=checked]:bg-purple-700 data-[state=unchecked]:bg-gray-200"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">
              Enable Two-Factor Authentication
            </div>
            <div className="text-gray-500 text-sm">
              Require 2FA for enhanced security
            </div>
          </div>
          <Switch
            checked={twoFactor}
            onCheckedChange={setTwoFactor}
            className="data-[state=checked]:bg-purple-700 data-[state=unchecked]:bg-gray-200"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">
              Send Invitation Email on Create
            </div>
            <div className="text-gray-500 text-sm">
              Email login credentials to the new user
            </div>
          </div>
          <Switch
            checked={sendInvite}
            onCheckedChange={setSendInvite}
            className="data-[state=checked]:bg-purple-700 data-[state=unchecked]:bg-gray-200"
          />
        </div>
      </div>
    </div>
  );
};

const FooterActions: React.FC<{
  onSave: () => void;
  loading: boolean;
  isFormValid: boolean;
  mode: TabMode;
}> = ({ onSave, loading, isFormValid, mode }) => (
  <div className="flex justify-between items-center mt-8">
    <button
      type="button"
      className="border border-purple-700 text-purple-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-purple-50 transition"
      onClick={() => window.history.back()}
    >
      Cancel
    </button>
    <button
      className={`px-8 py-3 rounded-lg font-semibold text-lg transition ${
        loading || !isFormValid
          ? "bg-gray-400 text-white cursor-not-allowed"
          : "bg-purple-700 text-white hover:bg-purple-800"
      }`}
      onClick={onSave}
      disabled={loading || !isFormValid}
      type="button"
    >
      {loading
        ? "Saving..."
        : mode === "fieldWorker"
          ? "Save Field Worker"
          : "Save & Send Invite"}
    </button>
  </div>
);

const UserRoles = () => {
  const formRef = useRef<UserFormHandle>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const Navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    "standard" | "fieldWorker" | "bulkUpload" // Add bulk upload button
  >("standard");
  const [selectedRole, setSelectedRole] = useState("admin");

  const [permissions, setPermissions] = useState(() => {
    const perms = {};
    permissionGroups.forEach((group) => {
      group.permissions.forEach((perm) => {
        perms[perm] = true;
      });
    });
    return perms;
  });

  const [password, setPassword] = useState("");
  const [forceChange, setForceChange] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sendInvite, setSendInvite] = useState(true);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (activeTab === "fieldWorker") {
      setSelectedRole("sales");
      setSendInvite(false);
      setForceChange(false);
      setTwoFactor(false);
    }
  }, [activeTab]);

  function buildStaffPermissions(): StaffPermissions {
    return {
      core_dashboard_report: {
        view_dashboard: permissions["View Dashboard"] ?? false,
        export_data: permissions["Export Data"] ?? false,
        generate_export_reports:
          permissions["Generate/Export Reports"] ?? false,
        view_sales_analytics: permissions["View Sales & Analytics"] ?? false,
        view_reports: permissions["View Reports"] ?? false,
      },
      lead_client_management: {
        view_leads: permissions["View Leads"] ?? false,
        view_clients: permissions["View Clients"] ?? false,
        assign_lead: permissions["Assign Leads"] ?? false,
        add_edit_clients: permissions["Add/Edit Clients"] ?? false,
        add_edit_leads: permissions["Add/Edit Leads"] ?? false,
        assign_client: permissions["Assign Client"] ?? false,
      },
      order_task_management: {
        view_orders: permissions["View Orders"] ?? false,
        manage_orders: permissions["Manage Orders"] ?? false,
        edit_tasks: permissions["Edit Task"] ?? false,
        create_edit_orders: permissions["Create/Edit Orders"] ?? false,
        assign_tasks: permissions["Assign Tasks"] ?? false,
      },
      user_role_management: {
        view_users: permissions["View Users"] ?? false,
        manage_users: permissions["Manage Users"] ?? false,
        add_edit_users: permissions["Add/Edit Users"] ?? false,
        assign_roles: permissions["Assign Roles"] ?? false,
      },
      billing_subscription: {
        view_billing: permissions["View Billing"] ?? false,
        manage_billing: permissions["Manage Billing"] ?? false,
        access_invoice: permissions["Access Invoice"] ?? false,
        update_payment_method: permissions["Update Payment Method"] ?? false,
      },
      integrations_api: {
        access_integration: permissions["Access Integration"] ?? false,
        manage_webhook: permissions["Manage Webhooks"] ?? false,
        manage_api_keys: permissions["Manage API Keys"] ?? false,
      },
      commission_management: {
        view_commission: permissions["View Commissions"] ?? false,
        approve_commission: permissions["Approve Commissions"] ?? false,
      },
      notification_management: {
        manage_email_notification:
          permissions["Manage Email Notifications"] ?? false,
        manage_sms_notification:
          permissions["Manage SMS Notifications"] ?? false,
      },
    };
  }

  const handleSave = async () => {
    if (!formRef.current) {
      toast({
        title: "Error",
        description: "Form not available.",
      });
      return;
    }

    const formData = formRef.current.getValues();
    const formErrors = formRef.current.formState.errors;

    // Check if form is valid
    if (Object.keys(formErrors).length > 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields correctly.",
      });
      return;
    }

    // Additional check for empty required fields
    const requiredFields =
      activeTab === "standard"
        ? ["fullName", "email", "phoneNumber", "jobTitle", "department"]
        : ["fullName", "phoneNumber", "jobTitle", "department"];

    const emptyFields = requiredFields.filter(
      (field) => !formData[field] || formData[field].trim() === "",
    );

    if (emptyFields.length > 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
      });
      return;
    }

    if (activeTab === "standard" && !password.trim()) {
      toast({
        title: "Error",
        description: "Please generate or enter a password.",
      });
      return;
    }

    setLoading(true);

    try {
      const staffReq: Partial<StaffCreateRequest> & {
        send_invite: boolean;
        force_change_password?: boolean;
        two_factor?: boolean;
      } = {
        company_id: user.id,
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        job_title: formData.jobTitle,
        department: formData.department,
        role: selectedRole,
        permissions: buildStaffPermissions(),
        send_invite: false,
      };

      if (activeTab === "standard") {
        staffReq.email = formData.email;
        staffReq.password = password;
        staffReq.force_change_password = forceChange;
        staffReq.two_factor = twoFactor;
        staffReq.send_invite = sendInvite;
      } else {
        staffReq.email = "";
        staffReq.password = "";
        staffReq.force_change_password = false;
        staffReq.two_factor = false;
        staffReq.send_invite = false;
      }

      await createStaff(staffReq as StaffCreateRequest);
      toast({
        title: "Success",
        description:
          activeTab === "standard"
            ? "User created and invite sent!"
            : "Field worker created successfully!",
      });
      Navigate("/dashboard/settings/team");
      // Reset form
      formRef.current.reset();
      setPassword("");
      setSelectedRole(activeTab === "fieldWorker" ? "sales" : "admin");
      setActiveTab("standard");
    } catch (e) {
      let errorMessage =
        "Failed to create user. Please check your input and try again.";

      // Check for network connectivity issues
      if (
        e?.message?.includes("ERR_INTERNET_DISCONNECTED") ||
        e?.message?.includes("ERR_NETWORK") ||
        e?.message?.includes("Network Error") ||
        e?.code === "ERR_INTERNET_DISCONNECTED" ||
        e?.code === "ERR_NETWORK"
      ) {
        errorMessage =
          "No internet connection. Please check your network and try again.";
      } else if (e?.response?.data?.detail) {
        const detail = e.response.data.detail;

        // Handle specific error cases
        if (
          detail.includes("duplicate key value violates unique constraint") &&
          detail.includes("email")
        ) {
          errorMessage =
            "This email address is already registered. Please use a different email.";
        } else if (detail.includes("Unexpected error")) {
          // Extract the actual error message from the SQL error
          const match = detail.match(
            /Key \(email\)=\(([^)]+)\) already exists/,
          );
          if (match) {
            const email = match[1];
            errorMessage = `The email address "${email}" is already registered. Please use a different email.`;
          } else {
            errorMessage =
              "An error occurred while creating the user. Please try again.";
          }
        } else {
          errorMessage = detail;
        }
      } else if (e?.message) {
        // Handle other error messages
        errorMessage = e.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

 

  function handleBulkUpload() {
    Navigate("bulk-upload")
  }

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
      <div className="mb-6 flex items-center gap-2 ml-4">
        <div>
          <h1 className="text-2xl font-bold">Add New User</h1>
          <p className="text-gray-500 text-sm">
            Onboard a new team member and assign their role and permissions
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("standard")}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === "standard"
              ? "bg-purple-700 text-white"
              : "bg-white border border-gray-300 text-gray-700"
          }`}
        >
          Standard User
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fieldWorker")}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === "fieldWorker"
              ? "bg-purple-700 text-white"
              : "bg-white border border-gray-300 text-gray-700"
          }`}
        >
          Field Worker (No Email)
        </button>

        {/* // Add button for bulk upload */}
        {/* // Add button for bulk upload */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("bulkUpload");
            handleBulkUpload();
          }}
          // onClick={handleBulkUpload}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === "bulkUpload"
              ? "bg-purple-700 text-white"
              : "bg-white border border-gray-300 text-gray-700"
          }`}
        >
          Bulk Upload
        </button>
      </div>

      <UserFormSection ref={formRef} mode={activeTab} />

      <RoleAssignmentSection
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        mode={activeTab}
      />

      {activeTab === "standard" && (
        <>
          <PermissionsSection
            selectedRole={selectedRole}
            permissions={permissions}
            setPermissions={setPermissions}
          />
          <SecuritySection
            password={password}
            setPassword={setPassword}
            forceChange={forceChange}
            setForceChange={setForceChange}
            twoFactor={twoFactor}
            setTwoFactor={setTwoFactor}
            sendInvite={sendInvite}
            setSendInvite={setSendInvite}
          />
        </>
      )}

      <FooterActions
        onSave={handleSave}
        loading={loading}
        isFormValid={true}
        mode={activeTab}
      />
    </div>
  );
};

export default UserRoles;
