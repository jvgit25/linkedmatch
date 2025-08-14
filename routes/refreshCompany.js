import express from "express";
import { resolveLinkedInUrl } from "../services/domainResolver.js";
import { fetchCompanyData } from "../services/brightDataService.js";
import { runQuery } from "../services/neo4jService.js";

const router = express.Router();

const refreshTracker = {};

router.post("/", async (req, res) => {
  const { domain, userId, premium } = req.body;
  if (!domain || !userId) return res.status(400).json({ error: "Domain and userId required" });

  if (!premium) return res.status(403).json({ error: "Premium subscription required" });

  const now = Date.now();
  const dayKey = Math.floor(now / (24 * 60 * 60 * 1000));
  if (!refreshTracker[userId]) refreshTracker[userId] = {};
  if ((refreshTracker[userId][dayKey] || 0) >= 10) {
    return res.status(429).json({ error: "Daily refresh limit reached" });
  }

  try {
    const linkedinUrl = await resolveLinkedInUrl(domain);
    if (!linkedinUrl) return res.status(404).json({ error: "Unable to resolve LinkedIn URL" });

    const freshData = await fetchCompanyData(linkedinUrl);
    if (!freshData) return res.status(500).json({ error: "Bright Data fetch failed" });

    await runQuery(
      `MERGE (c:Company {domain: $domain})
       SET c.linkedinUrl = $url, c.lastUpdated = timestamp()
       WITH c
       UNWIND $employees AS emp
       MERGE (p:Person {id: emp.id})
       SET p += emp
       MERGE (p)-[:PERSON_WORKS_AT]->(c)`,
      { domain, url: linkedinUrl, employees: freshData.employees || [] }
    );

    refreshTracker[userId][dayKey] = (refreshTracker[userId][dayKey] || 0) + 1;

    res.json({
      success: true,
      linkedinUrl,
      updatedEmployees: freshData.employees?.length || 0,
      remainingRefreshes: 10 - refreshTracker[userId][dayKey]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
