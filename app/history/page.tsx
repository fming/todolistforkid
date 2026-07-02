"use client";

import { useEffect, useState } from "react";

export default function History() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>📅 History</h1>

      {data.map((d) => (
        <div key={d.date}>
          <h3>{d.date}</h3>
          <ul>
            {d.tasks.map((t: any) => (
              <li key={t.id}>
                {t.done ? "✅" : "⬜"} {t.title}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </main>
  );
}