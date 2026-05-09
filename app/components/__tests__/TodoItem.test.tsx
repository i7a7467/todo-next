import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TodoItem from "../TodoItem";
import { Todo } from "../../types/todo";

const baseTodo: Todo = {
  id: "test-id-1",
  text: "牛乳を買う",
  completed: false,
  createdAt: 1000000,
};

function renderItem(
  todo: Todo = baseTodo,
  handlers: {
    onToggle?: (id: string) => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string, text: string) => void;
  } = {}
) {
  const onToggle = handlers.onToggle ?? vi.fn();
  const onDelete = handlers.onDelete ?? vi.fn();
  const onEdit = handlers.onEdit ?? vi.fn();
  render(
    <TodoItem todo={todo} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
  );
  return { onToggle, onDelete, onEdit };
}

describe("TodoItem", () => {
  describe("表示", () => {
    it("todoのテキストが表示される", () => {
      renderItem();
      expect(screen.getByText("牛乳を買う")).toBeInTheDocument();
    });

    it("未完了のtodoはテキストに取り消し線がない", () => {
      renderItem();
      const text = screen.getByText("牛乳を買う");
      expect(text).not.toHaveClass("line-through");
    });

    it("完了済みのtodoはテキストに取り消し線が表示される", () => {
      renderItem({ ...baseTodo, completed: true });
      const text = screen.getByText("牛乳を買う");
      expect(text).toHaveClass("line-through");
    });

    it("未完了のtodoのトグルボタンのaria-labelは「完了にする」", () => {
      renderItem();
      expect(screen.getByRole("button", { name: "完了にする" })).toBeInTheDocument();
    });

    it("完了済みのtodoのトグルボタンのaria-labelは「未完了に戻す」", () => {
      renderItem({ ...baseTodo, completed: true });
      expect(screen.getByRole("button", { name: "未完了に戻す" })).toBeInTheDocument();
    });
  });

  describe("完了トグル", () => {
    it("トグルボタンをクリックするとonToggleがtodoのidで呼ばれる", async () => {
      const user = userEvent.setup();
      const { onToggle } = renderItem();
      await user.click(screen.getByRole("button", { name: "完了にする" }));
      expect(onToggle).toHaveBeenCalledOnce();
      expect(onToggle).toHaveBeenCalledWith("test-id-1");
    });
  });

  describe("削除", () => {
    it("削除ボタンをクリックするとonDeleteがtodoのidで呼ばれる", async () => {
      const user = userEvent.setup();
      const { onDelete } = renderItem();
      await user.click(screen.getByRole("button", { name: "削除" }));
      expect(onDelete).toHaveBeenCalledOnce();
      expect(onDelete).toHaveBeenCalledWith("test-id-1");
    });
  });

  describe("編集モード切替", () => {
    it("編集ボタンをクリックすると編集モードになる", async () => {
      const user = userEvent.setup();
      renderItem();
      await user.click(screen.getByRole("button", { name: "編集" }));
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.queryByText("牛乳を買う")).not.toBeInTheDocument();
    });

    it("テキストをダブルクリックすると編集モードになる", async () => {
      const user = userEvent.setup();
      renderItem();
      await user.dblClick(screen.getByText("牛乳を買う"));
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
  });

  describe("編集の確定", () => {
    it("編集後にEnterを押すとonEditが新しいテキストで呼ばれる", async () => {
      const user = userEvent.setup();
      const { onEdit } = renderItem();
      await user.click(screen.getByRole("button", { name: "編集" }));
      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "卵を買う");
      await user.keyboard("{Enter}");
      expect(onEdit).toHaveBeenCalledWith("test-id-1", "卵を買う");
    });

    it("編集後にblurするとonEditが新しいテキストで呼ばれる", async () => {
      const user = userEvent.setup();
      const { onEdit } = renderItem();
      await user.click(screen.getByRole("button", { name: "編集" }));
      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "パンを買う");
      await user.tab();
      expect(onEdit).toHaveBeenCalledWith("test-id-1", "パンを買う");
    });

    it("テキストを変更せずにEnterを押してもonEditは呼ばれない", async () => {
      const user = userEvent.setup();
      const { onEdit } = renderItem();
      await user.click(screen.getByRole("button", { name: "編集" }));
      await user.keyboard("{Enter}");
      expect(onEdit).not.toHaveBeenCalled();
    });

    it("空文字にして確定してもonEditは呼ばれずテキストが元に戻る", async () => {
      const user = userEvent.setup();
      const { onEdit } = renderItem();
      await user.click(screen.getByRole("button", { name: "編集" }));
      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.keyboard("{Enter}");
      expect(onEdit).not.toHaveBeenCalled();
      expect(screen.getByText("牛乳を買う")).toBeInTheDocument();
    });
  });

  describe("編集のキャンセル", () => {
    it("Escapeを押すとonEditは呼ばれず編集モードを終了する", async () => {
      const user = userEvent.setup();
      const { onEdit } = renderItem();
      await user.click(screen.getByRole("button", { name: "編集" }));
      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "変更テキスト");
      await user.keyboard("{Escape}");
      expect(onEdit).not.toHaveBeenCalled();
      expect(screen.getByText("牛乳を買う")).toBeInTheDocument();
    });
  });
});
