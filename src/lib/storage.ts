import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir(dir: string) {
  return fs.mkdir(dir, { recursive: true });
}

/**
 * 读取 JSON 文件
 */
export async function readJSON<T>(filePath: string): Promise<T | null> {
  try {
    const fullPath = path.join(DATA_DIR, filePath);
    const data = await fs.readFile(fullPath, "utf-8");
    return JSON.parse(data) as T;
  } catch (err) {
    return null;
  }
}

/**
 * 写入 JSON 文件
 */
export async function writeJSON<T>(
  filePath: string,
  data: T
): Promise<void> {
  const fullPath = path.join(DATA_DIR, filePath);

  await ensureDir(path.dirname(fullPath));

  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * 判断文件是否存在
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(DATA_DIR, filePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}