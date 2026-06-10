const USER_ID = "Rajat_Dwivedi_10/06/2004";
const EMAIL_ID = "rajat.dwivedi.btech2023@sitpune.edu.in";
const ENROLLMENT_NUMBER = "23070126100";

const EDGE_PATTERN = /^[A-Z]->[A-Z]$/;

function processEdges(edges) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const seen = new Set();
  const valid = [];

  for (let raw of edges) {
    const entry = typeof raw === "string" ? raw.trim() : String(raw).trim();

    if (!EDGE_PATTERN.test(entry)) {
      invalid_entries.push(raw);
      continue;
    }

    const [parent, child] = entry.split("->");

    if (parent === child) {
      invalid_entries.push(entry);
      continue;
    }

    if (seen.has(entry)) {
      if (!duplicate_edges.includes(entry)) duplicate_edges.push(entry);
      continue;
    }

    seen.add(entry);
    valid.push({ parent, child, edge: entry });
  }

  return { valid, invalid_entries, duplicate_edges };
}

function buildGraphStructures(validEdges) {
  const parentOf = {};
  const childrenOf = {};
  const allNodes = new Set();

  for (const { parent, child } of validEdges) {
    allNodes.add(parent);
    allNodes.add(child);

    if (parentOf[child] !== undefined) continue;

    parentOf[child] = parent;
    if (!childrenOf[parent]) childrenOf[parent] = [];
    childrenOf[parent].push(child);
  }

  const adj = {};
  for (const node of allNodes) adj[node] = new Set();

  for (const { parent, child } of validEdges) {
    if (parentOf[child] === parent) {
      adj[parent].add(child);
      adj[child].add(parent);
    }
  }

  const visited = new Set();
  const components = [];

  for (const node of [...allNodes].sort()) {
    if (visited.has(node)) continue;
    const group = [];
    const queue = [node];
    visited.add(node);
    while (queue.length) {
      const cur = queue.shift();
      group.push(cur);
      for (const nb of adj[cur]) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }
    components.push(group.sort());
  }

  const hierarchies = [];

  for (const group of components) {
    const roots = group.filter(n => parentOf[n] === undefined);
    const cyclic = hasCycle(group, childrenOf);

    if (cyclic) {
      hierarchies.push({ root: group[0], tree: {}, has_cycle: true });
    } else {
      const treeRoots = roots.length > 0 ? roots : [group[0]];
      for (const root of treeRoots) {
        hierarchies.push({
          root,
          tree: makeNestedTree(root, childrenOf),
          depth: getDepth(root, childrenOf),
        });
      }
    }
  }

  return hierarchies;
}

function hasCycle(nodes, childrenOf) {
  const state = {};
  for (const n of nodes) state[n] = 0;

  function dfs(node) {
    state[node] = 1;
    for (const ch of childrenOf[node] || []) {
      if (!state.hasOwnProperty(ch)) continue;
      if (state[ch] === 1) return true;
      if (state[ch] === 0 && dfs(ch)) return true;
    }
    state[node] = 2;
    return false;
  }

  for (const n of nodes) {
    if (state[n] === 0 && dfs(n)) return true;
  }
  return false;
}

function makeNestedTree(root, childrenOf) {
  const node = { [root]: {} };
  for (const ch of childrenOf[root] || []) {
    node[root][ch] = makeNestedTree(ch, childrenOf)[ch];
  }
  return node;
}

function getDepth(root, childrenOf) {
  const kids = childrenOf[root] || [];
  if (!kids.length) return 1;
  return 1 + Math.max(...kids.map(c => getDepth(c, childrenOf)));
}

function summarize(hierarchies) {
  const trees = hierarchies.filter(h => !h.has_cycle);
  const cycles = hierarchies.filter(h => h.has_cycle);

  let largest_tree_root = null;
  let maxDepth = -1;

  for (const h of trees) {
    if (h.depth > maxDepth || (h.depth === maxDepth && h.root < largest_tree_root)) {
      maxDepth = h.depth;
      largest_tree_root = h.root;
    }
  }

  return {
    total_trees: trees.length,
    total_cycles: cycles.length,
    largest_tree_root,
  };
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { edges } = req.body;

  if (!Array.isArray(edges)) {
    return res.status(400).json({ error: "'edges' must be an array" });
  }

  const { valid, invalid_entries, duplicate_edges } = processEdges(edges);
  const hierarchies = buildGraphStructures(valid);
  const summary = summarize(hierarchies);

  return res.status(200).json({
    user_id: USER_ID,
    email_id: EMAIL_ID,
    enrollment_number: ENROLLMENT_NUMBER,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary,
  });
}
