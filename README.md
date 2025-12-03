# Claw Master - Arcade Inventory & Settings Tracker

A comprehensive management application for arcade operations, built to track machines, inventory, maintenance, and staff workflows.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Backend**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage)
- **State Management**: React Context + Hooks
- **Charts**: [Recharts](https://recharts.org/)
- **Drag & Drop**: [dnd-kit](https://dndkit.com/)

## ✨ Features

- **🔐 Authentication**: Role-based access control (Admin, Manager, Staff) via Google Sign-In.
- **🕹️ Machine Management**: Track arcade machines, their location, status, and sub-units (slots).
- **⚙️ Playfield Settings**: Log and monitor machine settings (Voltage, Strength, Payout %) over time.
- **📦 Inventory System**: Manage stock levels, set low-stock thresholds, and track item locations.
- **📋 Order System**: Kanban-style board for managing stock reorder requests.
- **✅ Weekly Stock Check**: Digital checklist for routine inventory audits.
- **🔧 Maintenance Dashboard**: Track and resolve machine issues with priority-based ticketing.
- **📊 Analytics**: Visualize revenue trends and machine performance.
- **📱 Mobile-First**: Responsive design optimized for tablet and mobile use on the floor.

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- A Firebase Project

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-org/claw-master.git
    cd claw-master
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory and add your Firebase configuration:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    
    # Optional: External API URL
    NEXT_PUBLIC_API_URL=https://api.example.com
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components (shadcn/ui) and feature-specific components.
- `src/context`: React Context providers (AuthContext).
- `src/lib`: Utility functions and Firebase configuration.
- `src/services`: Firestore service layer for data operations.
- `src/types`: TypeScript interfaces for domain entities.

## 🔒 Security Rules

This project uses Firestore Security Rules to enforce role-based access. See `firestore.rules` for the complete policy.

## 🚢 Deployment

The application is optimized for deployment on **Vercel**.

1.  Push your code to a Git repository.
2.  Import the project into Vercel.
3.  Add the Environment Variables in the Vercel dashboard.
4.  Deploy!

## 📄 License

Private / Proprietary.
