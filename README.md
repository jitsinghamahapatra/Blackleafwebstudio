# Blackleaf Studio

Blackleaf Studio is a modern, responsive web agency landing page designed to showcase web development services, pricing packages, and past work. It features an integrated client ordering system and a fully functional Admin CMS directly linked to a Firebase backend.

## 🚀 Features

- **Dynamic Landing Page**: Professional UI with a hero section, dynamic pricing grid, and a recent works slider.
- **Client Authentication**: Secure login via Firebase Authentication (Google & Email/Password).
- **Order Management System**: Authenticated users can request web design packages via an intuitive modal form.
- **Admin CMS Dashboard**: A secure admin portal (`admin.html`) to manage site content:
  - Update hero text and pricing.
  - Add, edit, or remove project packages and portfolio works.
  - View and manage client order requests.
- **Light & Dark Themes**: Customizable styling using CSS variables.
- **Fast Build System**: Powered by Vite for instant Hot Module Replacement (HMR) and optimized builds.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
- **Backend/Database**: Firebase Authentication, Cloud Firestore
- **Build Tool**: Vite
- **Icons**: FontAwesome & Google Fonts

## 📂 Project Structure

```text
blackleaf-studio/
│
├── index.html           # Main landing page (Home)
├── app.js               # Client-side logic (Auth, Modals, fetching public data)
├── style.css            # Styles for the main website interface
│
├── admin.html           # Admin Dashboard interface
├── admin.js             # Admin logic (CMS controls, handling orders, auth checks)
├── admin.css            # Styles specific to the Admin panel
│
├── firebase-config.js   # Firebase initialization and exports
├── .env                 # Environment variables (Firebase API keys)
│
├── images/              # Directory containing project images and logos
├── package.json         # Project dependencies and npm scripts
└── vite.config.js       # Vite bundler configuration
```

### Key Files Explained
- **`app.js`**: Handles standard user interactions like opening the login/order modals, signing users in/out, and dynamically pulling the latest packages and works from Firestore to display on the page.
- **`admin.js`**: Protects the `/admin.html` route so that only authorized admin emails can enter. Provides functionality to Create, Read, Update, and Delete (CRUD) packages, works, and view the orders submitted by users.
- **`firebase-config.js`**: Connects the frontend to your specific Firebase project using environment variables.

## ⚙️ Setup and Installation

1. **Install Dependencies**  
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**  
   Create a `.env` file in the root of the project to store your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Database Configuration**  
   Ensure you have set up a Cloud Firestore database with the following collections:
   - `packages` (for pricing cards)
   - `works` (for the recent projects slider)
   - `orders` (for tracking user requests)

4. **Run Development Server**  
   Start the Vite local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Build for Production**  
   To build the final optimized site for deployment:
   ```bash
   npm run build
   ```
