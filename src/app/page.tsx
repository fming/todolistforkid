"use client";

import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  done: boolean;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);

  async function load() {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`/api/tasks?date=${today}`);
    const data = await res.json();
    setTasks(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(id: number, done: boolean) {
    await fetch("/api/tasks", {
      method: "PATCH",
      body: JSON.stringify({ id, done }),
    });

    load();
  }

  const doneCount = tasks.filter(t => t.done).length;

  return (
    <main style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>🌞 今日任务</h1>

      <p>完成：{doneCount} / {tasks.length}</p>

      <div style={{ marginTop: 20 }}>
        {tasks.map((task) => (
          <div key={task.id} style={{ margin: "10px 0" }}>
            <label>
              <input
                type="checkbox"
                checked={task.done}
                onChange={(e) => toggle(task.id, e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>
                {task.title}
              </span>
            </label>
          </div>
        ))}
      </div>
    </main>
  );
}