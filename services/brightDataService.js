import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function fetchCompanyData(linkedinUrl) {
  try {
    const res = await axios.post(
      "https://api.brightdata.com/datasets/v1/data",
      {
        query: linkedinUrl,
        format: "json",
        limit: 50
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.BRIGHTDATA_API_KEY}`
        }
      }
    );
    return res.data || {};
  } catch (err) {
    console.error("Bright Data API error:", err.message);
    return null;
  }
}
