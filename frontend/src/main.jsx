import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import CytoscapeComponent from "react-cytoscapejs";
import "./style.css";

function App() {
  const [systems, setSystems] = useState([]);
  const [selected, setSelected] = useState("");
  const [affected, setAffected] = useState([]);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cyRef = useRef(null);

  // Load system list for the dropdown on mount.
  useEffect(() => {
    fetch("http://localhost:3001/api/graph/systems")
      .then(r => r.json())
      .then(data => setSystems(data.systems || []))
      .catch(e => setError(e.message));
  }, []);

  // Load the full graph once so it renders immediately.
  useEffect(() => {
    fetch("http://localhost:3001/api/graph/full")
      .then(r => r.json())
      .then(data =>
        setGraph({
          nodes: data.nodes || [],
          edges: data.edges || []
        })
      )
      .catch(e => setError(e.message));
  }, []);

  // Fetch affected systems when a selection changes.
  useEffect(() => {
    if (!selected) {
      setAffected([]);
      return;
    }

    setLoading(true);
    setError("");
    // Fetch affected list for the summary panel.
    const affectedReq = fetch(
      `http://localhost:3001/api/graph/affected/${selected}`
    )
      .then(r => r.json())
      .then(data => setAffected(data.affected || []));

    Promise.all([affectedReq])
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected]);

  // Convert API nodes/edges into Cytoscape elements.
  const affectedSet = new Set(affected);
  const elements = [
    ...graph.nodes.map(n => ({
      data: {
        id: n.id,
        label: n.id,
        status:
          n.id === selected
            ? "selected"
            : affectedSet.has(n.id)
            ? "affected"
            : "normal"
      }
    })),
    ...graph.edges.map(e => ({
      data: {
        id: `${e.from}->${e.to}`,
        source: e.from,
        target: e.to,
        label: e.protocol || "AFFECTS"
      }
    }))
  ];

  // Re-run layout after elements change so nodes are positioned visibly.
  useEffect(() => {
    if (!cyRef.current || elements.length === 0) return;
    cyRef.current.layout({
      name: "cose",
      fit: true,
      padding: 24,
      animate: false,
      randomize: true
    }).run();
  }, [elements]);

  return (
    <div className="page">
      <div className="topbar">
        <h1>System Impact</h1>
        <label className="field">
          <span>Down system</span>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            <option value="">Select a system</option>
            {systems.map(id => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="status">Loading…</div> : null}

      <div className="layout">
        <div className="graph">
          <h2>Dependency graph</h2>
          {/* Cytoscape renders a draggable graph from nodes + edges. */}
          <CytoscapeComponent
            elements={elements}
            // Use a force-directed layout so nodes start separated.
            layout={{ name: "cose", fit: true, padding: 24, animate: false, randomize: true }}
            className="graph-canvas"
            stylesheet={[
              {
                selector: "node",
                style: {
                  "background-color": "#E3A33B",
                  label: "data(label)",
                  "text-valign": "center",
                  "text-halign": "center",
                  "text-wrap": "wrap",
                  "text-max-width": "90px",
                  color: "#1b1b1b",
                  "font-size": "11px",
                  width: 96,
                  height: 96
                }
              },
              {
                selector: "node[status = 'selected']",
                style: {
                  "background-color": "#1f3a63",
                  color: "#ffffff",
                  "font-weight": "700"
                }
              },
              {
                selector: "node[status = 'affected']",
                style: {
                  "background-color": "#d43a3a",
                  color: "#ffffff",
                  "font-weight": "700"
                }
              },
              {
                selector: "edge",
                style: {
                  label: "data(label)",
                  "curve-style": "bezier",
                  "target-arrow-shape": "triangle",
                  "target-arrow-color": "#95a3b5",
                  "line-color": "#95a3b5",
                  "font-size": "9px",
                  "text-rotation": "autorotate",
                  "text-margin-y": -8
                }
              }
            ]}
            cy={cy => {
              cyRef.current = cy;
            }}
          />
        </div>

        <div className="results">
          <h2>Affected systems</h2>
          {selected && affected.length === 0 && !loading ? (
            <div className="status">No affected systems found.</div>
          ) : null}
          <ul>
            {affected.map(id => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById("app");
if (root) {
  createRoot(root).render(<App />);
}

export default App;
