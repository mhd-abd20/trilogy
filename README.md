# Trilogy — Full-Stack E-Commerce Platform

A production-ready, high-performance e-commerce web application engineered with **React (Vite)**, **Node.js**, **Express**, and **MySQL/TiDB**. Designed for high throughput, optimized catalog querying, and intuitive multi-product inventory management for administrators and shoppers alike.

---

## 🔗 Live Demo
* **Live Website:** [Trilogy Live Demo](https://trilogy-six.vercel.app/)
* **Author:** [Mohammad Abdallah](https://github.com/mhd-abd20)

---

## ⚡ Engineering Highlights & Technical Solutions

* **Server-Side Pagination & Query Scalability:** Handles enterprise catalogs (2,000+ items) via dynamic `LIMIT` and `OFFSET` SQL queries, reducing initial page payload and browser memory consumption by over 80%.
* **Transactional Bulk Insert Operations:** Features a custom compact multi-row product entry interface. Batches dozens of products into a single multi-value SQL query wrapped in ACID-compliant **Database Transactions** to guarantee atomicity.
* **Server-Side Search & Multi-Param Filtering:** Full-text searching, active category filtering, and in-stock gating run directly against MySQL indices, ensuring zero-latency matching across the entire database rather than client memory.
* **Client-Side Media Compression:** Integrates `browser-image-compression` to resize and compress client uploads directly in the browser before network transmission, drastically cutting bandwidth and upload latencies.
* **Automated Visual Asset Fetching:** Features an automated image search endpoint to fetch product visuals on the fly, paired with full-screen Lightbox previews powered by **React Portals** (`createPortal`) to isolate stacking contexts and eliminate z-index clipping.
* **Role-Based Access Control (RBAC):** Restricts admin routes (`/categories`, `/add-products`, `/sales-analytics`, `/orders`) and redirects administrative sessions away from storefront views via higher-order route interceptors (`ProtectedRoute` and `AdminRoute`).

---

## 🛠️ Tech Stack

### Frontend
* **Framework / Tooling:** React 18, Vite
* **Routing & Guards:** React Router DOM v6
* **Data Fetching:** Axios (with custom query debouncing)
* **Media Handling:** `browser-image-compression`
* **Styling:** Custom CSS (Dark Mesh theme, Glassmorphism, Responsive CSS Grid, Flexbox)

### Backend & Database
* **Runtime & Framework:** Node.js, Express.js
* **Database:** MySQL / TiDB Cloud (`mysql2/promise` with Connection Pooling)
* **File Uploads:** Multer (with local and static asset path resolution)
* **Security & Environment:** CORS, Dotenv

---

## 📁 Repository Structure

```text
trilogy-ecommerce/
├── client/
│   ├── src/
│   │   ├── api/                # API service modules (fetchproducts, categoryService, fetchpromotions)
│   │   ├── components/         # Shared UI (DynamicNavbar, ImageGeneratorInput, CartDrawer, Guards)
│   │   ├── pages/
│   │   │   ├── admin/          # Admin pages (ProductsPage, CategoriesList, Promotions, SalesAnalytics)
│   │   │   └── client/         # Storefront views (HomePage, Products, CartPage, CheckoutPage)
│   │   └── styles/             # Component and page style sheets
│   └── .env
│
└── server/
    ├── routes/                 # Express REST routes (products, categories, promotions, orders)
    ├── config/                 # MySQL database connection pool
    ├── uploads/                # Local uploaded asset storage
    ├── server.js               # Application bootstrap and middleware pipeline
    └── .env


    
