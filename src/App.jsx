import { memo, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

const Card = ({ className = "", children }) => (
  <div className={`rounded-2xl border ${className}`}>{children}</div>
);

const CardContent = ({ className = "", children }) => (
  <div className={className}>{children}</div>
);

const Button = ({ variant, className = "", ...props }) => (
  <button
    className={[
      "px-3 py-2 rounded-md border text-sm font-medium transition-colors",
      "disabled:opacity-40 disabled:cursor-not-allowed",
      variant === "outline"
        ? [
            "bg-transparent",
            "text-neutral-900 border-gray-300 hover:bg-gray-100",
            "dark:text-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          ].join(" ")
        : [
            "bg-gray-900 text-white border-gray-900 hover:bg-gray-800",
            "dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 dark:hover:bg-neutral-200"
          ].join(" "),
      className
    ].join(" ")}
    {...props}
  />
);


const Input = ({ className = "", ...props }) => (
  <input
    className={`px-3 py-2 rounded-md border text-sm w-full ${className}`}
    {...props}
  />
);

const STATUS_OPTIONS = [
  { key: "todo", label: "To Do", dot: "bg-blue-500" },
  { key: "ongoing", label: "Ongoing", dot: "bg-teal-500" },
  { key: "completed", label: "Completed", dot: "bg-green-500" }
];

const pad2 = n => String(n).padStart(2, "0");

const toISODate = d => {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

const fromISODate = iso => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const addDays = (iso, days) => {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

const isoLTE = (a, b) => a <= b;

const todayISO = () => toISODate(new Date());

const weekdayIndexMonFirst = iso => {
  const d = fromISODate(iso);
  const js = d.getDay(); // 0 Sun .. 6 Sat
  return (js + 6) % 7; // 0 Mon .. 6 Sun
};

const deepClone = obj => {
  try {
    // modern browsers
    // eslint-disable-next-line no-undef
    if (typeof structuredClone === "function") return structuredClone(obj);
  } catch {}
  return JSON.parse(JSON.stringify(obj));
};

function Toast({ show, message, dark }) {
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-200 pointer-events-none ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`pointer-events-none px-3 py-2 rounded-xl border shadow-lg text-sm ${
          dark
            ? "bg-neutral-900 border-neutral-700 text-neutral-100"
            : "bg-white border-gray-200 text-neutral-900"
        }`}
      >
        {message}
      </div>
    </div>
  );
}

const StatusMenu = memo(function StatusMenu({ taskId, onPick, dark }) {
  return (
    <div
      className={`absolute top-12 left-0 border rounded-xl shadow-lg w-40 overflow-hidden z-10 ${
        dark ? "bg-neutral-900 border-neutral-700" : "bg-white"
      }`}
    >
      {STATUS_OPTIONS.map(item => (
        <button
          key={item.key}
          onClick={() => onPick(taskId, item.key)}
          className={`w-full px-3 py-2 flex items-center gap-2 text-sm ${
            dark ? "hover:bg-neutral-800" : "hover:bg-gray-100"
          }`}
        >
          <span className={`w-3 h-3 rounded-full ${item.dot}`} />
          <span className={dark ? "text-neutral-100" : "text-neutral-900"}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
});

const TaskCard = memo(function TaskCard({
  task,
  dark,
  openMenu,
  setOpenMenu,
  editingId,
  editingText,
  setEditingText,
  startEdit,
  saveEdit,
  deleteTask,
  onPickStatus,
  onDragStart
}) {
  const isCompleted = task.status === "completed";
  const isEditing = editingId === task.id;

  return (
    <motion.div
      layout
      initial={false}
      draggable
      onDragStart={e => onDragStart(e, task.id)}
      className={`relative rounded-xl border p-3 flex items-start gap-3 shadow-sm cursor-grab min-w-0 ${
        dark
          ? isCompleted
            ? "bg-green-950/30 border-green-700"
            : "bg-neutral-950 border-neutral-800"
          : isCompleted
          ? "bg-green-50 border-green-500"
          : "bg-white"
      }`}
    >
      <button
        onClick={() => setOpenMenu(openMenu === task.id ? null : task.id)}
        className={`w-6 h-6 shrink-0 rounded-md border flex items-center justify-center mt-0.5 ${
          isCompleted
            ? "bg-green-500 text-white border-green-500"
            : "border-blue-500"
        }`}
        aria-label="Change status"
      >
        {isCompleted && "✓"}
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            className={`w-full border rounded px-2 py-1 text-sm ${
              dark
                ? "bg-neutral-900 border-neutral-700 text-neutral-100"
                : "bg-white"
            }`}
            value={editingText}
            onChange={e => setEditingText(e.target.value)}
            onBlur={() => saveEdit(task.id)}
            onKeyDown={e => e.key === "Enter" && saveEdit(task.id)}
            autoFocus
          />
        ) : (
          <p
            className={`text-sm whitespace-pre-wrap break-words leading-snug ${
              isCompleted ? "line-through opacity-60" : ""
            } ${dark ? "text-neutral-100" : "text-neutral-900"}`}
          >
            {task.text}
          </p>
        )}
      </div>

      <button
        onClick={() => startEdit(task)}
        className={`shrink-0 px-2 py-1 rounded ${
          dark ? "hover:bg-neutral-800" : "hover:bg-gray-100"
        }`}
        title="Edit"
        aria-label="Edit"
      >
        ✏️
      </button>

      <button
        onClick={() => deleteTask(task.id)}
        className={`shrink-0 px-2 py-1 rounded ${
          dark ? "hover:bg-red-950/40" : "hover:bg-red-100"
        }`}
        title="Delete"
        aria-label="Delete"
      >
        🗑️
      </button>

      {openMenu === task.id && (
        <StatusMenu taskId={task.id} onPick={onPickStatus} dark={dark} />
      )}
    </motion.div>
  );
});

const Column = memo(function Column({
  title,
  keyName,
  color,
  dark,
  items,
  onDrop,
  onDragOver,
  renderTask
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold" style={{ color }}>
        ● {title}
      </h2>

      <div
        onDrop={e => onDrop(e, keyName)}
        onDragOver={onDragOver}
        className={`border border-dashed rounded-2xl p-4 min-h-32 space-y-2 ${
          dark ? "bg-neutral-900/40 border-neutral-700" : "bg-white/50"
        }`}
      >
        {items.length === 0 ? (
          <p
            className={`text-sm text-center ${
              dark ? "text-neutral-400" : "text-muted-foreground"
            }`}
          >
            Drop tasks here
          </p>
        ) : (
          items.map(renderTask)
        )}
      </div>
    </div>
  );
});

const CalendarMonth = memo(function CalendarMonth({
  dark,
  monthAnchor,
  selectedDate,
  markedDates,
  onPrev,
  onNext,
  onSelect
}) {
  const year = monthAnchor.getFullYear();
  const monthIdx = monthAnchor.getMonth();

  const firstOfMonth = new Date(year, monthIdx, 1);
  const lastOfMonth = new Date(year, monthIdx + 1, 0);
  const daysInMonth = lastOfMonth.getDate();

  // Monday-first grid
  const jsDay = firstOfMonth.getDay();
  const mondayFirstIndex = (jsDay + 6) % 7;

  const monthLabel = monthAnchor.toLocaleString(undefined, {
    month: "long",
    year: "numeric"
  });

  const cells = [];
  for (let i = 0; i < mondayFirstIndex; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, monthIdx, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          className={`px-2 py-1 rounded ${
            dark ? "hover:bg-neutral-800 text-neutral-200" : "hover:bg-gray-100"
          }`}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div
          className={dark ? "text-neutral-200 font-semibold" : "font-semibold"}
        >
          {monthLabel}
        </div>
        <button
          onClick={onNext}
          className={`px-2 py-1 rounded ${
            dark ? "hover:bg-neutral-800 text-neutral-200" : "hover:bg-gray-100"
          }`}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs">
        {weekday.map(w => (
          <div
            key={w}
            className={`text-center ${
              dark ? "text-neutral-400" : "text-neutral-500"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((dateObj, idx) => {
          if (!dateObj) return <div key={idx} />;

          const iso = toISODate(dateObj);
          const isSelected = iso === selectedDate;
          const isMarked = markedDates.has(iso);

          return (
            <button
              key={iso}
              onClick={() => onSelect(iso)}
              className={`relative h-10 rounded-xl border flex items-center justify-center text-sm ${
                dark ? "border-neutral-800" : "border-gray-200"
              } ${
                isSelected
                  ? dark
                    ? "bg-neutral-800 text-neutral-100"
                    : "bg-gray-900 text-white"
                  : dark
                  ? "bg-neutral-950 text-neutral-200 hover:bg-neutral-900"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {dateObj.getDate()}
              {isMarked && (
                <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </button>
          );
        })}
      </div>

      <p className={`text-xs ${dark ? "text-neutral-500" : "text-neutral-500"}`}>
        Marked dates indicate at least 1 task.
      </p>
    </div>
  );
});

export default function TasksForTheDayApp() {
  // History model: { [YYYY-MM-DD]: Task[] }
  const [history, setHistory] = useState(() => ({ [todayISO()]: [] }));
  const [selectedDate, setSelectedDate] = useState(() => todayISO());
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const d = fromISODate(todayISO());
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [input, setInput] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [dark, setDark] = useState(false);

  // Repeat UI state
  const [repeatMode, setRepeatMode] = useState("none"); // none | daily | everyN | weekly
  const [everyN, setEveryN] = useState(2);
  const [weeklyDays, setWeeklyDays] = useState(() => new Set([0])); // Mon-first indices
  const [repeatUntil, setRepeatUntil] = useState(() => todayISO());

  // Undo/redo stacks (snapshots of { history, selectedDate })
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const fileInputRef = useRef(null);

  // Toast
  const [toast, setToast] = useState({ show: false, message: "" });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, ms = 2000) => {
    setToast({ show: true, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(t => ({ ...t, show: false }));
    }, ms);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const pushUndoSnapshot = useCallback(
    () => {
      const snap = deepClone({ history, selectedDate });
      setUndoStack(prev => {
        const next = [...prev, snap];
        // keep last 50 steps
        return next.length > 50 ? next.slice(next.length - 50) : next;
      });
      setRedoStack([]);
    },
    [history, selectedDate]
  );

  const resetTransientUI = useCallback(() => {
    setOpenMenu(null);
    setEditingId(null);
  }, []);

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const current = deepClone({ history, selectedDate });

      setRedoStack(rp => [...rp, current]);
      setHistory(last.history);
      setSelectedDate(last.selectedDate);
      resetTransientUI();

      return prev.slice(0, -1);
    });
  }, [history, selectedDate, resetTransientUI]);

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const current = deepClone({ history, selectedDate });

      setUndoStack(up => [...up, current]);
      setHistory(last.history);
      setSelectedDate(last.selectedDate);
      resetTransientUI();

      return prev.slice(0, -1);
    });
  }, [history, selectedDate, resetTransientUI]);

  // ---------- derived: tasks for selected date ----------
  const tasks = useMemo(
    () => history[selectedDate] ?? [],
    [history, selectedDate]
  );

  const completed = useMemo(
    () => tasks.filter(t => t.status === "completed").length,
    [tasks]
  );

  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const grouped = useMemo(
    () => ({
      todo: tasks.filter(t => t.status === "todo"),
      ongoing: tasks.filter(t => t.status === "ongoing"),
      completed: tasks.filter(t => t.status === "completed")
    }),
    [tasks]
  );

  const dayCounts = useMemo(() => {
    const c = { todo: 0, ongoing: 0, completed: 0 };
    for (const t of tasks) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [tasks]);

  const markedDates = useMemo(() => {
    const s = new Set();
    for (const [date, arr] of Object.entries(history)) {
      if (Array.isArray(arr) && arr.length > 0) s.add(date);
    }
    return s;
  }, [history]);

  const hasAnyTasks = useMemo(() => {
    for (const arr of Object.values(history)) {
      if (Array.isArray(arr) && arr.length > 0) return true;
    }
    return false;
  }, [history]);

  // keep month in sync when selected date changes
  useEffect(() => {
    const d = fromISODate(selectedDate);
    setMonthAnchor(new Date(d.getFullYear(), d.getMonth(), 1));

    // keep repeatUntil at least selectedDate
    setRepeatUntil(prev => (prev && prev >= selectedDate ? prev : selectedDate));
  }, [selectedDate]);

  // ---------- helpers ----------
  const ensureDateBucket = useCallback(dateStr => {
    setHistory(prev => {
      if (prev[dateStr]) return prev;
      return { ...prev, [dateStr]: [] };
    });
  }, []);

  const onSelectDate = useCallback(
    dateStr => {
      const v = dateStr || todayISO();
      ensureDateBucket(v);
      setSelectedDate(v);
      setOpenMenu(null);
      setEditingId(null);
      setInput("");
    },
    [ensureDateBucket]
  );

  // ---------- actions ----------
  const addTask = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    pushUndoSnapshot();

    const baseId = Date.now();
    const until =
      repeatMode === "none" ? selectedDate : repeatUntil || selectedDate;

    // safety: prevent accidental huge generation
    const MAX_GENERATED = 730; // ~2 years

    const datesToAdd = [];

    if (repeatMode === "none") {
      datesToAdd.push(selectedDate);
    } else if (repeatMode === "daily") {
      let d = selectedDate;
      let guard = 0;
      while (isoLTE(d, until) && guard < MAX_GENERATED) {
        datesToAdd.push(d);
        d = addDays(d, 1);
        guard++;
      }
    } else if (repeatMode === "everyN") {
      const step = Math.max(1, Number(everyN) || 1);
      let d = selectedDate;
      let guard = 0;
      while (isoLTE(d, until) && guard < MAX_GENERATED) {
        datesToAdd.push(d);
        d = addDays(d, step);
        guard++;
      }
    } else if (repeatMode === "weekly") {
      let d = selectedDate;
      let guard = 0;
      while (isoLTE(d, until) && guard < MAX_GENERATED * 2) {
        const wd = weekdayIndexMonFirst(d);
        if (weeklyDays.has(wd)) datesToAdd.push(d);
        d = addDays(d, 1);
        guard++;
        if (datesToAdd.length >= MAX_GENERATED) break;
      }
      if (datesToAdd.length === 0) datesToAdd.push(selectedDate);
    }

    const seriesId = `r_${baseId}`;

    setHistory(prev => {
      const next = { ...prev };
      datesToAdd.forEach((dateStr, i) => {
        const current = next[dateStr] ? [...next[dateStr]] : [];
        current.push({
          id: baseId + i,
          text,
          status: "todo",
          seriesId
        });
        next[dateStr] = current;
      });
      return next;
    });

    setInput("");
  }, [
    input,
    selectedDate,
    repeatMode,
    repeatUntil,
    everyN,
    weeklyDays,
    pushUndoSnapshot
  ]);

  const setTasksForSelectedDate = useCallback(
    updater => {
      setHistory(prev => {
        const current = prev[selectedDate] ?? [];
        const nextArr = typeof updater === "function" ? updater(current) : updater;
        return { ...prev, [selectedDate]: nextArr };
      });
    },
    [selectedDate]
  );

  const updateStatus = useCallback(
    (id, status) => {
      pushUndoSnapshot();
      setTasksForSelectedDate(prev =>
        prev.map(t => (t.id === id ? { ...t, status } : t))
      );
      setOpenMenu(null);
    },
    [setTasksForSelectedDate, pushUndoSnapshot]
  );

  const deleteTask = useCallback(
    id => {
      pushUndoSnapshot();
      setTasksForSelectedDate(prev => prev.filter(t => t.id !== id));
    },
    [setTasksForSelectedDate, pushUndoSnapshot]
  );

  const startEdit = useCallback(task => {
    setEditingId(task.id);
    setEditingText(task.text);
  }, []);

  const saveEdit = useCallback(
    id => {
      pushUndoSnapshot();
      setTasksForSelectedDate(prev =>
        prev.map(t => (t.id === id ? { ...t, text: editingText } : t))
      );
      setEditingId(null);
    },
    [editingText, setTasksForSelectedDate, pushUndoSnapshot]
  );

  // ---------- drag & drop ----------
  const onDragStart = useCallback((e, id) => {
    e.dataTransfer.setData("taskId", String(id));
  }, []);

  const onDrop = useCallback(
    (e, status) => {
      e.preventDefault();
      const id = Number(e.dataTransfer.getData("taskId"));
      if (!id) return;
      updateStatus(id, status);
    },
    [updateStatus]
  );

  const onDragOver = useCallback(e => e.preventDefault(), []);

  // ---------- save/load (includes full history + dates) ----------
  const saveAll = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      selectedDate,
      history
    };

    const data = JSON.stringify(payload, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "tasks-history-backup.json";
    link.click();

    URL.revokeObjectURL(url);
  }, [history, selectedDate]);

  const loadAll = useCallback(
    e => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const parsed = JSON.parse(evt.target.result);

          if (parsed && typeof parsed === "object" && parsed.history) {
            const h = parsed.history;
            if (!h || typeof h !== "object") throw new Error();

            const cleanHistory = {};
            for (const [date, arr] of Object.entries(h)) {
              if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
              if (!Array.isArray(arr)) continue;
              cleanHistory[date] = arr.map(t => ({
                id: t.id ?? Date.now() + Math.random(),
                text: String(t.text ?? ""),
                status: ["todo", "ongoing", "completed"].includes(t.status)
                  ? t.status
                  : "todo",
                seriesId: t.seriesId
              }));
            }

            const fallbackDate = Object.keys(cleanHistory)[0] || todayISO();
            const sel =
              typeof parsed.selectedDate === "string" &&
              /^\d{4}-\d{2}-\d{2}$/.test(parsed.selectedDate)
                ? parsed.selectedDate
                : fallbackDate;

            // After a load, user has not performed any actions yet.
            // Reset undo/redo so buttons stay disabled until the next change.
            setUndoStack([]);
            setRedoStack([]);

            setHistory(
              Object.keys(cleanHistory).length
                ? cleanHistory
                : { [fallbackDate]: [] }
            );
            ensureDateBucket(sel);
            setSelectedDate(sel);
            resetTransientUI();
            showToast("Load successful");
          } else {
            throw new Error();
          }
        } catch {
          showToast("Invalid task history file", 2500);
        }

        e.target.value = "";
      };
      reader.readAsText(file);
    },
    [ensureDateBucket, resetTransientUI, showToast]
  );

  const onLoadClick = useCallback(() => {
    if (hasAnyTasks) {
      const ok = window.confirm(
        "Loading will replace your current tasks. Do you want to proceed?"
      );
      if (!ok) return;
    }
    fileInputRef.current?.click();
  }, [hasAnyTasks]);

  const renderTask = useCallback(
    task => (
      <TaskCard
        key={task.id}
        task={task}
        dark={dark}
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        editingId={editingId}
        editingText={editingText}
        setEditingText={setEditingText}
        startEdit={startEdit}
        saveEdit={saveEdit}
        deleteTask={deleteTask}
        onPickStatus={updateStatus}
        onDragStart={onDragStart}
      />
    ),
    [
      dark,
      openMenu,
      editingId,
      editingText,
      startEdit,
      saveEdit,
      deleteTask,
      updateStatus,
      onDragStart
    ]
  );

  const prevMonth = useCallback(() => {
    setMonthAnchor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setMonthAnchor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const toggleWeeklyDay = useCallback(idx => {
    setWeeklyDays(prev => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n.size ? n : new Set([idx]);
    });
  }, []);

  return (
    <div className={dark ? "dark" : ""}>
      <Toast show={toast.show} message={toast.message} dark={dark} />
      <div
        className={`min-h-screen p-6 ${
          dark ? "bg-neutral-950" : "bg-neutral-100"
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold leading-tight pb-1 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Geneco, Power the Change!
              </h1>
              <p className={dark ? "text-neutral-400" : "text-muted-foreground"}>
                Organize your day, one task at a time
              </p>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <Button variant="outline" onClick={() => setDark(v => !v)}>
                {dark ? "Light" : "Dark"}
              </Button>
              <Button variant="outline" onClick={saveAll}>
                Save
              </Button>
              <Button variant="outline" onClick={onLoadClick}>
                Load
              </Button>
              <input
                type="file"
                accept="application/json"
                hidden
                ref={fileInputRef}
                onChange={loadAll}
              />
            </div>
          </div>

          {/* Full-width Overall Progress */}
          <div className="space-y-2">
            <div
              className={`flex justify-between text-sm ${
                dark ? "text-neutral-300" : "text-neutral-700"
              }`}
            >
              <span>Overall Progress</span>
              <span>
                {completed}/{tasks.length} tasks{" "}
                {tasks.length > 0 && `— ${progress}%`}
              </span>
            </div>
            <div
              className={`w-full h-3 rounded-full overflow-hidden ${
                dark ? "bg-neutral-800" : "bg-gray-200"
              }`}
            >
              <motion.div
                initial={false}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            </div>
          </div>

          {/* Calendar + Summary + Add Task */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className={dark ? "bg-neutral-950 border-neutral-800" : ""}>
              <CardContent className="p-4">
                <CalendarMonth
                  dark={dark}
                  monthAnchor={monthAnchor}
                  selectedDate={selectedDate}
                  markedDates={markedDates}
                  onPrev={prevMonth}
                  onNext={nextMonth}
                  onSelect={onSelectDate}
                />
              </CardContent>
            </Card>

            <Card className={dark ? "bg-neutral-950 border-neutral-800" : ""}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p
                    className={
                      dark ? "text-neutral-200 font-semibold" : "font-semibold"
                    }
                  >
                    Task Summary
                  </p>
                  <p
                    className={
                      dark
                        ? "text-neutral-400 text-sm"
                        : "text-muted-foreground text-sm"
                    }
                  >
                    {selectedDate}
                  </p>
                </div>

                <div
                  className={`rounded-xl p-3 border ${
                    dark ? "border-neutral-800 bg-neutral-900/40" : "bg-white"
                  }`}
                >
                  <div
                    className={`text-sm ${
                      dark ? "text-neutral-300" : "text-neutral-700"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>To Do</span>
                      <span>{dayCounts.todo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ongoing</span>
                      <span>{dayCounts.ongoing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed</span>
                      <span>{dayCounts.completed}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-neutral-500">
                  Tip: Use checkbox dropdown or drag & drop between columns.
                </div>
              </CardContent>
            </Card>

            <Card className={dark ? "bg-neutral-950 border-neutral-800" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-3">
                  <Input
                    placeholder={`Add task for ${selectedDate}`}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTask()}
                    className={
                      dark
                        ? "bg-neutral-900 border-neutral-700 text-neutral-100"
                        : ""
                    }
                  />
                  <Button onClick={addTask}>Add Task</Button>
                </div>

                {/* Repeat controls */}
                <div
                  className={`rounded-xl border p-3 ${
                    dark ? "border-neutral-800 bg-neutral-900/40" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div
                      className={`text-sm font-semibold ${
                        dark ? "text-neutral-200" : "text-neutral-800"
                      }`}
                    >
                      Repeat
                    </div>

                    <select
                      value={repeatMode}
                      onChange={e => setRepeatMode(e.target.value)}
                      className={`text-sm border rounded-md px-2 py-1 ${
                        dark
                          ? "bg-neutral-900 border-neutral-700 text-neutral-100"
                          : "bg-white"
                      }`}
                    >
                      <option value="none">No repeat</option>
                      <option value="daily">Every day</option>
                      <option value="everyN">Every N days</option>
                      <option value="weekly">Weekly (pick days)</option>
                    </select>
                  </div>

                  <div className="mt-3 grid gap-3">
                    {repeatMode === "everyN" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm ${
                            dark ? "text-neutral-300" : "text-neutral-700"
                          }`}
                        >
                          Every
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={everyN}
                          onChange={e => setEveryN(e.target.value)}
                          className={`w-20 text-sm border rounded-md px-2 py-1 ${
                            dark
                              ? "bg-neutral-900 border-neutral-700 text-neutral-100"
                              : "bg-white"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            dark ? "text-neutral-300" : "text-neutral-700"
                          }`}
                        >
                          days
                        </span>
                      </div>
                    )}

                    {repeatMode === "weekly" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {[
                          { i: 0, l: "Mon" },
                          { i: 1, l: "Tue" },
                          { i: 2, l: "Wed" },
                          { i: 3, l: "Thu" },
                          { i: 4, l: "Fri" },
                          { i: 5, l: "Sat" },
                          { i: 6, l: "Sun" }
                        ].map(w => (
                          <button
                            key={w.i}
                            onClick={() => toggleWeeklyDay(w.i)}
                            className={`px-2 py-1 rounded-md text-xs border ${
                              weeklyDays.has(w.i)
                                ? dark
                                  ? "bg-neutral-800 border-neutral-600 text-neutral-100"
                                  : "bg-gray-900 text-white border-gray-900"
                                : dark
                                ? "bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-900"
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                            type="button"
                          >
                            {w.l}
                          </button>
                        ))}
                      </div>
                    )}

                    {repeatMode !== "none" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm ${
                            dark ? "text-neutral-300" : "text-neutral-700"
                          }`}
                        >
                          Until
                        </span>
                        <input
                          type="date"
                          value={repeatUntil}
                          min={selectedDate}
                          onChange={e => setRepeatUntil(e.target.value)}
                          className={`text-sm border rounded-md px-2 py-1 ${
                            dark
                              ? "bg-neutral-900 border-neutral-700 text-neutral-100"
                              : "bg-white"
                          }`}
                        />
                        <span className="text-xs text-neutral-500">
                          (creates tasks on future dates too)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Undo / Redo */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={undo}
                    disabled={undoStack.length === 0}
                    className="flex-1"
                  >
                    Undo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={redo}
                    disabled={redoStack.length === 0}
                    className="flex-1"
                  >
                    Redo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columns */}
          <div className="grid md:grid-cols-3 gap-6">
            <Column
              title="To Do"
              keyName="todo"
              color="#2563eb"
              dark={dark}
              items={grouped.todo}
              onDrop={onDrop}
              onDragOver={onDragOver}
              renderTask={renderTask}
            />
            <Column
              title="Ongoing"
              keyName="ongoing"
              color="#14b8a6"
              dark={dark}
              items={grouped.ongoing}
              onDrop={onDrop}
              onDragOver={onDragOver}
              renderTask={renderTask}
            />
            <Column
              title="Completed"
              keyName="completed"
              color="#16a34a"
              dark={dark}
              items={grouped.completed}
              onDrop={onDrop}
              onDragOver={onDragOver}
              renderTask={renderTask}
            />
          </div>

          {tasks.length === 0 && (
            <div
              className={`text-center py-12 ${
                dark ? "text-neutral-400" : "text-muted-foreground"
              }`}
            >
              No tasks for {selectedDate} yet. Add one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
