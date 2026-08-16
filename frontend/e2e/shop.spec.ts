import { test, expect, Page } from "@playwright/test";

/**
 * The customer journey, end to end against a real API and database:
 * register → browse → add to cart → adjust → checkout → order history.
 */

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const register = async (page: Page) => {
  const email = `e2e-${unique()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("First Name").fill("E2E");
  await page.getByLabel("Last Name").fill("Shopper");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Create Account" }).click();

  // Landing back on the storefront means the token was accepted and stored.
  await expect(page).toHaveURL("/");
  return email;
};

test("a new customer can register, buy something and see the order", async ({
  page,
}) => {
  await register(page);

  // The catalogue renders.
  await expect(
    page.getByRole("heading", { name: "Featured Products" })
  ).toBeVisible();

  const firstCard = page.getByRole("button", { name: "Add to Cart" }).first();
  await expect(firstCard).toBeEnabled();
  await firstCard.click();

  // The navbar badge reflects the cart.
  await page.getByLabel("cart").click();
  await expect(page).toHaveURL("/cart");
  await expect(page.getByText(/your shopping cart/i)).toBeVisible();

  // Increase the quantity and watch the total follow.
  await page.getByRole("button", { name: "+", exact: true }).first().click();
  await expect(page.getByText(/^Total: \$/)).toBeVisible();

  await page.getByRole("button", { name: /proceed to checkout/i }).click();
  await expect(page).toHaveURL("/checkout");

  await page.getByLabel("Full Name").fill("E2E Shopper");
  await page.getByLabel("Address").fill("1 Test Street, Test City");
  await page.getByLabel("Card Number").fill("4242424242424242");
  await page.getByLabel("Expiration Date").fill("12/34");
  await page.getByLabel("CVC").fill("123");
  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page).toHaveURL("/order-confirmation");
  await expect(page.getByText(/order confirmed/i)).toBeVisible();

  // The order appears in history.
  await page.goto("/my-orders");
  await expect(page.getByRole("heading", { name: "My Orders" })).toBeVisible();
  await expect(page.getByText(/^Order #/).first()).toBeVisible();
});

test("checkout rejects an invalid card before contacting the server", async ({
  page,
}) => {
  await register(page);

  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.goto("/checkout");

  await page.getByLabel("Full Name").fill("E2E Shopper");
  await page.getByLabel("Address").fill("1 Test Street");
  await page.getByLabel("Card Number").fill("1234567812345678"); // fails Luhn
  await page.getByLabel("Expiration Date").fill("12/34");
  await page.getByLabel("CVC").fill("123");
  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page.getByText(/valid card number/i)).toBeVisible();
  await expect(page).toHaveURL("/checkout");
});

test("the cart is emptied when the customer signs out", async ({ page }) => {
  await register(page);

  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.getByLabel("cart").click();
  await expect(page.getByRole("button", { name: /clear cart/i })).toBeVisible();

  // Sign out via the avatar menu. Signing out while on /cart trips the
  // RequireUser guard before the handler's own navigate lands, so the customer
  // ends up on /login — which is a reasonable place to leave them.
  await page.getByRole("button", { name: /account settings/i }).click();
  await page.getByRole("menuitem", { name: "Logout" }).click();

  await expect(page).toHaveURL("/login");

  // Back on the storefront: signed out, and the cart is gone rather than still
  // showing the previous customer's badge.
  await page.goto("/");
  await expect(page.getByLabel("cart")).toHaveCount(0);
  await expect(
    page.getByRole("banner").getByRole("button", { name: /sign in/i })
  ).toBeVisible();
});

test("guests are sent to login and cannot add to cart", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("button", { name: /login to purchase/i }).first()
  ).toBeDisabled();

  await page.goto("/cart");
  await expect(page).toHaveURL("/login");
});

test("the catalogue can be searched, filtered and paged", async ({ page }) => {
  await page.goto("/products");

  await expect(
    page.getByRole("heading", { name: "All Products" })
  ).toBeVisible();
  await expect(page.getByText(/products available/)).toBeVisible();

  // Filtering puts the choice in the URL so the view can be linked.
  await page.getByRole("button", { name: /🎮 Gaming/ }).click();
  await expect(page).toHaveURL(/category=gaming/);

  // Searching for something that cannot match shows the empty state.
  await page.getByLabel("Search").fill("zzzznotarealproduct");
  await expect(page.getByText(/no products match your search/i)).toBeVisible();

  await page.getByRole("button", { name: /clear filters/i }).click();
  await expect(page).toHaveURL("/products");
});

test("a category tile on the home page filters the catalogue", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Ultrabooks/ }).click();

  await expect(page).toHaveURL(/\/products\?category=ultrabooks/);
});

test("a product card opens its detail page", async ({ page }) => {
  await page.goto("/products");

  const firstTitle = await page
    .locator(".MuiCard-root h3")
    .first()
    .textContent();
  await page.locator(".MuiCard-root a").first().click();

  await expect(page).toHaveURL(/\/products\/[a-f0-9]{24}/);
  await expect(
    page.getByRole("heading", { name: firstTitle!.trim() })
  ).toBeVisible();
  await expect(page.getByText(/free delivery on every order/i)).toBeVisible();
});

test("an unknown URL renders a 404 instead of silently going home", async ({
  page,
}) => {
  await page.goto("/this-page-does-not-exist");

  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByText(/this page doesn't exist/i)).toBeVisible();
  // The old behaviour was a redirect, which hid broken links.
  await expect(page).toHaveURL("/this-page-does-not-exist");
});
