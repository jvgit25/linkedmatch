import express from "express";
import { resolveLinkedInUrl } from "../services/domainResolver.js";
import { runQuery } from "../services/neo4jService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { domain, userId } = req.body;
  if (!domain) return res.status(400).json({ error: "Domain is required" });

  try {
    const linkedinUrl = await resolveLinkedInUrl(domain);

    // Fetch cached company and employees
    const data = await runQuery(
      `MATCH (c:Company {domain: $domain})
       OPTIONAL MATCH (p:Person)-[:PERSON_WORKS_AT]->(c)
       RETURN c AS company, collect(p) AS employees`,
      { domain }
    );

    res.json({
      linkedinUrl,
      company: data.records[0].get("company").properties || {},
      employees: data.records[0].get("employees").map(e => e.properties)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
