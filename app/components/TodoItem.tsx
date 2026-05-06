"use client";

import { useState } from "react";
import { Todo } from "../types/todo";

interface Props {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

export default function TodoItem({ todo, onToggle, onDelete, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  function handleEdit() {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      onEdit(todo.id, trimmed);
    } else {
      setEditText(todo.text);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleEdit();
    if (e.key === "Escape") {
      setEditText(todo.text);
      setEditing(false);
    }
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 group last:border-b-0">
      <button
        onClick={() => onToggle(todo.id)}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          todo.completed
            ? "bg-emerald-500 border-emerald-500"
            : "border-gray-300 dark:border-gray-600 hover:border-emerald-400"
        }`}
        aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
      >
        {todo.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {editing ? (
        <input
          autoFocus
          className="flex-1 bg-transparent border-b border-blue-400 outline-none text-sm py-0.5"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={`flex-1 text-sm cursor-text select-none ${
            todo.completed ? "line-through text-gray-400 dark:text-gray-500" : ""
          }`}
        >
          {todo.text}
        </span>
      )}

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500"
            aria-label="編集"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m-6 6H6v-3l9-9a2 2 0 012.828 0l.707.707A2 2 0 0118 7.172L9 16z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onDelete(todo.id)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"
          aria-label="削除"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </li>
  );
}
