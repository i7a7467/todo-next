import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import TodoApp from "../TodoApp";

async function renderApp() {
  const user = userEvent.setup();
  render(<TodoApp />);
  // mounted状態になるまで待機
  await waitFor(() => screen.getByRole("heading", { name: "TODOリスト" }));
  return { user };
}

async function addTodo(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), text);
  await user.click(screen.getByRole("button", { name: "追加" }));
}

describe("TodoApp", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("初期表示", () => {
    it("見出しが表示される", async () => {
      await renderApp();
      expect(screen.getByRole("heading", { name: "TODOリスト" })).toBeInTheDocument();
    });

    it("TODOが0件の場合は空状態メッセージが表示される", async () => {
      await renderApp();
      expect(screen.getByText("タスクがありません")).toBeInTheDocument();
    });

    it("追加ボタンは入力が空の場合にdisabledになる", async () => {
      await renderApp();
      expect(screen.getByRole("button", { name: "追加" })).toBeDisabled();
    });
  });

  describe("localStorage", () => {
    it("マウント時にlocalStorageからTODOを読み込む", async () => {
      const stored = [
        { id: "1", text: "保存済みタスク", completed: false, createdAt: 1000 },
      ];
      localStorage.setItem("todos", JSON.stringify(stored));
      await renderApp();
      expect(screen.getByText("保存済みタスク")).toBeInTheDocument();
    });

    it("TODOを追加するとlocalStorageに保存される", async () => {
      const { user } = await renderApp();
      await addTodo(user, "新しいタスク");
      const saved = JSON.parse(localStorage.getItem("todos") ?? "[]");
      expect(saved).toHaveLength(1);
      expect(saved[0].text).toBe("新しいタスク");
    });
  });

  describe("TODO追加", () => {
    it("追加ボタンをクリックするとTODOが追加される", async () => {
      const { user } = await renderApp();
      await addTodo(user, "買い物に行く");
      expect(screen.getByText("買い物に行く")).toBeInTheDocument();
    });

    it("Enterキーを押すとTODOが追加される", async () => {
      const { user } = await renderApp();
      await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), "掃除をする");
      await user.keyboard("{Enter}");
      expect(screen.getByText("掃除をする")).toBeInTheDocument();
    });

    it("TODOを追加すると入力欄がクリアされる", async () => {
      const { user } = await renderApp();
      await addTodo(user, "テストタスク");
      expect(screen.getByPlaceholderText("新しいタスクを入力...")).toHaveValue("");
    });

    it("空白のみの入力ではTODOが追加されない", async () => {
      const { user } = await renderApp();
      await user.type(screen.getByPlaceholderText("新しいタスクを入力..."), "   ");
      await user.keyboard("{Enter}");
      expect(screen.getByText("タスクがありません")).toBeInTheDocument();
    });
  });

  describe("完了トグル", () => {
    it("トグルボタンをクリックするとTODOが完了状態になる", async () => {
      const { user } = await renderApp();
      await addTodo(user, "運動する");
      await user.click(screen.getByRole("button", { name: "完了にする" }));
      expect(screen.getByText("運動する")).toHaveClass("line-through");
    });

    it("完了済みTODOのトグルをクリックすると未完了に戻る", async () => {
      const { user } = await renderApp();
      await addTodo(user, "読書する");
      await user.click(screen.getByRole("button", { name: "完了にする" }));
      await user.click(screen.getByRole("button", { name: "未完了に戻す" }));
      expect(screen.getByText("読書する")).not.toHaveClass("line-through");
    });
  });

  describe("TODO削除", () => {
    it("削除ボタンをクリックするとTODOがリストから消える", async () => {
      const { user } = await renderApp();
      await addTodo(user, "削除するタスク");
      await user.click(screen.getByRole("button", { name: "削除" }));
      expect(screen.queryByText("削除するタスク")).not.toBeInTheDocument();
    });
  });

  describe("TODO編集", () => {
    it("テキストを編集するとTODOが更新される", async () => {
      const { user } = await renderApp();
      await addTodo(user, "元のテキスト");
      await user.click(screen.getByRole("button", { name: "編集" }));
      const input = screen.getByDisplayValue("元のテキスト");
      await user.clear(input);
      await user.type(input, "更新されたテキスト");
      await user.keyboard("{Enter}");
      expect(screen.getByText("更新されたテキスト")).toBeInTheDocument();
      expect(screen.queryByText("元のテキスト")).not.toBeInTheDocument();
    });
  });

  describe("フィルター", () => {
    it("「未完了」フィルターは未完了のTODOのみ表示する", async () => {
      const { user } = await renderApp();
      await addTodo(user, "未完了タスク");
      await addTodo(user, "完了タスク");
      await user.click(screen.getAllByRole("button", { name: "完了にする" })[0]);
      await user.click(screen.getByRole("button", { name: /^未完了\s*\d*$/ }));
      expect(screen.getByText("未完了タスク")).toBeInTheDocument();
      expect(screen.queryByText("完了タスク")).not.toBeInTheDocument();
    });

    it("「完了済み」フィルターは完了済みのTODOのみ表示する", async () => {
      const { user } = await renderApp();
      await addTodo(user, "未完了タスク");
      await addTodo(user, "完了タスク");
      // 追加順が新しい順なので最初に表示されるのは「完了タスク」、トグルで完了にする
      await user.click(screen.getAllByRole("button", { name: "完了にする" })[0]);
      await user.click(screen.getByRole("button", { name: /^完了済み\s*\d*$/ }));
      expect(screen.getByText("完了タスク")).toBeInTheDocument();
      expect(screen.queryByText("未完了タスク")).not.toBeInTheDocument();
    });

    it("「すべて」フィルターに戻すと全TODOが表示される", async () => {
      const { user } = await renderApp();
      await addTodo(user, "タスクA");
      await addTodo(user, "タスクB");
      await user.click(screen.getAllByRole("button", { name: "完了にする" })[0]);
      await user.click(screen.getByRole("button", { name: /^未完了\s*\d*$/ }));
      await user.click(screen.getByRole("button", { name: /^すべて$/ }));
      expect(screen.getByText("タスクA")).toBeInTheDocument();
      expect(screen.getByText("タスクB")).toBeInTheDocument();
    });

    it("フィルターに一致するTODOがない場合は対応するメッセージを表示する", async () => {
      const { user } = await renderApp();
      await addTodo(user, "未完了タスク");
      await user.click(screen.getByRole("button", { name: "完了済み" }));
      expect(screen.getByText("完了済みのタスクはありません")).toBeInTheDocument();
    });
  });

  describe("フッター", () => {
    it("未完了のTODO件数が正しく表示される", async () => {
      const { user } = await renderApp();
      await addTodo(user, "タスク1");
      await addTodo(user, "タスク2");
      await addTodo(user, "タスク3");
      expect(screen.getByText("3 件残っています")).toBeInTheDocument();
    });

    it("完了済みTODOがない場合は「完了済みを削除」ボタンが表示されない", async () => {
      const { user } = await renderApp();
      await addTodo(user, "タスク");
      expect(screen.queryByRole("button", { name: "完了済みを削除" })).not.toBeInTheDocument();
    });

    it("「完了済みを削除」ボタンをクリックすると完了済みTODOが削除される", async () => {
      const { user } = await renderApp();
      await addTodo(user, "残すタスク");
      await addTodo(user, "削除されるタスク");
      // 追加順が新しい順なので「削除されるタスク」が先頭
      await user.click(screen.getAllByRole("button", { name: "完了にする" })[0]);
      await user.click(screen.getByRole("button", { name: "完了済みを削除" }));
      expect(screen.queryByText("削除されるタスク")).not.toBeInTheDocument();
      expect(screen.getByText("残すタスク")).toBeInTheDocument();
    });
  });
});
