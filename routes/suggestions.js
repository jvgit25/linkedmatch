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

    if (result.records.length === 0) return res.status(404).json({ error: "User not found" });

    const userData = {
      role: result.records[0].get("role"),
      skills: result.records[0].get("skills") || [],
      interests: result.records[0].get("interests") || []
    };

    const suggestions = await queryPerplexityForSuggestions(userData);

    res.json({ userData, suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
