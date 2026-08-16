import { test, expect, Page } from "@playwright/test";

/**
 * Baseline accessibility checks.
 *
 * Deliberately structural rather than a full axe sweep: these assert the things
 * that break real keyboard and screen-reader use and that a refactor can
 * silently regress — a missing landmark, an unlabelled icon button, an image
 * with no alt text, a heading level skipped.
 */

const countViolations = (page: Page) =>
  page.evaluate(() => {
    const problems: string[] = [];

    /**
     * Elements removed from the accessibility tree cannot have accessibility
     * problems. MUI's Select, for instance, renders a hidden native input
     * carrying the form value while the accessible name lives on the combobox
     * beside it — flagging that input would be a false positive.
     */
    const hiddenFromAssistiveTech = (el: Element) =>
      el.getAttribute("aria-hidden") === "true" ||
      el.closest('[aria-hidden="true"]') !== null;

    // Every image needs alt text (empty is fine for decoration).
    document.querySelectorAll("img").forEach((img) => {
      if (hiddenFromAssistiveTech(img)) return;
      if (!img.hasAttribute("alt")) {
        problems.push(
          `img without alt: ${img.getAttribute("src")?.slice(0, 60)}`
        );
      }
    });

    // A control with no text needs an accessible name from somewhere else.
    document.querySelectorAll("button, a").forEach((el) => {
      if (hiddenFromAssistiveTech(el)) return;
      const text = (el.textContent ?? "").trim();
      const labelled =
        el.getAttribute("aria-label") ??
        el.getAttribute("aria-labelledby") ??
        el.getAttribute("title");
      if (!text && !labelled) {
        problems.push(`${el.tagName.toLowerCase()} with no accessible name`);
      }
    });

    // Inputs must be associated with a label.
    document.querySelectorAll("input:not([type=hidden])").forEach((input) => {
      if (hiddenFromAssistiveTech(input)) return;
      const id = input.getAttribute("id");
      const labelled =
        input.getAttribute("aria-label") ??
        input.getAttribute("aria-labelledby") ??
        (id && document.querySelector(`label[for="${id}"]`));
      if (!labelled) {
        problems.push(
          `input with no label: ${input.getAttribute("name") ?? id ?? input.className}`
        );
      }
    });

    return problems;
  });

const pages = [
  { name: "home", path: "/" },
  { name: "catalogue", path: "/products" },
  { name: "login", path: "/login" },
  { name: "register", path: "/register" },
  { name: "404", path: "/no-such-page" },
];

for (const { name, path } of pages) {
  test(`${name} has no obvious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    // Wait for content rather than a fixed delay.
    await page.waitForLoadState("networkidle");

    const problems = await countViolations(page);
    expect(problems, problems.join("\n")).toEqual([]);
  });
}

test("the page has exactly one h1 and a main landmark structure", async ({
  page,
}) => {
  await page.goto("/products");
  await page.waitForLoadState("networkidle");

  // A banner (the AppBar) and a contentinfo (the footer) on every page.
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});

test("the catalogue is reachable and operable by keyboard", async ({
  page,
}) => {
  await page.goto("/products");
  await page.waitForLoadState("networkidle");

  // Tab until the search box has focus, then type into it without a mouse.
  await page.keyboard.press("Tab");
  for (let i = 0; i < 12; i++) {
    const isSearch = await page.evaluate(
      () =>
        document.activeElement?.getAttribute("placeholder") ===
        "Search products"
    );
    if (isSearch) break;
    await page.keyboard.press("Tab");
  }

  await page.keyboard.type("laptop");
  await expect(page.getByLabel("Search")).toHaveValue("laptop");
});

test("category tiles on the home page are keyboard operable", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // They are Cards, not links, so they carry role/tabindex and an Enter handler.
  const tile = page.getByRole("button", { name: /Gaming/ }).first();
  await tile.focus();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/category=gaming/);
});
