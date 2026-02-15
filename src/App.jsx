import { memo, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

/* ---------- Simple UI Components (No shadcn needed) ---------- */

const Card = ({ className = "", children }) => (
  <div className={`rounded-2xl border ${className}`}>{children}</div>
);

const CardContent = ({ className = "", children }) => (
  <div className={className}>{children}</div>
);

const Button = ({ variant, className = "", ...props }) => (
  <button
    className={`px-3 py-2 rounded-md border text-sm font-medium ${
      variant === "outline"
        ? "bg-transparent"
        : "bg-gray-900 text-white border-gray-900"
    } ${className}`}
    {...props}
  />
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`px-3 py-2 rounded-md border text-sm w-full ${className}`}
    {...props}
  />
);

/* ---------- Constants ---------- */

const STATUS_OPTIONS = [
  { key: "todo", label: "To Do", dot: "bg-blue-500" },
  { key: "ongoing", label: "Ongoing", dot: "bg-teal-500" },
  { key: "completed", label: "Completed", dot: "bg-green-500" }
];

const pad2 = n => String(n).padStart(2, "0");

const toISODate = d =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const fromISODate = iso => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const todayISO = () => toISODate(new Date());

/* ---------- Toast ---------- */

function Toast({ show, message, dark }) {
  return (
    <div
      className={`fixed bottom-4 right-4 transition-all duration-200 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`px-3 py-2 rounded-xl border shadow ${
          dark
            ? "bg-neutral-900 border-neutral-700 text-white"
            : "bg-white border-gray-200"
        }`}
      >
        {message}
      </div>
    </div>
  );
}

/* ============================================================ */
/* ======================= MAIN APP =========================== */
/* ============================================================ */

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });

  const fileInputRef = useRef(null);

  const showToast = message => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 2000);
  };

  const addTask = () => {
    if (!input.trim()) return;

    setTasks(prev => [
      ...prev,
      {
        id: Date.now(),
        text: input,
        status: "todo"
      }
    ]);
    setInput("");
  };

  const updateStatus = (id, status) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, status } : t))
    );
  };

  const deleteTask = id => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const saveAll = () => {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "tasks.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  const loadAll = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!Array.isArray(parsed)) throw new Error();
        setTasks(parsed);
        showToast("Load successful");
      } catch {
        showToast("Invalid file");
      }
    };
    reader.readAsText(file);
  };

  const grouped = useMemo(
    () => ({
      todo: tasks.filter(t => t.status === "todo"),
      ongoing: tasks.filter(t => t.status === "ongoing"),
      completed: tasks.filter(t => t.status === "completed")
    }),
    [tasks]
  );

  return (
    <div className={dark ? "dark" : ""}>
      <Toast show={toast.show} message={toast.message} dark={dark} />
      <div
        className={`min-h-screen p-6 ${
          dark ? "bg-neutral-950 text-white" : "bg-neutral-100"
        }`}
      >
        <div className="max-w-4xl mx-auto space-y-6">

          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Geneco, Power the Change!
          </h1>

          <div className="flex gap-2">
            <Input
              placeholder="Add task..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTask()}
            />
            <Button onClick={addTask}>Add</Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDark(v => !v)}>
              {dark ? "Light" : "Dark"}
            </Button>
            <Button variant="outline" onClick={saveAll}>
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current.click()}
            >
              Load
            </Button>
            <input
              type="file"
              hidden
              accept="application/json"
              ref={fileInputRef}
              onChange={loadAll}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {["todo", "ongoing", "completed"].map(status => (
              <Card key={status}>
                <CardContent className="p-4 space-y-2">
                  <h2 className="font-semibold capitalize">{status}</h2>
                  {grouped[status].map(task => (
                    <div
                      key={task.id}
                      className="border rounded p-2 flex justify-between items-center"
                    >
                      <span>{task.text}</span>
                      <div className="flex gap-2">
                        <select
                          value={task.status}
                          onChange={e =>
                            updateStatus(task.id, e.target.value)
                          }
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => deleteTask(task.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
