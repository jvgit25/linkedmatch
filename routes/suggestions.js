import express from "express";
import { runQuery } from "../services/neo4jService.js";
import { queryPerplexityForSuggestions } from "../services/perplexityHelper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  try {
    const result = await runQuery(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (u)-[:HAS_INTEREST]->(i:Interest)
       WITH u, collect(i.name) as interests
       RETURN u.role AS role, u.skills AS skills, interests`,
      { userId }
    );

    if (!result.records || result.records.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const rec = result.records[0];
    const userData = {
      role: rec.has("role") ? rec.get("role") : null,
      skills: rec.has("skills") ? rec.get("skills") || [] : [],
      interests: rec.has("interests") ? rec.get("interests") || [] : []
    };

    const suggestions = await queryPerplexityForSuggestions(userData);

    res.json({ userData, suggestions });
  } catch (err) {
    console.error("Error in /suggestions:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
