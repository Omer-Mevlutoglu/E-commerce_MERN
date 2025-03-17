# Laptopia - MERN Stack E-Commerce

[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.17.1-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)

A full-stack e-commerce platform built with the MERN stack (MongoDB, Express, React, Node.js) featuring user authentication, product management, and secure checkout.

![Laptopia Demo](https://via.placeholder.com/800x400.png?text=Laptopia+Demo+Screenshot)

## 🚀 Features

### ✨ Core Functionality
- **User Authentication**
  - JWT-based secure registration/login
  - Protected routes & session management
- **Product Management**
  - Browse products with images/details
  - Real-time stock updates
- **Shopping Cart**
  - Add/remove items
  - Quantity adjustments
  - Cart persistence
- **Checkout System**
  - Secure payment processing
  - Order confirmation
- **Order History**
  - Detailed order tracking
  - Email notifications

### 🎨 UI Features
- Responsive Material UI design
- Interactive product cards
- Real-time cart updates
- Clean dashboard interface

## 🛠 Tech Stack

### Frontend
| Technology          | Description                           |
|---------------------|---------------------------------------|
| React               | Frontend library                      |
| TypeScript          | Static typing                         |
| Material UI         | UI components & styling              |
| React Router        | Navigation & routing                  |
| Vite                | Build tool & dev server               |

### Backend
| Technology          | Description                           |
|---------------------|---------------------------------------|
| Node.js              | JavaScript runtime                   |
| Express             | API framework                         |
| MongoDB              | NoSQL database                       |
| Mongoose             | MongoDB object modeling              |
| JWT                 | Authentication tokens                |
| Bcrypt              | Password hashing                     |

## ⚙️ Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Backend Setup
```bash
git clone https://github.com/yourusername/laptopia.git
cd laptopia/backend

# Install dependencies
npm install

# Configure environment
echo "DATABASE_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/laptopia
JWT_SECRET=your_jwt_secret
PORT=3001" > .env

# Start server
npm run dev

###Frontend Setup
cd ../frontend

# Install dependencies
npm install

# Configure environment
echo "VITE_BASE_URL=http://localhost:3001" > .env

# Start development server
npm run dev
````
### Frontend Setup
```bash
git clone https://github.com/yourusername/laptopia.git
cd laptopia/backend

# Install dependencies
cd ../frontend

# Install dependencies
npm install

# Configure environment
echo "VITE_BASE_URL=http://localhost:3001" > .env

# Start development server
npm run dev
````
## Usage

### Starting the Application

1. **Start the Backend Server:**  
   Open a terminal, navigate to the `backend` folder, and run:
   ```bash
   npm run dev
   ```
   This starts the backend server on port **3001** and connects to your MongoDB Atlas database.

2. **Start the Frontend Server:**  
   Open another terminal, navigate to the `frontend` folder, and run:
   ```bash
   npm run dev
   ```
   By default, the frontend runs on port **5173**.  
   To expose the frontend on your local network (for mobile testing), run:
   ```bash
   vite --host
   ```
   Then, open your browser (or mobile browser) and navigate to:
   ```
   http://your_machine_ip:5173
   ```

### Using the Application

- **Browse Products:**  
  The homepage displays available products. Click on any product card to view detailed information.

- **User Registration & Login:**  
  - **Register:**  
    Click on the "Create Account" link on the login page and fill out the registration form to create a new account.  
  - **Log In:**  
    Use the login form to sign in with your registered credentials. After logging in, you'll be redirected to the homepage.

- **Shopping Cart:**  
  - **Adding Products:**  
    Click the **"Add to Cart"** button on a product card to add an item to your cart.  
  - **Viewing & Managing the Cart:**  
    Click the cart icon in the navbar to view your cart. Here, you can update item quantities, remove individual items, or clear the entire cart.

- **Checkout Process:**  
  - **Proceed to Checkout:**  
    From the Cart page, click the **"Proceed to Checkout"** button to enter the checkout process.  
  - **Complete Payment:**  
    Fill in your shipping address and payment details (Full Name, Card Number, Expiration Date, CVC) on the Checkout page.  
  - **Place Order:**  
    Click the **"Place Order"** button to complete your purchase. Upon successful checkout, you will be redirected to the Order Confirmation page.

- **Order History:**  
  Access the **"My Orders"** page via the dropdown in the navbar to view your past orders and order details.


