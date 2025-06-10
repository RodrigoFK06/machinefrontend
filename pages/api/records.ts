/**
 * @pages/api/records.ts
 * @description Proxies GET requests to the backend's /records endpoint.
 * This route handles query parameters like 'nickname', 'page', and 'limit'.
 * It's part of the Next.js API proxy layer to avoid CORS issues
 * and securely communicate with the backend services.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { BACKEND_BASE_URL } from "@/lib/server-config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Extract query parameters from the incoming request
      const { nickname, page, limit } = req.query;
      
      // Construct the URL for the backend, forwarding query parameters
      const backendUrl = new URL(`${BACKEND_BASE_URL}/records`);
      if (nickname) backendUrl.searchParams.append("nickname", Array.isArray(nickname) ? nickname[0] : nickname);
      if (page) backendUrl.searchParams.append("page", Array.isArray(page) ? page[0] : page);
      if (limit) backendUrl.searchParams.append("limit", Array.isArray(limit) ? limit[0] : limit);

      const backendRes = await fetch(backendUrl.toString(), {
        method: "GET",
      });

      if (!backendRes.ok) {
        let errorBody = await backendRes.text();
        try { errorBody = JSON.parse(errorBody); } catch (e) { /* Keep as text */ }
        console.error(`Backend error for /records: ${backendRes.status}`, errorBody);
        return res.status(backendRes.status).json({ 
            message: `Error from backend: ${backendRes.statusText}`,
            details: errorBody 
        });
      }

      const data = await backendRes.json();
      res.status(backendRes.status).json(data);

    } catch (error: any) {
      console.error("Error in /api/records proxy:", error);
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
