export type Recall = {
  campaign: string;
  component: string;
  summary: string;
  remedy: string;
  date: string;
};

/** Open safety recalls for a US-market vehicle from NHTSA. Never throws: recalls are a bonus. */
export async function fetchRecalls(year: number, make: string, model: string): Promise<Recall[]> {
  const url = new URL("https://api.nhtsa.gov/recalls/recallsByVehicle");
  url.searchParams.set("make", make);
  url.searchParams.set("model", model);
  url.searchParams.set("modelYear", String(year));
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const body = await res.json();
    return (body.results ?? []).slice(0, 10).map((r: Record<string, string>) => ({
      campaign: r.NHTSACampaignNumber ?? "",
      component: r.Component ?? "",
      summary: r.Summary ?? "",
      remedy: r.Remedy ?? "",
      date: r.ReportReceivedDate ?? "",
    }));
  } catch {
    return [];
  }
}
