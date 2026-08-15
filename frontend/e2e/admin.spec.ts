import { test, expect, Page } from "@playwright/test";

/**
 * The admin journey. Requires the demo accounts to exist — start the API with
 * SEED_DEMO_USERS=true, as the E2E instructions in the README describe.
 */

const ADMIN = { email: "admin@laptopia.dev", password: "Admin1234!" };

const loginAsAdmin = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.locator("form").getByRole("button", { name: "Sign In" }).click();

  // Admins are redirected away from the storefront to their dashboard.
  await expect(page).toHaveURL("/admin/orders");
};

test("an admin can create a product and see it in the catalogue", async ({
  page,
}) => {
  await loginAsAdmin(page);

  const title = `E2E Laptop ${Date.now()}`;

  await page.getByRole("button", { name: "Add Product" }).click();
  await expect(page).toHaveURL("/admin/products/add");

  await page.getByLabel("Title").fill(title);
  await page
    .getByLabel("Image URL")
    .fill("https://example.com/e2e-laptop.png");
  await page.getByLabel("Price").fill("1499");
  await page.getByLabel("Stock").fill("7");
  await page.getByRole("button", { name: /create product/i }).click();

  await expect(page).toHaveURL("/admin/products/list");

  // Scoped to this product's own card: the catalogue accumulates across runs,
  // so a bare text match would collide with earlier products.
  const card = page.locator(".MuiCard-root").filter({ hasText: title });
  await expect(card).toBeVisible();
  await expect(card.getByText("Stock: 7")).toBeVisible();
  await expect(card.getByText("Price: $1499.00")).toBeVisible();
});

test("an admin can retire a product and restore it", async ({ page }) => {
  await loginAsAdmin(page);

  const title = `E2E Retire ${Date.now()}`;
  await page.goto("/admin/products/add");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Image URL").fill("https://example.com/r.png");
  await page.getByLabel("Price").fill("100");
  await page.getByLabel("Stock").fill("1");
  await page.getByRole("button", { name: /create product/i }).click();
  await expect(page).toHaveURL("/admin/products/list");

  // Retire it — soft delete, so the card stays with a "Retired" chip.
  const card = page.locator(".MuiCard-root").filter({ hasText: title });
  await card.getByRole("button", { name: "Retire" }).click();
  await expect(card.getByText("Retired")).toBeVisible();

  // And back again.
  await card.getByRole("button", { name: "Restore" }).click();
  await expect(card.getByRole("button", { name: "Retire" })).toBeVisible();
});

test("the server's field-level validation message reaches the admin", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.goto("/admin/products/add");
  await page.getByLabel("Title").fill("Bad Image");
  // Passes the browser's own checks (it is a plain text input) and fails Zod
  // on the server, which is the path that exercises the error envelope.
  await page.getByLabel("Image URL").fill("not-a-url");
  await page.getByLabel("Price").fill("100");
  await page.getByLabel("Stock").fill("1");
  await page.getByRole("button", { name: /create product/i }).click();

  await expect(page.getByText(/image must be a valid url/i)).toBeVisible();
  await expect(page).toHaveURL("/admin/products/add");
});

test("the browser blocks a negative price before any request is sent", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.goto("/admin/products/add");
  await page.getByLabel("Title").fill("Negative Price");
  await page.getByLabel("Image URL").fill("https://example.com/n.png");
  await page.getByLabel("Price").fill("-50");
  await page.getByLabel("Stock").fill("1");
  await page.getByRole("button", { name: /create product/i }).click();

  // min=0 on the number input stops submission; the guard still exists
  // server-side, which the API tests cover.
  await expect(page).toHaveURL("/admin/products/add");
  await expect(page.getByLabel("Price")).toHaveValue("-50");
});

test("an admin cannot reach customer-only pages", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto("/cart");
  await expect(page).toHaveURL("/admin/orders");

  await page.goto("/my-orders");
  await expect(page).toHaveURL("/admin/orders");
});
