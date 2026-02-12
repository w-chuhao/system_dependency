import express from "express";
import { getSession } from "../neo4j.js";

// Router for graph-related endpoints, mounted under /api/graph.
const router = express.Router();

// List all available systems for the dropdown.
router.get("/systems", async (_req, res) => {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (s:System)
      RETURN DISTINCT s.systemId AS systemId
      ORDER BY systemId
      `
    );

    const systems = result.records.map(r => r.get("systemId"));
    res.json({ systems });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    await session.close();
  }
});

// Fetch downstream dependency graph for a given systemId.
router.get("/downstream/:systemId", async (req, res) => {
  // Read systemId from the URL and open a Neo4j session.
  const { systemId } = req.params;
  const session = getSession();

  try {
    // Query paths up to depth 5 from the starting System node.
    const result = await session.run(
      `
      MATCH p= (failed:System {systemId:$id})-[:AFFECTS]->(affected:System)
      RETURN p
      `,
      { id: systemId }
    );

    // Deduplicate nodes and edges as we walk returned path segments.
    const nodes = new Map();
    const edges = new Map();

    for (const r of result.records) {
      const p = r.get("p");
      if (!p) continue;

      // Each segment is one hop in a path; collect its endpoints.
      for (const seg of p.segments) {
        const a = seg.start.properties.systemId;
        const b = seg.end.properties.systemId;

        const protocol =
          seg.relationship?.properties?.protocol ||
          seg.relationship?.properties?.protocal ||
          "AFFECTS";

        // Record unique nodes and edges for the response.
        nodes.set(a, { id: a });
        nodes.set(b, { id: b });
        edges.set(`${a}->${b}`, { from: a, to: b, protocol });
      }
    }

    // Ensure the root node is always included.
    nodes.set(systemId, { id: systemId });

    // Respond with arrays of unique nodes and edges.
    res.json({
      nodes: [...nodes.values()],
      edges: [...edges.values()]
    });
  } catch (e) {
    // Surface unexpected errors to the client.
    res.status(500).json({ error: e.message });
  } finally {
    // Always close the session to avoid leaks.
    await session.close();
  }
});

// Fetch systems affected by a failed systemId.
router.get("/affected/:systemId", async (req, res) => {
  const { systemId } = req.params;
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (failed:System {systemId:$id})-[:AFFECTS*1..]->(affected:System)
      RETURN DISTINCT affected.systemId AS systemId
      ORDER BY systemId
      `,
      { id: systemId }
    );

    const affected = result.records.map(r => r.get("systemId"));
    res.json({ affected });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    await session.close();
  }
});

// Fetch the full system graph (all nodes and direct edges).
router.get("/full", async (_req, res) => {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (a:System)-[r:AFFECTS]->(b:System)
      RETURN DISTINCT
        a.systemId AS from,
        b.systemId AS to,
        coalesce(r.protocol, r.protocal, "AFFECTS") AS protocol
      ORDER BY from, to
      `
    );

    const nodes = new Map();
    const edges = [];

    for (const r of result.records) {
      const from = r.get("from");
      const to = r.get("to");
      const protocol = r.get("protocol") || "AFFECTS";
      nodes.set(from, { id: from });
      nodes.set(to, { id: to });
      edges.push({ from, to, protocol });
    }

    res.json({
      nodes: [...nodes.values()],
      edges
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    await session.close();
  }
});

export default router;
