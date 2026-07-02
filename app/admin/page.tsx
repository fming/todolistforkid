"use client";

import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  done: boolean;
};

function getDate(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function Admin() {
  const [date, setDate] = useState(getDate(0));
  const [tasks, setTasks] = useState<Task[]>([]);

  async function load(d: string) {
    const res = await fetch(`/api/tasks?date=${d}`);
    const data = await res.json();

    // 如果今天没数据 → 自动复制昨天
    if (data.length === 0 && d === getDate(0)) {
      const yRes = await fetch(`/api/tasks?date=${getDate(-1)}`);
      const yData = await yRes.json();

      setTasks(yData);
    } else {
      setTasks(data);
    }
  }

  useEffect(() => {
    load(date);
  }, [date]);

  function updateTitle(id: number, title: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t))
    );
  }

  async function save() {
    await fetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ date, tasks }),
    });

    alert("saved");
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>⚙️ Task Editor</h1>

      <div>
        <button onClick={() => setDate(getDate(-1))}>昨天</button>
        <button onClick={() => setDate(getDate(0))}>今天</button>
      </div>

      <h3>{date}</h3>

      {tasks.map((t) => (
        <div key={t.id}>
          <input
            value={t.title}
            onChange={(e) => updateTitle(t.id, e.target.value)}
          />
        </div>
      ))}

      <button onClick={save}>保存</button>
    </main>
  );
}