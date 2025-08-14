// routes/companyEmployees.js
import express from "express";
import { runQuery } from "../services/neo4jService.js";
import { resolveLinkedInUrl } from "../services/domainResolver.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { domain, userId } = req.body;
  if (!domain) return res.status(400).json({ error: "Domain is required" });

  try {
    const linkedinUrl = await resolveLinkedInUrl(domain);

    const result = await runQuery(
      `MATCH (c:Company {domain: $domain})
       OPTIONAL MATCH (p:Person)-[:PERSON_WORKS_AT]->(c)
       RETURN c AS company, collect(p) AS employees`,
      { domain }
    );

    // No company found in database → safe empty return
    if (!result.records || result.records.length === 0) {
      return res.json({
        linkedinUrl,
        company: {},
        employees: []
      });
    }

    const record = result.records[0];

    const company =
      record.has("company") && record.get("company")
        ? record.get("company").properties
        : {};

    const employees =
      record.has("employees") && record.get("employees")
        ? record.get("employees").map(e => e.properties)
        : [];

    res.json({ linkedinUrl, company, employees });
  } catch (err) {
    console.error("Error in /company-employees:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
