# Restaurant-Food-delivery
# 🔥 The Grill and Barbeque – Food Ordering App

A restaurant food ordering and delivery app built for **The Grill and Barbeque**. Customers can browse the menu, add items to their cart, and place orders. The restaurant admin can manage menu items, photos, and order statuses.

🌐 **Live demo:** https://grillandbarbique.netlify.app/

---

## ✨ Features

### Customer
- Browse the full menu **without logging in**
- Login / register using **mobile number** (login is required only when adding to cart or placing an order)
- Add items to cart (Full / Half portions where available)
- Place orders and track order status
- Profile page

### Admin
- Role-based admin access
- Add menu items and upload item photos
- Edit menu item details and photos later
- View all orders and update their status

### Order Status Flow
`received` → `preparing` → `ready` → `out for delivery` → `completed` (or `cancelled`)

### Menu Categories
Tandoori / Grill items, Non-veg Platters, Shawarma, and more.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile / Web App | React Native with Expo (Expo Router) |
| State & Auth | React Context API |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Authentication | JWT (register / login / role-based access) |
| Hosting (web) | Netlify |

---

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── server.js          # runs on port 5001
│
└── frontend/
    └── src/
        ├── app/           # Expo Router screens
        │   ├── _layout.jsx
        │   ├── index.jsx
        │   ├── login.jsx
        │   ├── register.jsx
        │   ├── cart.jsx
        │   ├── orders.jsx
        │   ├── profile.jsx
        │   ├── admin.jsx
        │   ├── admin-edit.jsx
        │   └── admin-orders.jsx
        ├── api/
        │   └── axios.js
        └── context/
            └── authContext.jsx
```

> Adjust folder names above if your repository differs.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or MongoDB Atlas)
- Expo CLI / Expo Go app (for testing on a phone)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd <your-repo-folder>
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the server:
```bash
npm run dev
```
The API runs at `http://localhost:5001`.

### 3. Frontend setup
```bash
cd frontend
npm install
```

Set the API base URL in `src/api/axios.js` (use your computer's local IP, not `localhost`, when testing on a real phone):
```js
baseURL: "http://<your-local-ip>:5001/api"
```

Start the app:
```bash
npx expo start
```
Scan the QR code with **Expo Go** (Android / iOS), or press `w` to open it in the browser.

---

## 🔌 API Overview

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login with mobile number | Public |
| GET | `/api/menu` | Get menu items | Public |
| POST | `/api/menu` | Add menu item | Admin |
| PUT | `/api/menu/:id` | Update menu item / photo | Admin |
| POST | `/api/orders` | Place an order | Customer |
| GET | `/api/orders` | Get orders | Customer / Admin |
| PUT | `/api/orders/:id` | Update order status | Admin |

> Update these routes to match your backend if they differ.

---

## 👥 User Roles

- **customer** – browse menu, cart, place and view own orders
- **admin** – everything a customer can do, plus manage menu items, photos, and order statuses

---

## 🗺️ Roadmap

- [ ] Full testing of JWT auth (register / login / role-based access)
- [ ] Native Android and iOS builds (currently deployed as a website)
- [ ] Notify the restaurant owner's mobile when a new order is placed
- [ ] Send customers order details and status updates via WhatsApp or similar
- [ ] Production deployment so everyone can use the app

---

## 📸 Screenshots

_Add screenshots of the menu, cart, orders, and admin screens here._

---

## 👨‍💻 Author

**K. Kushan Kumar**
- GitHub: [kushan0529](https://github.com/kushan0529)
- LinkedIn: [kushan-kumar](https://www.linkedin.com/in/kushan-kumar-617bb03a1/)
- Email: kkushan090@gmail.com

---

## 📄 License

This project was built as freelance work for The Grill and Barbeque. All rights reserved.