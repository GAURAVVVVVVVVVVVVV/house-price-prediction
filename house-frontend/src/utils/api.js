const BASE = "http://localhost:8000";

export const getOptions = async () => {
  const res = await fetch(`${BASE}/options`);
  return res.json();
};

export const predictPrice = async (payload) => {
  const res = await fetch(`${BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
};

export const compareCities = async (params) => {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/compare?${q}`);
  return res.json();
};

export const getMetadata = async () => {
  const res = await fetch(`${BASE}/metadata`);
  return res.json();
};
