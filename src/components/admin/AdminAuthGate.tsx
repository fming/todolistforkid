"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ADMIN_PASSWORD = "learn";
const STORAGE_KEY = "adminAuth";

export default function AdminAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthed(
      typeof window !== "undefined" &&
        window.sessionStorage.getItem(STORAGE_KEY) === "1"
    );
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
      setAuthed(true);
      setError(null);
    } else {
      setError("密码不对，再试一次");
      setInput("");
    }
  }

  if (authed === null) return null;

  if (!authed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-slate-800">🔒 家长后台</h2>
          <p className="mt-1 text-sm text-slate-500">
            请输入密码进入管理页面
          </p>
          <Input
            type="password"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="密码"
            className="mt-4"
          />
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="mt-4 w-full">
            进入
          </Button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
