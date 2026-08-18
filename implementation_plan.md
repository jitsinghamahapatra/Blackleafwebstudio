# Implementation Plan - MongoDB Transition, Google-Only Signup, Profile Management, and Site Expansion

We will transition the Blackleaf Studio web application from Firebase Firestore to a MongoDB database. We will also implement a Google-only sign-up flow with subsequent details completion (Name, Phone, Password), email/password login, profile management, automated screenshot previews for portfolio projects, expand the homepage content, and add three new pages: Services, Portfolio, and Contact.

---

## User Review Required

> [!IMPORTANT]
> **MongoDB Connection**:
> You provided the connection string: `mongodb+srv://blackleafwebstudio_db_user:<db_password>@cluster0.nimpnyw.mongodb.net/`.
> Please replace `<db_password>` in your `.env` file with your actual database password after this implementation.
> We will configure the backend to use `process.env.MONGODB_URI` from the `.env` file.

> [!WARNING]
> **Firebase Firestore Deprecation**:
> This plan completely replaces Firebase Firestore with MongoDB. The existing packages, projects, and requests will now be stored in MongoDB. If you have active live data in Firestore, it will need to be seeded or migrated to MongoDB. We will include a seeding script to populate default packages and projects into MongoDB.

> [!NOTE]
> **Google Sign-In Flow**:
> Users can only sign up via Google authentication. Upon their first login, they must fill in a one-time "Complete Registration" form to set their name (autofilled, changeable), phone number, and password. Once completed, they can log in using either Google OR their email and password in the future.

---

## Proposed Changes

We will group the changes into **Backend API Server (Node/Express)**, **Vite/Proxy Config**, **Frontend Auth & Profile Flow**, **Automated Project Preview**, **Homepage Extension**, and **New Pages**.

### Backend API Server (Node/Express)

We will build a structured Node.js backend using Express and Mongoose to handle data storage in MongoDB and user sessions.

#### [NEW] [server.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server.js)
The main Express application entry point. It will:
- Connect to MongoDB using the `MONGODB_URI` environment variable.
- Configure CORS, body parsing, and request logging.
- Set up API routes for authentication, packages, projects, orders, and content.
- Serve built static frontend files in production.

#### [NEW] [models/User.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server/models/User.js)
Mongoose Schema for User:
- `name` (String, required)
- `email` (String, required, unique)
- `phone` (String)
- `password` (String, hashed)
- `googleId` (String, unique if set)
- `role` (String, default: `'user'`) - `jitsinghamahapatra2006@gmail.com` will automatically be flagged as `'admin'`.

#### [NEW] [models/Package.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server/models/Package.js)
Mongoose Schema for Packages:
- `_id` (String) - We will map the custom ID (1, 2, 3) to `_id`.
- `name` (String, required)
- `price` (String, required)
- `img` (String)
- `features` ([String])

#### [NEW] [models/Project.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server/models/Project.js)
Mongoose Schema for Projects:
- `title` (String, required)
- `desc` (String)
- `img` (String, optional) - If empty, we fallback to screenshot.
- `link` (String, required) - Project URL used for screenshot preview.

#### [NEW] [models/Request.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server/models/Request.js)
Mongoose Schema for Requests (Orders):
- `uid` (String) - User ID
- `name` (String)
- `email` (String)
- `package` (String)
- `details` (String)
- `status` (String, default: `'Pending'`)
- `timestamp` (Date, default: Date.now)

#### [NEW] [models/Content.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server/models/Content.js)
Mongoose Schema for Global Content (e.g. Hero Section):
- `key` (String, unique) - e.g. `'hero'`
- `priceTag` (String)
- `title` (String)
- `desc` (String)
- `img` (String)

#### [NEW] [middleware/auth.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server/middleware/auth.js)
Middleware to verify JSON Web Tokens (JWT) for protected routes.
- Decodes the JWT token sent in `Authorization: Bearer <token>`.
- Attaches the user object to the request.
- Handles role-based access control (e.g. `isAdmin`).

#### [NEW] [scripts/seed.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/server/scripts/seed.js)
A script to populate initial packages, projects, and hero content in MongoDB if they are empty, so the site doesn't load blank upon first start.

---

### Configuration & Proxy

#### [MODIFY] [vite.config.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/vite.config.js)
- Modify the Vite configuration to add a server proxy for `/api`. All API requests from frontend will be routed to `http://localhost:5000` in development.
- Register new pages (`services.html`, `portfolio.html`, `contact.html`) as inputs in `rollupOptions` so Vite bundle compiles them correctly.

#### [MODIFY] [.env](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/.env)
- Add `MONGODB_URI=mongodb+srv://blackleafwebstudio_db_user:<db_password>@cluster0.nimpnyw.mongodb.net/blackleaf`
- Add `JWT_SECRET=supersecretjwtkeyforblackleafstudio`

#### [MODIFY] [package.json](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/package.json)
- Add dependencies for Express server and database: `express`, `mongoose`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`.
- Add a new script: `"server": "node server/server.js"` and `"seed": "node server/scripts/seed.js"`.

---

### Authentication, Profile & Screenshot Flows

#### [MODIFY] [firebase-config.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/firebase-config.js)
- Remove Firestore imports and initializations. Keep Firebase Auth config since we will still use Firebase Client SDK for the Google Auth popup.

#### [MODIFY] [app.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/app.js)
- Update authentication flows:
  - **Google Login**: After `signInWithPopup`, send the Google profile details to `/api/auth/google-login`.
    - If backend returns `isNewUser: true`, open the **Complete Registration Modal**.
    - If backend returns registration complete, store the JWT in `localStorage` and log the user in.
  - **Email Login**: Call `/api/auth/email-login` with email and password. Save JWT and log user in.
  - **Complete Registration**: A new form submitting to `/api/auth/register-details` containing Phone and Password.
  - **Profile Modal**: Provide a modal where users can edit Name, Phone number, and Password. When saved, submits to `/api/auth/update-profile`.
  - **Session Restoration**: Check `localStorage` for JWT on page load, fetch user profile from `/api/auth/me` to maintain active login session.
- Update data loaders (`loadContent`, `loadPackages`, `loadProjects`) to fetch from local `/api` routes instead of Firestore.
- Update **Project Preview Rendering**:
  - If a project's `img` is empty or a placeholder, automatically generate the preview URL:
    `const previewUrl = 'https://api.microlink.io/?url=' + encodeURIComponent(project.link) + '&screenshot=true&embed=screenshot.url';`

#### [MODIFY] [admin.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/admin.js)
- Replace Firestore calls with fetch requests to `/api` endpoints:
  - Orders: `GET /api/orders`, `PUT /api/orders/:id`, `DELETE /api/orders/:id`.
  - Hero: `GET /api/content/hero`, `POST /api/content/hero`.
  - Packages: `GET /api/packages`, `POST /api/packages`, `PUT /api/packages/:id`, `DELETE /api/packages/:id`.
  - Projects: `GET /api/projects`, `POST /api/projects`, `PUT /api/projects/:id`, `DELETE /api/projects/:id`.
- Project form updates:
  - Remove `required` from the image URL field in project creations.
  - If image URL is left blank, backend or frontend will render screenshots using the URL.

---

### Homepage Extensions & New Pages

#### [MODIFY] [index.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/index.html)
- Add new sections to the homepage:
  - **About Blackleaf / Code Philosophy**: Neo-brutalist layout detailing the benefits of hand-coded sites (no bloated builders).
  - **Process / How We Work**: Step-by-step timeline of our development process.
  - **Core Features**: Cards detailing performance, responsive design, SEO optimization, and security.
  - **FAQ**: Beautiful Space Mono typography styled accordion with common client inquiries.
- Navbar & Footer links updated to point to `services.html`, `portfolio.html`, and `contact.html`.
- Add structure for:
  - **Complete Registration Modal**: Fields for email (disabled), name, phone number, and password.
  - **Profile Modal**: Fields to update Name, Phone, and Password.
  - **Toast message system** and custom auth displays.

#### [NEW] [services.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/services.html) & [services.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/services.js)
A dedicated services page showcasing our development, design, and SEO services in details. It will display:
- Breakdown of web design, development, and hosting options.
- The dynamic pricing grid fetched from MongoDB (with quick order links).
- Dynamic custom request trigger.

#### [NEW] [portfolio.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/portfolio.html) & [portfolio.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/portfolio.js)
A dedicated page to show all completed projects:
- Grid layout showing website screenshots fetched automatically using Microlink.
- Project filter buttons (e.g., "All", "Landing Pages", "E-commerce", "SaaS").
- Fast navigation back to request page.

#### [NEW] [contact.html](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/contact.html) & [contact.js](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/contact.js)
Dedicated contact page containing:
- Contact information details.
- Stylized neo-brutalist message form (stores direct messages in MongoDB `messages` collection or requests).
- A responsive layout with hover states matching `style.css`.

#### [MODIFY] [style.css](file:///c:/Users/jitsi/OneDrive/Desktop/Programming/Z+%20Projects/blackleaf%20studio/style.css)
- Add CSS styling rules for the FAQ accordion, timeline steps, feature cards.
- Add CSS styling for Complete Registration modal, Profile modal.
- Add styling for Portfolio filters, layout grids, and Service descriptions.

---

## Verification Plan

### Automated Verification & Building
- We will install the backend packages.
- We will run the seed script: `npm run seed` to verify MongoDB database connection and populate initial data.
- We will run `npm run build` to verify Vite compilation of the multi-page inputs (`index.html`, `admin.html`, `services.html`, `portfolio.html`, `contact.html`).
- We will run both the Express API server and the Vite dev server to verify interaction.

### Manual Verification
- **Google Sign-In**: Open the browser, log in with Google, check if the "Complete Registration" popup appears for a new user.
- **Details Entry**: Submit the registration details and check if the user is saved correctly in MongoDB with a hashed password.
- **Email & Password Login**: Logout and log in again using the email and password just set.
- **Profile Edit**: Click the profile button, change the name and phone number, and verify the changes persist in MongoDB.
- **Project Screenshot**: Add a project in the Admin dashboard leaving the image URL blank, and verify it renders the screenshot on the website.
