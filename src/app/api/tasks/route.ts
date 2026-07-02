import { readData, writeData } from "@/storage/JsonStorage";

// 获取今日任务
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  const data = readData();

  if (!date) return Response.json(data);

  const day = data.find((d: any) => d.date === date);

  return Response.json(day?.tasks || []);
}

// 更新勾选状态
export async function PATCH(req: Request) {
  const { id, done } = await req.json();

  const data = readData();
  const today = new Date().toISOString().slice(0, 10);

  const day = data.find((d: any) => d.date === today);

  if (day) {
    const task = day.tasks.find((t: any) => t.id === id);
    if (task) task.done = done;
  }

  writeData(data);

  return Response.json({ ok: true });
}

export async function POST(req: Request) {
  const { date, tasks } = await req.json();

  const data = readData();

  const index = data.findIndex((d: any) => d.date === date);

  if (index >= 0) {
    data[index].tasks = tasks;
  } else {
    data.push({ date, tasks });
  }

  writeData(data);

  return Response.json({ ok: true });
}


export async function DELETE(req: Request) {
  const { id } = await req.json();

  const data = readData();
  const today = new Date().toISOString().slice(0, 10);

  const day = data.find((d: any) => d.date === today);

  if (day) {
    day.tasks = day.tasks.filter((t: any) => t.id !== id);
  }

  writeData(data);

  return Response.json({ ok: true });
}

