/**
 * @pages/api/predict.ts
 * @description Proxies POST requests to the backend's /predict endpoint.
 * This route is part of the Next.js API proxy layer to avoid CORS issues
 * and securely communicate with the backend services.
 */
import type { NextApiRequest, NextApiResponse } from "next";

import { BACKEND_BASE_URL } from "@/lib/server-config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const backendRes = await fetch(`${BACKEND_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Potentially forward other relevant headers from req.headers if needed
        },
        body: JSON.stringify(req.body), // req.body is already parsed by Next.js
      });

      const data = await backendRes.json(); // Assumes backend always returns JSON

      // Forward the status code and JSON response from the backend
      res.status(backendRes.status).json(data);

    } catch (error: any) {
      console.error("Error in /api/predict proxy:", error);
      res.status(500).json({ 
        message: "Error proxying to backend", 
        error: error.message || "Unknown error" 
      });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
