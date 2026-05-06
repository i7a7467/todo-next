"use client";

import { useState, useEffect, useCallback } from "react";
import { Todo, FilterType } from "../types/todo";
import TodoItem from "./TodoItem";

const STORAGE_KEY = "todos";

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setTodos(JSON.parse(stored));
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
  }, [todos, mounted]);

  const addTodo = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      { id: crypto.randomUUID(), text, completed: false, createdAt: Date.now() },
      ...prev,
    ]);
    setInput("");
  }, [input]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const editTodo = useCallback((id: string, text: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }, []);

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  const filters: { label: string; value: FilterType }[] = [
    { label: "すべて", value: "all" },
    { label: "未完了", value: "active" },
    { label: "完了済み", value: "completed" },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 dark:from-gray-900 dark:to-slate-800 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8 tracking-tight">
          TODOリスト
        </h1>

        {/* 入力フォーム */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="新しいタスクを入力..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-100 placeholder-gray-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
          />
          <button
            onClick={addTodo}
            disabled={!input.trim()}
            className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium transition-colors"
          >
            追加
          </button>
        </div>

        {/* フィルタータブ */}
        <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.value
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {f.label}
              {f.value === "active" && activeCount > 0 && (
                <span className="ml-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full px-1.5 py-0.5 text-xs">
                  {activeCount}
                </span>
              )}
              {f.value === "completed" && completedCount > 0 && (
                <span className="ml-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 rounded-full px-1.5 py-0.5 text-xs">
                  {completedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TODOリスト */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
              {filter === "all"
                ? "タスクがありません"
                : filter === "active"
                ? "未完了のタスクはありません"
                : "完了済みのタスクはありません"}
            </div>
          ) : (
            <ul>
              {filtered.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={editTodo}
                />
              ))}
            </ul>
          )}
        </div>

        {/* フッター */}
        {todos.length > 0 && (
          <div className="flex justify-between items-center mt-3 px-1 text-xs text-gray-400 dark:text-gray-500">
            <span>{activeCount} 件残っています</span>
            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                className="hover:text-red-400 transition-colors"
              >
                完了済みを削除
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
