# Expenses Manager App 💰

A full-stack expense sharing application designed to track company spending and simplify debt settlement between founders/team members. Hosted on PythonAnywhere.

## 📖 Overview

This application solves the problem of shared startup expenses. Instead of settling every single receipt (which creates transaction fatigue), the app records all expenses and uses a **Greedy Algorithm** to calculate the minimum number of transactions required to settle debts.

It acts similarly to "Splitwise" but is optimized for a closed group of founders with a shared running balance.

## 🚀 Features

* **📊 Smart Dashboard**: Instantly view your Net Balance (Green = Owed, Red = Owe).
* **🧠 Greedy Settlement Algorithm**: Dynamically calculates "Who pays Whom" to settle all debts efficiently.
* **💸 Expense Tracking**: Log external expenses (e.g., AWS, Ads) and assign them to the payer.
* **📜 History Tracking**:
    * Filter expenses by "All" vs "My Expenses".
    * View a complete history of settled payments.
* **🔐 Secure Auth**: JWT-based authentication with secure password hashing (`Werkzeug`).
* **📱 Responsive UI**: Optimized for Mobile devices and Ultra-Wide desktop monitors.

## 🛠 Tech Stack

### Frontend
* **React (Vite)**: Fast, modern frontend framework.
* **Material UI (MUI)**: Responsive layout (Grid, Cards, Dialogs) and theming.
* **Axios**: For API requests.

### Backend
* **Flask**: Lightweight Python web server.
* **SQLAlchemy**: ORM for database management.
* **MySQL**: Relational database (Hosted on PythonAnywhere).
* **PyJWT**: For secure, stateless authentication.

---

## ⚙️ Architecture & Database

The app uses a custom database schema (tables prefixed with `fin_` to avoid conflicts):

### 1. Users (`fin_users`)
Stores user credentials and profile info.
* `id`, `username`, `password_hash`, `full_name`

### 2. Expenses (`fin_expenses`)
Tracks money leaving the company to external vendors.
* **Logic**: If User A pays $100 for "Server", the system adds $100 to the Total Pool and credits User A $100 towards their contribution.

### 3. Settlements (`fin_settlements`)
Tracks internal payments between users to fix balance disparities.
* **Logic**: If User A pays User B $50, User A's balance increases (debt reduced) and User B's balance decreases (credit used).

### 🔄 The Algorithm
The backend calculates balances on the fly:
1.  **Fair Share** = (Total Expenses) / (Number of Users)
2.  **User Balance** = `(Paid Expenses - Fair Share) + (Settlements Given) - (Settlements Received)`
3.  **Settlement**: The system matches the user with the *most negative balance* to the user with the *most positive balance* iteratively.

---

## ⚡ Setup & Installation

### 1. Clone the Repo
```bash
git clone [https://github.com/dimitris1208/Expenses-Manager-App.git](https://github.com/dimitris1208/Expenses-Manager-App.git)
cd Expenses-Manager-App
