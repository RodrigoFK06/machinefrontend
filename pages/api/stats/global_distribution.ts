/**
 * @pages/api/stats/global_distribution.ts
 * @description Proxies GET requests to the backend's /stats/global_distribution endpoint.
 * This route is part of the Next.js API proxy layer to avoid CORS issues
 * and securely communicate with the backend services.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { BACKEND_BASE_URL } from "@/lib/server-config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // This endpoint does not seem to require query parameters from the client.
      const backendUrl = `${BACKEND_BASE_URL}/stats/global_distribution`;

      const backendRes = await fetch(backendUrl, {
        method: "GET",
      });

      if (!backendRes.ok) {
        let errorBody = await backendRes.text();
        try { errorBody = JSON.parse(errorBody); } catch (e) { /* Keep as text */ }
        console.error(`Backend error for /stats/global_distribution: ${backendRes.status}`, errorBody);
        return res.status(backendRes.status).json({ 
            message: `Error from backend: ${backendRes.statusText}`,
            details: errorBody 
        });
      }

      const data = await backendRes.json();
      res.status(backendRes.status).json(data);

    } catch (error: any) {
      console.error("Error in /api/stats/global_distribution proxy:", error);
      res.status(500).json({ 
        message: "Error proxying to backend", 
        error: error.message || "Unknown error"
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
