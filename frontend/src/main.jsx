import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [systems, setSystems] = useState([]);
  const [selected, setSelected] = useState("");
  const [affected, setAffected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load system list for the dropdown on mount.
  useEffect(() => {
    fetch("http://localhost:3001/api/graph/systems")
      .then(r => r.json())
      .then(data => setSystems(data.systems || []))
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
    fetch(`http://localhost:3001/api/graph/affected/${selected}`)
      .then(r => r.json())
      .then(data => setAffected(data.affected || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="page">
      <div className="card">
        <h1>System Impact</h1>
        <p>Select the system that is down to see affected systems.</p>

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

        {error ? <div className="error">{error}</div> : null}
        {loading ? <div className="status">Loading…</div> : null}

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
