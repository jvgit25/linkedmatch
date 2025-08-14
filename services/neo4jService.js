import neo4j from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config();

// Create Neo4j Driver
const driver = neo4j.driver(
  process.env.NEO4J_URI, // neo4j+s://...
  neo4j.auth.basic(
    process.env.NEO4J_USER,        // "neo4j"
    process.env.NEO4J_PASSWORD     // your password
  )
);

// Helper: run any Cypher query
export const runQuery = async (query, params = {}) => {
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result;
  } finally {
    await session.close();
  }
};

// OPTIONAL: test connection on startup
(async () => {
  try {
    const res = await runQuery("RETURN 1 AS test");
    console.log("✅ Neo4j connected, test result:", res.records[0].get("test"));
  } catch (err) {
    console.error("❌ Neo4j connection failed:", err);
  }
})();
