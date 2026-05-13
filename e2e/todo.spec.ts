import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // localStorageをクリアして初期状態にする
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("h1");
});

test.describe("初期表示", () => {
  test("TODOリストの見出しが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "TODOリスト" })).toBeVisible();
  });

  test("タスクが0件のとき空状態メッセージが表示される", async ({ page }) => {
    await expect(page.getByText("タスクがありません")).toBeVisible();
  });

  test("追加ボタンは入力が空のときdisabled", async ({ page }) => {
    await expect(page.getByRole("button", { name: "追加" })).toBeDisabled();
  });
});

test.describe("TODO追加", () => {
  test("追加ボタンでTODOを追加できる", async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("買い物に行く");
    await page.getByRole("button", { name: "追加" }).click();
    await expect(page.getByText("買い物に行く")).toBeVisible();
  });

  test("Enterキーでも追加できる", async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("掃除をする");
    await page.keyboard.press("Enter");
    await expect(page.getByText("掃除をする")).toBeVisible();
  });

  test("追加後に入力欄がクリアされる", async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("テストタスク");
    await page.getByRole("button", { name: "追加" }).click();
    await expect(page.getByPlaceholder("新しいタスクを入力...")).toHaveValue("");
  });

  test("空白のみの入力ではTODOが追加されない", async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("   ");
    await page.keyboard.press("Enter");
    await expect(page.getByText("タスクがありません")).toBeVisible();
  });
});

test.describe("完了トグル", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("運動する");
    await page.getByRole("button", { name: "追加" }).click();
  });

  test("トグルボタンで完了状態にできる", async ({ page }) => {
    await page.getByRole("button", { name: "完了にする" }).click();
    await expect(page.getByText("運動する")).toHaveClass(/line-through/);
  });

  test("完了済みを再度クリックすると未完了に戻る", async ({ page }) => {
    await page.getByRole("button", { name: "完了にする" }).click();
    await page.getByRole("button", { name: "未完了に戻す" }).click();
    await expect(page.getByText("運動する")).not.toHaveClass(/line-through/);
  });
});

test.describe("TODO削除", () => {
  test("削除ボタンでTODOが消える", async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("削除するタスク");
    await page.getByRole("button", { name: "追加" }).click();
    await page.getByRole("button", { name: "削除" }).click();
    await expect(page.getByText("削除するタスク")).not.toBeVisible();
    await expect(page.getByText("タスクがありません")).toBeVisible();
  });
});

test.describe("TODO編集", () => {
  test("編集ボタンでテキストを更新できる", async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("元のテキスト");
    await page.getByRole("button", { name: "追加" }).click();
    await page.getByRole("button", { name: "編集" }).click();
    const input = page.getByRole("textbox").last();
    await input.fill("更新されたテキスト");
    await page.keyboard.press("Enter");
    await expect(page.getByText("更新されたテキスト")).toBeVisible();
    await expect(page.getByText("元のテキスト")).not.toBeVisible();
  });

  test("ダブルクリックでも編集モードになる", async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("ダブルクリックタスク");
    await page.getByRole("button", { name: "追加" }).click();
    await page.getByText("ダブルクリックタスク").dblclick();
    await expect(page.getByRole("textbox").last()).toBeVisible();
  });

  test("Escapeでキャンセルすると元のテキストに戻る", async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("キャンセルタスク");
    await page.getByRole("button", { name: "追加" }).click();
    await page.getByRole("button", { name: "編集" }).click();
    const input = page.getByRole("textbox").last();
    await input.fill("変更テキスト");
    await page.keyboard.press("Escape");
    await expect(page.getByText("キャンセルタスク")).toBeVisible();
    await expect(page.getByText("変更テキスト")).not.toBeVisible();
  });
});

test.describe("フィルター", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("未完了タスク");
    await page.getByRole("button", { name: "追加" }).click();
    await page.getByPlaceholder("新しいタスクを入力...").fill("完了タスク");
    await page.getByRole("button", { name: "追加" }).click();
    // 先頭（完了タスク）をトグル
    await page.getByRole("button", { name: "完了にする" }).first().click();
  });

  test("「未完了」フィルターは未完了のみ表示する", async ({ page }) => {
    await page.getByRole("button", { name: /^未完了\s*\d*$/ }).click();
    await expect(page.getByText("未完了タスク")).toBeVisible();
    await expect(page.getByText("完了タスク", { exact: true })).not.toBeVisible();
  });

  test("「完了済み」フィルターは完了済みのみ表示する", async ({ page }) => {
    await page.getByRole("button", { name: /^完了済み\s*\d*$/ }).click();
    await expect(page.getByText("完了タスク", { exact: true })).toBeVisible();
    await expect(page.getByText("未完了タスク")).not.toBeVisible();
  });

  test("「すべて」フィルターで全件表示に戻る", async ({ page }) => {
    await page.getByRole("button", { name: /^未完了\s*\d*$/ }).click();
    await page.getByRole("button", { name: "すべて" }).click();
    await expect(page.getByText("未完了タスク")).toBeVisible();
    await expect(page.getByText("完了タスク", { exact: true })).toBeVisible();
  });

  test("該当なしのときメッセージが表示される", async ({ page }) => {
    // 全タスクを完了にする
    const toggleBtns = page.getByRole("button", { name: "完了にする" });
    await toggleBtns.click();
    await page.getByRole("button", { name: /^未完了\s*\d*$/ }).click();
    await expect(page.getByText("未完了のタスクはありません")).toBeVisible();
  });
});

test.describe("フッター", () => {
  test("未完了件数が正しく表示される", async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("タスク1");
    await page.getByRole("button", { name: "追加" }).click();
    await page.getByPlaceholder("新しいタスクを入力...").fill("タスク2");
    await page.getByRole("button", { name: "追加" }).click();
    await expect(page.getByText("2 件残っています")).toBeVisible();
  });

  test("「完了済みを削除」で完了済みTODOが一括削除される", async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("残すタスク");
    await page.getByRole("button", { name: "追加" }).click();
    await page.getByPlaceholder("新しいタスクを入力...").fill("削除されるタスク");
    await page.getByRole("button", { name: "追加" }).click();
    await page.getByRole("button", { name: "完了にする" }).first().click();
    await page.getByRole("button", { name: "完了済みを削除" }).click();
    await expect(page.getByText("削除されるタスク")).not.toBeVisible();
    await expect(page.getByText("残すタスク")).toBeVisible();
  });
});

test.describe("localStorage永続化", () => {
  test("ページをリロードしてもTODOが保持される", async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("永続化タスク");
    await page.getByRole("button", { name: "追加" }).click();
    await page.reload();
    await page.waitForSelector("h1");
    await expect(page.getByText("永続化タスク")).toBeVisible();
  });

  test("完了状態もリロード後に保持される", async ({ page }) => {
    await page.getByPlaceholder("新しいタスクを入力...").fill("完了保持タスク");
    await page.getByRole("button", { name: "追加" }).click();
    await page.getByRole("button", { name: "完了にする" }).click();
    await page.reload();
    await page.waitForSelector("h1");
    await expect(page.getByText("完了保持タスク")).toHaveClass(/line-through/);
  });
});
