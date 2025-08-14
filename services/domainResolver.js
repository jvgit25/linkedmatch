import { runQuery } from "./neo4jService.js";
import { queryPerplexityForLinkedIn } from "./perplexityHelper.js";

const staticDomainMap = {
  "example.com": "https://www.linkedin.com/company/example"
};

export async function resolveLinkedInUrl(domain) {
  // Try Perplexity AI first
  const urlFromPerplexity = await queryPerplexityForLinkedIn(domain);
  if (urlFromPerplexity) {
    await runQuery(
      `MERGE (c:Company {domain: $domain})
       SET c.linkedinUrl = $url, c.lastUpdated = timestamp()`,
      { domain, url: urlFromPerplexity }
    );
    return urlFromPerplexity;
  }

  // Fallback static map
  if (staticDomainMap[domain]) return staticDomainMap[domain];

  // Check Neo4j cache
  const cached = await runQuery(
    "MATCH (c:Company {domain: $domain}) RETURN c.linkedinUrl AS url LIMIT 1",
    { domain }
  );
  if (cached.records.length > 0) {
    return cached.records[0].get("url");
  }
  return null;
}
