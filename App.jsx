
import { useState, useEffect, useCallback } from "react";

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED = {
  users: [
    { id: "u1", role: "admin", name: "Admin", email: "admin@pm.dev", password: "admin123", avatar: "A", createdAt: "2024-01-01" },
    { id: "u2", role: "developer", name: "Priya Sharma", email: "priya@pm.dev", password: "dev123", avatar: "PS", department: "Frontend", skills: ["React", "CSS"], joinedAt: "2024-02-10", phone: "+91 98765 43210" },
    { id: "u3", role: "developer", name: "Arjun Nair", email: "arjun@pm.dev", password: "dev123", avatar: "AN", department: "Backend", skills: ["Node.js", "Python"], joinedAt: "2024-03-15", phone: "+91 87654 32109" },
  ],
  projects: [
    { id: "p1", name: "E-Commerce Platform", description: "Full-featured online store with payment integration", status: "Active", priority: "High", startDate: "2024-01-15", endDate: "2024-06-30", tags: ["web", "ecommerce"], createdAt: "2024-01-15" },
    { id: "p2", name: "Internal HR Portal", description: "Employee management and leave tracking system", status: "Planning", priority: "Medium", startDate: "2024-03-01", endDate: "2024-09-01", tags: ["internal", "hr"], createdAt: "2024-03-01" },
  ],
  tasks: [
    { id: "t1", title: "Design product listing page", description: "Create responsive grid layout for product catalog", projectId: "p1", assignedTo: "u2", status: "In Progress", priority: "High", dueDate: "2024-04-30", estimatedHours: 8, tags: ["ui", "design"], createdAt: "2024-03-01", updatedAt: "2024-03-15" },
    { id: "t2", title: "Build REST API for orders", description: "CRUD endpoints for order management", projectId: "p1", assignedTo: "u3", status: "To Do", priority: "High", dueDate: "2024-05-10", estimatedHours: 16, tags: ["api", "backend"], createdAt: "2024-03-05", updatedAt: "2024-03-05" },
    { id: "t3", title: "Implement leave request form", description: "Multi-step form with validation and email notifications", projectId: "p2", assignedTo: "u2", status: "To Do", priority: "Medium", dueDate: "2024-05-20", estimatedHours: 6, tags: ["form", "frontend"], createdAt: "2024-03-10", updatedAt: "2024-03-10" },
  ],
};

// ─── DB (LocalStorage) ────────────────────────────────────────────────────────
function getDB() {
  try {
    const raw = localStorage.getItem("pm_db");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function setDB(db) {
  localStorage.setItem("pm_db", JSON.stringify(db));
}
function initDB() {
  let db = getDB();
  if (!db) { db = SEED; setDB(db); }
  return db;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_COLORS = {
  "To Do": "#6366f1",
  "In Progress": "#f59e0b",
  "Completed": "#10b981",
  "Blocked": "#ef4444",
  "In Review": "#8b5cf6",
};
const PRIORITY_COLORS = { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" };
const PROJECT_STATUS = ["Planning", "Active", "On Hold", "Completed", "Cancelled"];
const TASK_STATUSES = ["To Do", "In Progress", "In Review", "Blocked", "Completed"];
const PRIORITIES = ["Low", "Medium", "High"];

// ─── Components ───────────────────────────────────────────────────────────────

function Badge({ label, color, small }) {
  return (
    <span style={{
      display: "inline-block",
      padding: small ? "2px 8px" : "3px 10px",
      borderRadius: 20,
      fontSize: small ? 10 : 11,
      fontWeight: 700,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      background: color + "22",
      color: color,
      border: `1px solid ${color}44`,
    }}>{label}</span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(4px)"
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#1a1d2e", border: "1px solid #2e3150", borderRadius: 16,
        width: "min(560px, 94vw)", maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid #2e3150" }}>
          <h3 style={{ margin: 0, color: "#e2e8f0", fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", background: "#0f1117", border: "1px solid #2e3150",
  borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 14,
  outline: "none", fontFamily: "inherit"
};

function Input({ ...props }) {
  return <input style={inputStyle} {...props} />;
}
function Select({ children, ...props }) {
  return <select style={{ ...inputStyle, cursor: "pointer" }} {...props}>{children}</select>;
}
function Textarea({ ...props }) {
  return <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} {...props} />;
}

function Btn({ children, onClick, variant = "primary", small, danger, style: s }) {
  const base = {
    border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700,
    fontSize: small ? 12 : 13, padding: small ? "6px 12px" : "10px 18px",
    fontFamily: "inherit", transition: "all 0.15s", letterSpacing: "0.02em"
  };
  const variants = {
    primary: { background: "#6366f1", color: "#fff" },
    secondary: { background: "#1e2235", color: "#94a3b8", border: "1px solid #2e3150" },
    ghost: { background: "transparent", color: "#6366f1" },
    danger: { background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440" },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...(danger ? variants.danger : variants[variant]), ...s }}>
      {children}
    </button>
  );
}

function Avatar({ initials, size = 32, color = "#6366f1" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color + "33",
      border: `2px solid ${color}66`, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.35, fontWeight: 800, color, flexShrink: 0
    }}>{initials}</div>
  );
}

function StatCard({ label, value, icon, color = "#6366f1" }) {
  return (
    <div style={{
      background: "#1a1d2e", border: "1px solid #2e3150", borderRadius: 14,
      padding: "20px 24px", display: "flex", alignItems: "center", gap: 16
    }}>
      <div style={{ fontSize: 28, width: 48, height: 48, background: color + "22", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#e2e8f0", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@pm.dev");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const handle = () => {
    const db = getDB();
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) { setError("Invalid credentials. Try admin@pm.dev / admin123"); return; }
    onLogin(user);
  };

  const demoLogins = [
    { label: "Admin", email: "admin@pm.dev", pass: "admin123", color: "#6366f1" },
    { label: "Dev: Priya", email: "priya@pm.dev", pass: "dev123", color: "#10b981" },
    { label: "Dev: Arjun", email: "arjun@pm.dev", pass: "dev123", color: "#f59e0b" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#0b0d14",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif"
    }}>
      <div style={{
        width: "min(420px, 92vw)", background: "#1a1d2e",
        border: "1px solid #2e3150", borderRadius: 20,
        padding: 40, boxShadow: "0 32px 100px rgba(0,0,0,0.5)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#e2e8f0", letterSpacing: "-0.5px" }}>ProjectFlow</h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>Project Management System</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick Demo Login</p>
          <div style={{ display: "flex", gap: 8 }}>
            {demoLogins.map(d => (
              <button key={d.label} onClick={() => { setEmail(d.email); setPassword(d.pass); setError(""); }}
                style={{ flex: 1, padding: "8px 4px", background: d.color + "15", border: `1px solid ${d.color}40`, borderRadius: 8, color: d.color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #2e3150", paddingTop: 20 }}>
          <Field label="Email" required>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@pm.dev" />
          </Field>
          <Field label="Password" required>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle()} placeholder="••••••••" />
          </Field>
          {error && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 16px" }}>{error}</p>}
          <Btn onClick={handle} style={{ width: "100%", padding: "12px" }}>Sign In →</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ user, active, setActive, onLogout }) {
  const adminNav = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "projects", icon: "📁", label: "Projects" },
    { id: "developers", icon: "👥", label: "Developers" },
    { id: "tasks", icon: "✓", label: "Tasks" },
  ];
  const devNav = [
    { id: "my-tasks", icon: "✓", label: "My Tasks" },
  ];
  const nav = user.role === "admin" ? adminNav : devNav;

  return (
    <div style={{
      width: 220, background: "#1a1d2e", borderRight: "1px solid #2e3150",
      display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, flexShrink: 0
    }}>
      <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid #2e3150" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 22 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: "#e2e8f0", letterSpacing: "-0.3px" }}>ProjectFlow</div>
            <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{user.role}</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
            borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit",
            fontWeight: 600, fontSize: 13, marginBottom: 4, transition: "all 0.15s",
            background: active === item.id ? "#6366f120" : "transparent",
            color: active === item.id ? "#818cf8" : "#64748b",
            borderLeft: active === item.id ? "3px solid #6366f1" : "3px solid transparent"
          }}>
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: "16px 12px", borderTop: "1px solid #2e3150" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Avatar initials={user.avatar || user.name[0]} size={34} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{user.email}</div>
          </div>
        </div>
        <Btn onClick={onLogout} variant="secondary" small style={{ width: "100%" }}>Sign Out</Btn>
      </div>
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#e2e8f0", letterSpacing: "-0.5px" }}>{title}</h2>
        {subtitle && <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function Dashboard({ db }) {
  const totalProjects = db.projects.length;
  const totalDevs = db.users.filter(u => u.role === "developer").length;
  const totalTasks = db.tasks.length;
  const completedTasks = db.tasks.filter(t => t.status === "Completed").length;

  const statusCount = TASK_STATUSES.reduce((acc, s) => {
    acc[s] = db.tasks.filter(t => t.status === s).length;
    return acc;
  }, {});

  const recentTasks = [...db.tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of all projects and tasks" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Projects" value={totalProjects} icon="📁" color="#6366f1" />
        <StatCard label="Developers" value={totalDevs} icon="👥" color="#10b981" />
        <StatCard label="Total Tasks" value={totalTasks} icon="📋" color="#f59e0b" />
        <StatCard label="Completed" value={completedTasks} icon="✅" color="#10b981" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#1a1d2e", border: "1px solid #2e3150", borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>Task Status Breakdown</h3>
          {TASK_STATUSES.map(s => (
            <div key={s} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{s}</span>
                <span style={{ fontSize: 13, color: STATUS_COLORS[s], fontWeight: 800 }}>{statusCount[s]}</span>
              </div>
              <div style={{ height: 6, background: "#0f1117", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: STATUS_COLORS[s],
                  width: totalTasks ? `${(statusCount[s] / totalTasks) * 100}%` : "0%",
                  transition: "width 0.6s ease"
                }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "#1a1d2e", border: "1px solid #2e3150", borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>Recent Activity</h3>
          {recentTasks.map(t => {
            const dev = db.users.find(u => u.id === t.assignedTo);
            const proj = db.projects.find(p => p.id === t.projectId);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Avatar initials={dev?.avatar || "?"} size={30} color={STATUS_COLORS[t.status]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{proj?.name} · {dev?.name}</div>
                </div>
                <Badge label={t.status} color={STATUS_COLORS[t.status]} small />
              </div>
            );
          })}
          {recentTasks.length === 0 && <p style={{ color: "#64748b", fontSize: 13 }}>No tasks yet.</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Projects CRUD ────────────────────────────────────────────────────────────
function ProjectForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name: "", description: "", status: "Planning", priority: "Medium", startDate: today(), endDate: "", tags: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim()) return alert("Project name is required");
    onSave({ ...form, tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [] });
  };

  return (
    <>
      <Field label="Project Name" required><Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. E-Commerce Platform" /></Field>
      <Field label="Description"><Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the project..." /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Status">
          <Select value={form.status} onChange={e => set("status", e.target.value)}>
            {PROJECT_STATUS.map(s => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onChange={e => set("priority", e.target.value)}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Start Date"><Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} /></Field>
        <Field label="End Date"><Input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} /></Field>
      </div>
      <Field label="Tags (comma-separated)"><Input value={typeof form.tags === "string" ? form.tags : form.tags?.join(", ")} onChange={e => set("tags", e.target.value)} placeholder="web, api, mobile" /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save}>{initial?.id ? "Save Changes" : "Create Project"}</Btn>
      </div>
    </>
  );
}

function Projects({ db, refresh }) {
  const [modal, setModal] = useState(null); // null | "create" | project object

  const save = (form) => {
    const d = getDB();
    if (form.id) {
      d.projects = d.projects.map(p => p.id === form.id ? { ...form } : p);
    } else {
      d.projects.push({ ...form, id: uid(), createdAt: today() });
    }
    setDB(d); refresh(); setModal(null);
  };

  const del = (id) => {
    if (!confirm("Delete this project? Related tasks will also be deleted.")) return;
    const d = getDB();
    d.projects = d.projects.filter(p => p.id !== id);
    d.tasks = d.tasks.filter(t => t.projectId !== id);
    setDB(d); refresh();
  };

  return (
    <div>
      <PageHeader title="Projects" subtitle={`${db.projects.length} total`}
        action={<Btn onClick={() => setModal("create")}>+ New Project</Btn>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {db.projects.map(p => {
          const taskCount = db.tasks.filter(t => t.projectId === p.id).length;
          const done = db.tasks.filter(t => t.projectId === p.id && t.status === "Completed").length;
          const pct = taskCount ? Math.round((done / taskCount) * 100) : 0;
          return (
            <div key={p.id} style={{ background: "#1a1d2e", border: "1px solid #2e3150", borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>{p.name}</h3>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small variant="secondary" onClick={() => setModal({ ...p, tags: p.tags?.join(", ") })}>Edit</Btn>
                  <Btn small danger onClick={() => del(p.id)}>Del</Btn>
                </div>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{p.description || "No description"}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <Badge label={p.status} color={p.status === "Active" ? "#10b981" : p.status === "Planning" ? "#6366f1" : "#64748b"} small />
                <Badge label={p.priority} color={PRIORITY_COLORS[p.priority]} small />
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                  <span>{done}/{taskCount} tasks</span><span>{pct}%</span>
                </div>
                <div style={{ height: 4, background: "#0f1117", borderRadius: 99 }}>
                  <div style={{ height: "100%", background: "#6366f1", borderRadius: 99, width: `${pct}%`, transition: "width 0.4s" }} />
                </div>
              </div>
              {p.tags?.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {p.tags.map(tag => <span key={tag} style={{ fontSize: 10, padding: "2px 8px", background: "#2e3150", borderRadius: 20, color: "#94a3b8", fontWeight: 600 }}>#{tag}</span>)}
                </div>
              )}
            </div>
          );
        })}
        {db.projects.length === 0 && <p style={{ color: "#64748b", gridColumn: "1/-1" }}>No projects yet. Create one!</p>}
      </div>

      {modal && (
        <Modal title={modal === "create" ? "New Project" : "Edit Project"} onClose={() => setModal(null)}>
          <ProjectForm initial={modal === "create" ? null : modal} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

// ─── Developers CRUD ──────────────────────────────────────────────────────────
function DevForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name: "", email: "", password: "dev123", department: "", phone: "", skills: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim() || !form.email.trim()) return alert("Name and email are required");
    onSave({ ...form, skills: form.skills ? form.skills.split(",").map(s => s.trim()) : [] });
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Full Name" required><Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Priya Sharma" /></Field>
        <Field label="Department"><Input value={form.department} onChange={e => set("department", e.target.value)} placeholder="e.g. Frontend" /></Field>
        <Field label="Email" required><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="dev@pm.dev" /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 99999 99999" /></Field>
        {!initial?.id && <Field label="Password" required><Input type="password" value={form.password} onChange={e => set("password", e.target.value)} /></Field>}
      </div>
      <Field label="Skills (comma-separated)"><Input value={typeof form.skills === "string" ? form.skills : form.skills?.join(", ")} onChange={e => set("skills", e.target.value)} placeholder="React, Node.js, Python" /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save}>{initial?.id ? "Save Changes" : "Add Developer"}</Btn>
      </div>
    </>
  );
}

const DEV_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

function Developers({ db, refresh }) {
  const [modal, setModal] = useState(null);
  const devs = db.users.filter(u => u.role === "developer");

  const save = (form) => {
    const d = getDB();
    if (form.id) {
      d.users = d.users.map(u => u.id === form.id ? { ...u, ...form } : u);
    } else {
      const initials = form.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
      d.users.push({ ...form, id: uid(), role: "developer", avatar: initials, joinedAt: today() });
    }
    setDB(d); refresh(); setModal(null);
  };

  const del = (id) => {
    if (!confirm("Remove this developer? Their tasks will be unassigned.")) return;
    const d = getDB();
    d.users = d.users.filter(u => u.id !== id);
    d.tasks = d.tasks.map(t => t.assignedTo === id ? { ...t, assignedTo: null } : t);
    setDB(d); refresh();
  };

  return (
    <div>
      <PageHeader title="Developers" subtitle={`${devs.length} team members`}
        action={<Btn onClick={() => setModal("create")}>+ Add Developer</Btn>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {devs.map((dev, i) => {
          const color = DEV_COLORS[i % DEV_COLORS.length];
          const myTasks = db.tasks.filter(t => t.assignedTo === dev.id);
          const done = myTasks.filter(t => t.status === "Completed").length;
          return (
            <div key={dev.id} style={{ background: "#1a1d2e", border: "1px solid #2e3150", borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Avatar initials={dev.avatar || dev.name[0]} size={44} color={color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: "#e2e8f0", fontSize: 14 }}>{dev.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{dev.department || "No dept."}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>📧 {dev.email}</div>
              {dev.phone && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>📞 {dev.phone}</div>}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
                {(dev.skills || []).map(s => <span key={s} style={{ fontSize: 10, padding: "2px 8px", background: color + "20", borderRadius: 20, color, fontWeight: 700, border: `1px solid ${color}33` }}>{s}</span>)}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
                Tasks: <strong style={{ color: "#e2e8f0" }}>{myTasks.length}</strong> · Done: <strong style={{ color: "#10b981" }}>{done}</strong>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn small variant="secondary" onClick={() => setModal({ ...dev, skills: dev.skills?.join(", ") })}>Edit</Btn>
                <Btn small danger onClick={() => del(dev.id)}>Remove</Btn>
              </div>
            </div>
          );
        })}
        {devs.length === 0 && <p style={{ color: "#64748b" }}>No developers yet.</p>}
      </div>

      {modal && (
        <Modal title={modal === "create" ? "Add Developer" : "Edit Developer"} onClose={() => setModal(null)}>
          <DevForm initial={modal === "create" ? null : modal} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

// ─── Tasks CRUD ───────────────────────────────────────────────────────────────
function TaskForm({ initial, db, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    title: "", description: "", projectId: db.projects[0]?.id || "",
    assignedTo: "", status: "To Do", priority: "Medium",
    dueDate: "", estimatedHours: "", tags: ""
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const devs = db.users.filter(u => u.role === "developer");

  const save = () => {
    if (!form.title.trim() || !form.projectId || !form.assignedTo) return alert("Title, project, and assignee are required");
    onSave({ ...form, tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [] });
  };

  return (
    <>
      <Field label="Task Title" required><Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Build login page" /></Field>
      <Field label="Description"><Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Detailed task description..." /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Project" required>
          <Select value={form.projectId} onChange={e => set("projectId", e.target.value)}>
            <option value="">Select project</option>
            {db.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Assign To" required>
          <Select value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)}>
            <option value="">Select developer</option>
            {devs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={e => set("status", e.target.value)}>
            {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onChange={e => set("priority", e.target.value)}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Due Date"><Input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} /></Field>
        <Field label="Estimated Hours"><Input type="number" value={form.estimatedHours} onChange={e => set("estimatedHours", e.target.value)} placeholder="8" min="0" /></Field>
      </div>
      <Field label="Tags (comma-separated)"><Input value={typeof form.tags === "string" ? form.tags : form.tags?.join(", ")} onChange={e => set("tags", e.target.value)} placeholder="ui, api, bug" /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save}>{initial?.id ? "Save Changes" : "Create Task"}</Btn>
      </div>
    </>
  );
}

function TaskCard({ task, db, onEdit, onDelete, showAssignee = true }) {
  const dev = db.users.find(u => u.id === task.assignedTo);
  const proj = db.projects.find(p => p.id === task.projectId);
  const overdue = task.dueDate && task.dueDate < today() && task.status !== "Completed";

  return (
    <div style={{ background: "#1a1d2e", border: `1px solid ${overdue ? "#ef444433" : "#2e3150"}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#e2e8f0", lineHeight: 1.3, flex: 1 }}>{task.title}</div>
        {onEdit && onDelete && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <Btn small variant="secondary" onClick={() => onEdit(task)}>Edit</Btn>
            <Btn small danger onClick={() => onDelete(task.id)}>Del</Btn>
          </div>
        )}
      </div>
      {task.description && <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{task.description}</p>}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        <Badge label={task.status} color={STATUS_COLORS[task.status]} small />
        <Badge label={task.priority} color={PRIORITY_COLORS[task.priority]} small />
        {overdue && <Badge label="Overdue" color="#ef4444" small />}
      </div>
      <div style={{ fontSize: 12, color: "#64748b", display: "flex", flexWrap: "wrap", gap: 12 }}>
        {proj && <span>📁 {proj.name}</span>}
        {showAssignee && dev && <span>👤 {dev.name}</span>}
        {task.dueDate && <span>📅 {task.dueDate}</span>}
        {task.estimatedHours && <span>⏱ {task.estimatedHours}h</span>}
      </div>
    </div>
  );
}

function Tasks({ db, refresh }) {
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState({ project: "", status: "", priority: "" });

  const filtered = db.tasks.filter(t =>
    (!filter.project || t.projectId === filter.project) &&
    (!filter.status || t.status === filter.status) &&
    (!filter.priority || t.priority === filter.priority)
  );

  const save = (form) => {
    const d = getDB();
    const now = today();
    if (form.id) {
      d.tasks = d.tasks.map(t => t.id === form.id ? { ...form, updatedAt: now } : t);
    } else {
      d.tasks.push({ ...form, id: uid(), createdAt: now, updatedAt: now });
    }
    setDB(d); refresh(); setModal(null);
  };

  const del = (id) => {
    if (!confirm("Delete this task?")) return;
    const d = getDB(); d.tasks = d.tasks.filter(t => t.id !== id);
    setDB(d); refresh();
  };

  return (
    <div>
      <PageHeader title="Tasks" subtitle={`${db.tasks.length} total`}
        action={<Btn onClick={() => setModal("create")}>+ New Task</Btn>} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <Select value={filter.project} onChange={e => setFilter(f => ({ ...f, project: e.target.value }))} style={{ ...inputStyle, width: "auto" }}>
          <option value="">All Projects</option>
          {db.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={{ ...inputStyle, width: "auto" }}>
          <option value="">All Statuses</option>
          {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
        </Select>
        <Select value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))} style={{ ...inputStyle, width: "auto" }}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </Select>
        {(filter.project || filter.status || filter.priority) &&
          <Btn small variant="ghost" onClick={() => setFilter({ project: "", status: "", priority: "" })}>Clear</Btn>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {filtered.map(t => (
          <TaskCard key={t.id} task={t} db={db}
            onEdit={task => setModal({ ...task, tags: task.tags?.join(", ") })}
            onDelete={del} />
        ))}
        {filtered.length === 0 && <p style={{ color: "#64748b", gridColumn: "1/-1" }}>No tasks found.</p>}
      </div>

      {modal && (
        <Modal title={modal === "create" ? "New Task" : "Edit Task"} onClose={() => setModal(null)}>
          <TaskForm initial={modal === "create" ? null : modal} db={db} onSave={save} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

// ─── Developer: My Tasks ──────────────────────────────────────────────────────
function MyTasks({ user, db, refresh }) {
  const myTasks = db.tasks.filter(t => t.assignedTo === user.id);
  const [updating, setUpdating] = useState(null);

  const updateStatus = (taskId, status) => {
    const d = getDB();
    d.tasks = d.tasks.map(t => t.id === taskId ? { ...t, status, updatedAt: today() } : t);
    setDB(d); refresh(); setUpdating(null);
  };

  const byStatus = TASK_STATUSES.reduce((acc, s) => {
    acc[s] = myTasks.filter(t => t.status === s);
    return acc;
  }, {});

  const done = myTasks.filter(t => t.status === "Completed").length;

  return (
    <div>
      <PageHeader title="My Tasks" subtitle={`${myTasks.length} assigned · ${done} completed`} />

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 28 }}>
        {TASK_STATUSES.map(s => (
          <div key={s} style={{ background: "#1a1d2e", border: "1px solid #2e3150", borderRadius: 12, padding: "14px 16px", borderTop: `3px solid ${STATUS_COLORS[s]}` }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: STATUS_COLORS[s] }}>{byStatus[s].length}</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Task list grouped by status */}
      {TASK_STATUSES.filter(s => byStatus[s].length > 0).map(s => (
        <div key={s} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS[s] }} />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s}</h3>
            <span style={{ fontSize: 12, color: "#64748b" }}>({byStatus[s].length})</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {byStatus[s].map(task => (
              <div key={task.id}>
                <TaskCard task={task} db={db} showAssignee={false} />
                {/* Status updater */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {TASK_STATUSES.filter(st => st !== task.status).map(st => (
                    <button key={st} onClick={() => updateStatus(task.id, st)}
                      style={{
                        fontSize: 11, padding: "4px 10px", borderRadius: 20,
                        border: `1px solid ${STATUS_COLORS[st]}44`, background: STATUS_COLORS[st] + "15",
                        color: STATUS_COLORS[st], cursor: "pointer", fontWeight: 700, fontFamily: "inherit"
                      }}>
                      → {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {myTasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>No tasks assigned to you yet!</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Check back later or contact your admin.</p>
        </div>
      )}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [db, setDb] = useState(null);

  const refresh = useCallback(() => setDb({ ...getDB() }), []);

  useEffect(() => { setDb(initDB()); }, []);

  if (!db) return <div style={{ background: "#0b0d14", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "sans-serif" }}>Loading…</div>;
  if (!user) return <Login onLogin={u => { setUser(u); setActive(u.role === "admin" ? "dashboard" : "my-tasks"); }} />;

  const renderPage = () => {
    if (user.role === "developer") return <MyTasks user={user} db={db} refresh={refresh} />;
    switch (active) {
      case "dashboard": return <Dashboard db={db} />;
      case "projects": return <Projects db={db} refresh={refresh} />;
      case "developers": return <Developers db={db} refresh={refresh} />;
      case "tasks": return <Tasks db={db} refresh={refresh} />;
      default: return <Dashboard db={db} />;
    }
  };

  return (
    <div style={{ display: "flex", background: "#0b0d14", minHeight: "100vh", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#e2e8f0" }}>
      <Sidebar user={user} active={active} setActive={setActive} onLogout={() => setUser(null)} />
      <main style={{ flex: 1, padding: "36px 40px", overflowY: "auto" }}>
        {renderPage()}
      </main>
    </div>
  );
}
