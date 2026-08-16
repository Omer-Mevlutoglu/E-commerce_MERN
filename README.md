# Laptopia – MERN Stack E-Commerce

[![CI](https://github.com/Omer-Mevlutoglu/E-commerce_MERN/actions/workflows/ci.yml/badge.svg)](https://github.com/Omer-Mevlutoglu/E-commerce_MERN/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

A full-stack e-commerce platform built with the MERN stack—MongoDB (local), Express, React, and Node.js—featuring **role-based access** (user vs. admin), product browsing, cart management, secure checkout, and an admin dashboard for inventory and order control.

### Watch the demo video below to see Laptopia in action!

[![Laptopia Demo](https://img.youtube.com/vi/tSwDvwmv5j4/0.jpg)](https://youtu.be/Vn9fql7lTDA)

---

## 🚀 Features

### User (Role: “user”)
- **Browse Products**  
  View all available products with images, price, and stock.
- **Shopping Cart**  
  Add/remove items, adjust quantities (validated against stock), and persist cart per user.
- **Checkout & Order History**  
  Fill in shipping and payment details to place orders; view past orders with item details.
- **Protected Routes**  
  Cart, Checkout, and Order History pages require login; “Add to Cart” disabled for guests and admins.

### Admin (Role: “admin”)
- **Product Management**  
  Add new products (title, image URL, price, stock); edit existing products; delete products.
- **Order Management**  
  View all confirmed orders across customers, including customer info, shipping address, and ordered items.
- **Role-Based Navigation**  
  Admins see “Manage Products” and “View Orders” links; user-only features (cart, checkout) are hidden.

### Common
- **Authentication & Authorization**  
  JWT-based registration/login with bcrypt password hashing.  
  Token payload includes `role` (“user” or “admin”), enforced on both frontend (route guards) and backend (middleware).
- **Responsive UI**  
  Material UI for a polished, mobile-friendly design.
- **Real-Time Updates**  
  Cart badge, product stock, and form validations occur without full-page reloads.
- **Error Handling**  
  Frontend snackbars for API errors; backend returns clear status codes and messages.

---

## 🛠 Tech Stack

### Frontend
| Technology    | Description                        |
|---------------|------------------------------------|
| React         | Frontend library                   |
| TypeScript    | Static typing                      |
| Material UI   | UI components & styling            |
| React Router  | Client-side routing                |
| Vite          | Build tool & development server    |

### Backend
| Technology    | Description                        |
|---------------|------------------------------------|
| Node.js       | JavaScript runtime                 |
| Express       | API framework                      |
| MongoDB       | Local NoSQL database               |
| Mongoose      | MongoDB object modeling            |
| JSON Web Token| Authentication & role-based tokens |
| Bcrypt        | Password hashing                   |

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js v18+  
- MongoDB (installed & running locally on port 27017)  
- Git

---

### Option A — Docker (everything in one command)

```bash
docker compose up --build
```

* **Web** → [http://localhost:5173](http://localhost:5173)
* **API** → [http://localhost:3001](http://localhost:3001) (health check at `/health`)
* **MongoDB** → `localhost:27017`, started as a single-node replica set so
  checkout runs inside a real transaction.

Demo accounts are seeded automatically:

| Role     | Email                  | Password     |
| -------- | ---------------------- | ------------ |
| Customer | `demo@laptopia.dev`    | `Demo1234!`  |
| Admin    | `admin@laptopia.dev`   | `Admin1234!` |

### Option B — Manual setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Omer-Mevlutoglu/E-commerce_MERN.git
   cd E-commerce_MERN
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

   Fill in `.env` — the server validates it at boot and refuses to start if
   anything is missing or malformed. `JWT_SECRET` must be **at least 32
   characters**; generate one with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Start the backend:

   ```bash
   npm run dev
   ```

   * Connects to MongoDB, seeds sample products if none exist, and listens on
     the port from `PORT` (default 3001).
   * A standalone `mongod` works, but checkout falls back to compensating
     writes instead of transactions. For full atomicity use a replica set
     (`mongod --replSet rs0`, then `rs.initiate()`) or MongoDB Atlas.

3. **Frontend Setup**

   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

   * Runs on [http://localhost:5173](http://localhost:5173).

### Available scripts

| Location   | Command             | Does                                       |
| ---------- | ------------------- | ------------------------------------------ |
| `backend`  | `npm run dev`       | nodemon + ts-node, restarts on change      |
| `backend`  | `npm run build`     | compiles TypeScript to `dist/`             |
| `backend`  | `npm start`         | runs the compiled build                    |
| `backend`  | `npm run typecheck` | type-check without emitting                |
| `backend`  | `npm run seed:demo` | create the demo accounts                   |
| `frontend` | `npm run dev`       | Vite dev server                            |
| `frontend` | `npm run build`     | type-check + production bundle to `dist/`  |
| `frontend` | `npm run preview`   | serve the built bundle locally             |
| `frontend` | `npm run lint`      | ESLint                                     |

---

## 🧪 Testing

**133 unit and integration tests, plus 9 end-to-end specs.** Every push runs
lint, typecheck, tests and build for both apps, then the E2E suite against a
real API and database.

```bash
cd backend  && npm test          # 84 tests
cd frontend && npm test          # 49 tests
```

| Suite | Tooling | Covers |
| ----- | ------- | ------ |
| Backend unit + integration | Vitest, Supertest, `mongodb-memory-server` | services, middleware, every route |
| Frontend component | Vitest, Testing Library, MSW | providers, guards, API client, CartPage |
| End-to-end | Playwright (Chromium) | customer purchase journey, admin management |

Coverage: **90% backend** (services 90%), and 88–95% on the frontend modules
that hold logic — providers, guards and the API client. Presentational pages are
covered by the E2E suite instead.

The backend tests start their own **in-memory MongoDB replica set**, so they need
no running database and still exercise the transactional checkout path. Two of
them fire concurrent checkouts at a single unit of stock and assert exactly one
wins — the reason checkout uses a conditional update rather than read-then-write.

### End-to-end

E2E needs a running API and a built frontend. Point the API at a throwaway
database:

```bash
cd backend && PORT=3098 DATABASE_URL=mongodb://localhost:27017/laptopia_e2e SEED_DEMO_USERS=true CORS_ORIGIN=http://localhost:4173 npm run dev
```

Then, in another terminal:

```bash
cd frontend && VITE_BASE_URL=http://localhost:3098 npm run build && npm run test:e2e
```

Playwright starts its own preview server on port 4173. Use `--ui` for the
interactive runner, or `--headed` to watch it drive the browser.

---

## 🚢 Deployment

The backend ships as a Docker image; the frontend is a static bundle.

### Backend → Railway

1. New project → Deploy from GitHub repo → set **root directory** to `backend`.
   `backend/railway.json` selects the Dockerfile builder and points the health
   check at `/health`.
2. Add a MongoDB database (Railway plugin or MongoDB Atlas) and copy its
   connection string.
3. Set these variables:

   | Variable          | Value                                              |
   | ----------------- | -------------------------------------------------- |
   | `NODE_ENV`        | `production`                                        |
   | `DATABASE_URL`    | your MongoDB connection string                      |
   | `JWT_SECRET`      | 32+ random characters                               |
   | `CORS_ORIGIN`     | your Vercel URL, e.g. `https://laptopia.vercel.app` |
   | `TRUST_PROXY`     | `true`                                              |
   | `SEED_DEMO_USERS` | `true` for a public demo, otherwise `false`         |

   Do **not** set `PORT` — Railway injects it.

### Frontend → Vercel

1. Import the repo → set **root directory** to `frontend`. Vercel detects Vite;
   `frontend/vercel.json` adds the SPA rewrites that `BrowserRouter` needs so a
   refresh on `/cart` does not 404.
2. Set `VITE_BASE_URL` to your Railway URL (no trailing slash).
3. Redeploy after changing it — Vite inlines env vars at **build** time, so a
   variable change requires a rebuild, not just a restart.

### Order of operations

Deploy the backend first, then set `VITE_BASE_URL` on Vercel, then set
`CORS_ORIGIN` on Railway to the Vercel URL. The two reference each other, so one
of them always needs a second pass.

---

## 🔑 Usage

### 1. User Flow

1. **Home & Browse**

   * Visit `http://localhost:5173/` to see all products (if an admin is logged in, they are redirected to the admin dashboard).
2. **Register & Login**

   * Click “Sign In” → “Create Account” to register (defaults to role “user”).
   * After login, you can add products to the cart.
3. **Shopping Cart**

   * Click **“Add to Cart”** on a product (disabled for guests/admins).
   * Click the cart icon to view/update quantities, remove items, or clear the cart.
4. **Checkout**

   * From the Cart page, click **“Proceed to Checkout”**, fill in shipping and payment details (mocked), and place the order.
   * On success, see the Order Confirmation page; cart is cleared.
5. **Order History**

   * Click your avatar → “My Orders” to view past orders with item details.

### 2. Admin Flow

1. **Create/Identify Admin**

   * Register a normal user, then in your local MongoDB (Compass or `mongosh`), update that user’s `role` field to `"admin"`.
   * Or directly insert an admin document:

     ```js
     db.users.insertOne({
       firstName: "Alice",
       lastName: "Admin",
       email: "alice.admin@example.com",
       password: "<bcrypt‐hash>",
       role: "admin"
     });
     ```
2. **Login & Navigation**

   * Log in with an admin account; navbar shows:

     * **Manage Products** → `/admin/products/list`
     * **View Orders**  → `/admin/orders`
     * **Logout**
   * User-only links (cart, “My Orders”) are hidden.
3. **Manage Products** (`/admin/products/list`)

   * See all products with title, image, price, and stock.
   * **Edit**: Update via `/admin/products/edit/:productId`.
   * **Delete**: Remove a product.
   * **Add Product**: Go to `/admin/products/add`, fill Title, Image URL, Price, Stock, and submit.
4. **View All Orders** (`/admin/orders`)

   * See every confirmed order with:

     * Order ID, customer name & email, shipping address, total amount
     * List of ordered items (thumbnail, title, quantity, unit price)

---

## 📚 API Overview

All endpoints are under **`/api/v1`**. Unversioned paths return 404.

Errors always come back as JSON:

```jsonc
{
  "error": "ValidationError",       // machine-readable code
  "message": "Invalid request body",
  "details": { "price": ["Price cannot be negative"] }  // when applicable
}
```

Status codes: `400` invalid input · `401` not authenticated · `403` authenticated
but not permitted · `404` not found · `409` conflict (out of stock, email taken).

### Public

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/v1/products` | Catalogue — paginated, filterable, searchable |
| `GET` | `/api/v1/products/:productId` | A single product |
| `GET` | `/api/v1/products/categories` | The category list the filters use |
| `POST` | `/api/v1/auth/register` | `{ firstName, lastName, email, password }` → `{ token }` |
| `POST` | `/api/v1/auth/login` | `{ email, password }` → `{ token }` |

The listing accepts `page`, `limit` (max 48), `search`, `category`
(`laptops` \| `gaming` \| `ultrabooks` \| `accessories`) and `sort`
(`newest` \| `price-asc` \| `price-desc` \| `title-asc`), and responds with:

```jsonc
{
  "items": [ /* … */ ],
  "page": 1, "limit": 12, "total": 37, "totalPages": 4, "hasNextPage": true
}
```

Search runs against a MongoDB text index over title, brand and description,
weighted so a title match ranks highest.

Registration always creates a `user`; the role is never read from the request.
Both auth endpoints are rate-limited to 10 attempts per 15 minutes.

### Customer (`role === "user"`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/v1/cart` | Active cart, products populated |
| `POST` | `/api/v1/cart/items` | `{ productId, quantity }` — increments if already present |
| `PUT` | `/api/v1/cart/items` | `{ productId, quantity }` — sets the quantity |
| `DELETE` | `/api/v1/cart/items/:productId` | Remove one line |
| `DELETE` | `/api/v1/cart` | Empty the cart |
| `POST` | `/api/v1/cart/checkout` | `{ fullName, address, payment: { last4, brand } }` |
| `GET` | `/api/v1/orders` | The signed-in customer's orders, newest first |

Orders move through `processing → shipped → delivered`, with `cancelled` as an
exit. Only an admin can change the status.

**Checkout never receives a card number, CVC or expiry date.** The browser
validates the card and derives `last4` + `brand`; nothing else is transmitted or
stored. Checkout decrements stock atomically and runs in a transaction where the
database supports one.

### Admin (`role === "admin"`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/v1/admin/products` | All products, including retired |
| `GET` | `/api/v1/admin/products/:productId` | One product, retired included |
| `POST` | `/api/v1/admin/products` | `{ title, image, price, stock, category?, brand?, description? }` |
| `PUT` | `/api/v1/admin/products/:productId` | Partial update |
| `DELETE` | `/api/v1/admin/products/:productId` | Retire (soft delete) |
| `POST` | `/api/v1/admin/products/:productId/restore` | Un-retire |
| `GET` | `/api/v1/admin/orders` | Every order with customer details |
| `PATCH` | `/api/v1/admin/orders/:orderId/status` | `{ status }` |

Products are **retired, not deleted** — a hard delete left dangling references in
any cart still holding the product.

### Health

`GET /health` → `{ status, uptime, db }`. Not versioned; used by Railway and the
container healthchecks.

---

## 📥 Development Tips

* **Seeded Data**
  On server start, if no products exist, a set of sample laptops is inserted automatically.
* **Creating an Admin**

  * With Docker, or with `SEED_DEMO_USERS=true`, `admin@laptopia.dev` already exists.
  * Otherwise register a normal user, then in MongoDB set `role: "admin"` on that
    document and log in again — the role is read from a freshly issued token.
* **Migrating an existing database**

  ```bash
  npm run migrate:orders
  ```

  Renames the old misspelled order fields (`productTtile` → `productTitle`,
  `unitprice` → `unitPrice`), strips any card data written before it was removed,
  and marks pre-existing products active. Safe to run more than once.
* **Testing Auth**
  Send `Authorization: Bearer <JWT>` and confirm cart endpoints reject admin
  tokens with 403 and admin endpoints reject customer tokens with 403.

---
