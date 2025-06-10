/**
 * @pages/api/labels.ts
 * @description Proxies GET requests to the backend's /labels endpoint.
 * This route is part of the Next.js API proxy layer to avoid CORS issues
 * and securely communicate with the backend services.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { BACKEND_BASE_URL } from "@/lib/server-config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const backendRes = await fetch(`${BACKEND_BASE_URL}/labels`, {
        method: "GET",
      });

      // It's good practice to check if the backend response was successful
      if (!backendRes.ok) {
        // Attempt to parse error response from backend, or use status text
        let errorBody = await backendRes.text(); // Use text first, as it might not be JSON
        try {
            errorBody = JSON.parse(errorBody); // Try to parse if it is JSON
        } catch (e) {
            // Keep as text if not JSON
        }
        console.error(`Backend error for /labels: ${backendRes.status}`, errorBody);
        return res.status(backendRes.status).json({ 
            message: `Error from backend: ${backendRes.statusText}`,
            details: errorBody 
        });
      }

      const data = await backendRes.json(); // Assumes backend returns JSON on success

      // Forward the status code and JSON response from the backend
      res.status(backendRes.status).json(data);

    } catch (error: any) {
      console.error("Error in /api/labels proxy:", error);
      res.status(500).json({ 
        message: "Error proxying to backend", 
        error: error.message || "Unknown error"
      });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
