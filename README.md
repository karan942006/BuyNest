# 🏛️ BuyNest — Enterprise Full-Stack E-Commerce Platform

> **"Your Home for Everything"** — A premium, luxury-themed e-commerce experience blending the best features of Amazon, Flipkart, Myntra, and Meesho. Powered by React 19, TypeScript, Vite, Node.js Express, Supabase database, and Razorpay payments.

---

## 🚀 One-Click Deploy to Cloud

Deploy the entire full-stack application directly to production using these pre-configured cloud setups connected to your GitHub:

| Service | Component | Deploy Badge |
| :--- | :--- | :--- |
| **Vercel** | Frontend React SPA | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new) |
| **Render** | Backend REST API | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy) |

---

## ☁️ One-Click Run in the Cloud (Zero Installation)

Run the entire development workspace (frontend + backend) directly in your browser without installing anything locally (great for bypassing local Windows PowerShell script execution policy blocks):

*   **GitHub Codespaces**: Go to your GitHub repository -> click the green **Code** button -> click the **Codespaces** tab -> click **Create codespace on main**. Or click:
    
    [![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new)

*   **Gitpod**: Open the workspace on Gitpod:
    
    [![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/) (Append your repo URL after `https://gitpod.io/#`)

---

## ✨ Features Checklist

*   **Premium Luxury UI**: White minimalist styling with glassmorphism, responsive navigation grids, side drawers, and elegant animations.
*   **Dual-Database Setup**: Full relational schema, triggers, stored procedures, and Row-Level Security (RLS) managed securely in Supabase.
*   **Customer Workflow**: Product browsing, multi-category filters, database-backed cart & wishlist, secure checkout pipeline, and order tracking timeline.
*   **Seller Dashboard**: Manage catalog listings, adjust pricing, manage inventory stock, and track sales revenue analytics.
*   **Admin Dashboard**: Manage user accounts, approve seller requests, verify product listings, and process refund tickets.
*   **Full Payment Pipeline**: Integrated Razorpay (and local COD option), dynamic wallet topping, and referral reward credits.
*   **Real-time Communication**: Instant notifications for orders/support, and real-time live support chat tickets.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, Vite, TypeScript, Redux Toolkit, Axios, Tailwind CSS, Framer Motion, Lucide Icons.
*   **Backend**: Node.js, Express, TypeScript, Supabase Admin SDK, Razorpay SDK, Winston Loggers, Zod validator.
*   **Database**: PostgreSQL (via Supabase), Row Level Security (RLS) Policies, automated stock triggers, and reviews statistics triggers.
*   **CI/CD**: GitHub Actions CI workflow, Render blueprints, Vercel SPA redirects config.

---

## 💻 Local Setup & Execution

### 1. Prerequisite
Ensure you have **Node.js** (v18 or higher) and **Git** installed on your system.

### 2. Standard One-Click Run (Windows)
Simply double-click the **`run.bat`** file in the root folder.
This script will automatically:
1. Validate your Node.js and NPM environments.
2. Initialize `.env` files if missing.
3. Install all backend and frontend dependencies.
4. Launch both servers concurrently in separate console windows.

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

### 3. Unix One-Click Run (macOS / Linux)
Open your terminal in the root folder and run:
```bash
chmod +x run.sh
./run.sh
```

---

## 📦 Push and Deploy to GitHub

We have included a customized setup script to upload BuyNest to your GitHub with one click:

1. Double-click **`deploy.bat`** (Windows) in your root directory.
2. The script will automatically initialize Git, stage all project files, create the initial commit, and rename the branch to `main`.
3. It will prompt you to enter your new GitHub Repository URL.
4. Once provided, it pushes your entire codebase directly to GitHub!

### Manual Git Commands:
```bash
git init
git add .
git commit -m "initial commit: BuyNest Platform"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

---

## ⚙️ Cloud Deployment Walkthrough

After pushing your repository to GitHub, follow these simple steps to make BuyNest live:

### 1. Database (Supabase)
1. Go to [Supabase](https://supabase.com) and create a new project.
2. Open the **SQL Editor** in your Supabase dashboard and run the contents of the `schema.sql` file located at the root of your project directory. This will initialize all tables, triggers, and security rules.

### 2. Frontend (Vercel)
1. Import your GitHub repository into **Vercel**.
2. Select `buynest-frontend` as the **Root Directory**.
3. Add these environment variables under Settings -> Environment Variables:
   *   `VITE_SUPABASE_URL`: Your Supabase Project URL.
   *   `VITE_SUPABASE_ANON_KEY`: Your Supabase API Anon Key.
   *   `VITE_API_BASE_URL`: Your deployed Render API backend URL (e.g. `https://buynest-backend.onrender.com/api`).
4. Click **Deploy**. Vercel will automatically build the site and provide a live URL!

### 3. Backend (Render)
1. Import your GitHub repository into **Render** as a **Web Service**.
2. Select `buynest-backend` as the **Root Directory**.
3. Set the **Build Command** to `npm run build` and **Start Command** to `npm start`.
4. Under Environment Variables, add the keys defined in `buynest-backend/.env.example` (including database connections, Razorpay credentials, and email credentials).
5. Click **Deploy**. Render will host your Express API live.

---

## 📂 Codebase Directory Structure

```
├── .github/workflows/       # GitHub Actions CI pipeline configuration
├── buynest-backend/         # Express Node.js API Service
│   ├── src/                 # TypeScript source files (controllers, routes, middlewares)
│   ├── .env.example         # Template for backend secrets
│   └── tsconfig.json        # TypeScript configuration
├── buynest-frontend/        # React 19 Frontend Application
│   ├── src/                 # React components, pages, services, Redux store
│   ├── vercel.json          # SPA routing redirects configuration for Vercel
│   └── tailwind.config.js   # Luxury design system theme parameters
├── run.bat                  # One-click Windows runner
├── run.sh                   # One-click Linux/macOS runner
├── deploy.bat               # One-click GitHub deployment assistant
├── schema.sql               # Database setup migrations
└── render.yaml              # Render.com Blueprint configuration
```

---

## 📄 License
This project is proprietary. Developed as an enterprise-grade full-stack commerce engine.
