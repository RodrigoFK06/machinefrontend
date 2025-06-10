export const BACKEND_URL =
  (process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://machinelear.onrender.com").replace(/\/$/, "");

if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
  console.warn(
    "NEXT_PUBLIC_BACKEND_URL is not defined, using default",
    BACKEND_URL,
  );
}
