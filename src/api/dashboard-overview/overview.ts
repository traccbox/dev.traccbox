const ROOT_URL = "https://api.traccbox.com/api/v1";

export async function getStaffAnalytics(company_id) {
  const response = await fetch(
    `${ROOT_URL}/companies/staff-analytics?company_id=${company_id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    // Extract backend-designed error message
    throw new Error(
      data?.message || data?.detail || data?.error || "Something went wrong",
    );
  }

  return data;
}
