import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data/tasks.json");

export function readData() {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export function writeData(data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}