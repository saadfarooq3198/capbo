export async function getDashboardSummary() {
  const tryFetch = async (url) => {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      return await r.json();
    } catch { 
      return null; 
    }
  };

  // Try multiple endpoints in order of preference
  const endpoints = [
    "/api/dashboard/summary",
    "/api/runs/summary", 
    "/api/projects/metrics",
    "/api/admin/dashboard"
  ];

  for (const endpoint of endpoints) {
    const result = await tryFetch(endpoint);
    if (result) return result;
  }
  
  return null;
}