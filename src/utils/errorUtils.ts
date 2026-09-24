export function getApiErrorMessage(error: unknown, fallback: string = "An error occurred"): string {
  if (!error) return fallback;

  const anyError = error as {
    response?: {
      status?: number;
      data?: {
        message?: string;
        detail?: unknown;
        error?: string;
      };
    };
    message?: string;
  };

  const status = anyError?.response?.status;
  const data = anyError?.response?.data;

  // 1. Handle object detail (e.g. { message: "Access denied", required_module: "...", required_action: "...", your_role: "..." })
  if (data?.detail && typeof data.detail === "object" && !Array.isArray(data.detail)) {
    const detailObj = data.detail as Record<string, unknown>;
    const msg = typeof detailObj.message === "string" ? detailObj.message : undefined;
    const reqModule = typeof detailObj.required_module === "string" ? detailObj.required_module : undefined;
    const reqAction = typeof detailObj.required_action === "string" ? detailObj.required_action : undefined;
    const role = typeof detailObj.your_role === "string" ? detailObj.your_role : undefined;

    if (msg || reqModule || reqAction || role) {
      const parts: string[] = [];
      if (msg) parts.push(msg);
      if (reqModule) parts.push(`Required module: ${reqModule.replace(/_/g, " ")}`);
      if (reqAction) parts.push(`Action: ${reqAction.replace(/_/g, " ")}`);
      if (role) parts.push(`Role: ${role}`);
      return parts.join(" — ");
    }
  }

  // 2. Handle string detail
  if (typeof data?.detail === "string" && data.detail.trim()) {
    return data.detail.trim();
  }

  // 3. Handle array detail (e.g. FastAPI validation error arrays)
  if (Array.isArray(data?.detail) && data.detail.length > 0) {
    const first = data.detail[0] as { msg?: string; loc?: (string | number)[] };
    if (first?.msg) {
      const field = Array.isArray(first.loc) ? first.loc.filter((l) => l !== "body").join(".") : "";
      return field ? `${field}: ${first.msg}` : first.msg;
    }
  }

  // 4. Handle root message or error property
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim();
  }
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error.trim();
  }

  // 5. Handle HTTP 403 Forbidden explicitly
  if (status === 403) {
    return "Access denied: You do not have permission to perform this action.";
  }

  // 6. Handle HTTP 401 Unauthorized explicitly
  if (status === 401) {
    return "Session expired: Please log in again to continue.";
  }

  // 7. Non-generic Axios error message
  if (anyError?.message && !anyError.message.includes("Request failed with status code")) {
    return anyError.message;
  }

  return fallback;
}

export const formatApiErrorMessage = getApiErrorMessage;
