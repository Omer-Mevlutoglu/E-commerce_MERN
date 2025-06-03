# Laptopia – MERN Stack E-Commerce

[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)  
[![Node.js](https://img.shields.io/badge/Node.js-18.17.1-green)](https://nodejs.org/)  
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)  

A full-stack e-commerce platform built with the MERN stack—MongoDB (local), Express, React, and Node.js—featuring **role-based access** (user vs. admin), product browsing, cart management, secure checkout, and an admin dashboard for inventory and order control.

### Watch the demo video below to see Laptopia in action!

[![Laptopia Demo](https://img.youtube.com/vi/tSwDvwmv5j4/0.jpg)](https://youtu.be/tSwDvwmv5j4)

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

1. **Clone the Repository**  
   ```bash
   git clone https://github.com/yourusername/laptopia.git
   cd laptopia

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   ```

   Create `.env` with:

   ```
   DATABASE_URL=mongodb://localhost:27017/laptopia
   JWT_SECRET=your_jwt_secret
   PORT=3001
   ```

   Start the backend:

   ```bash
   npm run dev
   ```

   * Connects to local MongoDB, seeds sample products if none exist, and listens on [http://localhost:3001](http://localhost:3001).

3. **Frontend Setup**

   ```bash
   cd ../frontend
   npm install
   ```

   Create `.env` with:

   ```
   VITE_BASE_URL=http://localhost:3001
   ```

   Start the frontend:

   ```bash
   npm run dev
   ```

   * Runs on [http://localhost:5173](http://localhost:5173) by default. For network testing: `vite --host`.

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

### Public

* **GET /product**
  List all products (title, image, price, stock).

### Authentication

* **POST /users/register**
  Request: `{ firstName, lastName, email, password }`
  Response: JWT token (role defaults to “user”).
* **POST /users/login**
  Request: `{ email, password }`
  Response: JWT token (contains `role: "user"` or `"admin"`).

### User-Only (Authorization: Bearer `<token>` with `role === "user"`)

* **GET /cart** – get active cart (populates products)
* **POST /cart/items** – add item `{ productId, quantity }`
* **PUT /cart/items** – update quantity `{ productId, quantity }`
* **DELETE /cart/items/\:productId** – remove a product from cart
* **DELETE /cart** – clear cart
* **POST /cart/checkout** – checkout `{ fullName, address, cardNumber, exp, cvc }`
* **GET /users/my-orders** – list orders for logged-in user

### Admin-Only (Authorization: Bearer `<token>` with `role === "admin"`)

* **POST /admin/products** – create `{ title, image, price, stock }`
* **PUT /admin/products/\:productId** – update product
* **DELETE /admin/products/\:productId** – delete product
* **GET /admin/orders** – list all confirmed orders (populated user details)

---

## 📥 Development Tips

* **Seeded Data**
  On server start, if no products exist, a set of sample laptops is inserted automatically.
* **Creating an Admin**

  * Register a normal user, then in MongoDB (Compass or `mongosh`), set `role: "admin"` for that user.
  * Now log in as that user; you’ll see admin links.
* **Testing Auth**
  Use a REST client (e.g., Thunder Client) to send requests with `Authorization: Bearer <JWT>` and verify that user endpoints (cart, checkout) reject admin tokens and vice versa.

---
