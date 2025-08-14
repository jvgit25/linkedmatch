import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function queryPerplexityForLinkedIn(domain) {
  try {
    const prompt = `Find the official LinkedIn company page URL for the company whose domain is ${domain}. Respond only with the link.`;
    const res = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "llama-3.1-sonar-small-128k-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return res.data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("Perplexity API error:", err.message);
    return null;
  }
}

export async function queryPerplexityForSuggestions(userData) {
  try {
    const { role, skills, interests } = userData;
    const prompt = `
Given a LinkedIn user with the following profile:
Role: ${role}
Skills: ${skills.join(", ")}
Interests: ${interests.join(", ")}

Suggest 5 relevant LinkedIn profiles (people) that they might want to connect with.
Return each suggestion as JSON objects with fields: name, title, linkedinUrl.
Do not include extra explanation.
    `;

    const res = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "llama-3.1-sonar-small-128k-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(res.data?.choices?.[0]?.message?.content || "[]");
    } catch {
      parsed = res.data?.choices?.[0]?.message?.content || [];
    }
    return parsed;
  } catch (err) {
    console.error("Perplexity Suggestions Error:", err.message);
    return [];
  }
}
