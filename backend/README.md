# Hangout Cafe Backend API (Supabase PostgreSQL Edition)

This is the production-ready REST API backend for the Hangout Cafe website. It is built using Node.js, Express.js, and Supabase PostgreSQL (via the official `@supabase/supabase-js` client), featuring JWT-based Admin authentication, request validation, and modular image storage (supporting local folder uploads for development and Cloudinary for production).

---

## Folder Structure

The project implements a clean MVC (Model-View-Controller) architecture:

```text
backend/
├── config/
│   └── supabase.js           # Supabase Client initialization
├── controllers/
│   ├── authController.js     # Admin login
│   ├── bannerController.js   # Banner management
│   ├── menuController.js     # Menu management
│   ├── galleryController.js  # Gallery management
│   ├── offerController.js    # Offers management
│   ├── aboutController.js    # About content management
│   └── contactController.js  # Contact details management
├── middleware/
│   ├── authMiddleware.js     # JWT token validation against Supabase admins
│   ├── errorMiddleware.js    # Centralized PostgreSQL/Supabase error handler
│   ├── uploadMiddleware.js   # Multer processing of file uploads
│   └── validator.js          # Input validation schemas (express-validator)
├── routes/
│   ├── authRoutes.js         # Routes under /api/admin
│   ├── bannerRoutes.js       # Routes under /api/banner
│   ├── menuRoutes.js         # Routes under /api/menu
│   ├── galleryRoutes.js      # Routes under /api/gallery
│   ├── offerRoutes.js        # Routes under /api/offers
│   ├── aboutRoutes.js        # Routes under /api/about
│   └── contactRoutes.js      # Routes under /api/contact
├── services/
│   └── uploadService.js      # Modular image upload (local/Cloudinary)
├── uploads/                  # Temporary/Local image storage folder
├── utils/
│   └── seedAdmin.js          # Admin account seed script
├── .env.example              # Sample environment configuration template
├── package.json              # Main dependencies & script commands
├── schema.sql                # SQL script to initialize Supabase PostgreSQL tables
├── server.js                 # Server entry point
└── README.md                 # Documentation
```

---

## Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16.0.0 or higher recommended)
- A [Supabase](https://supabase.com) Project

### 2. Database Schema setup
1. Open your Supabase Dashboard.
2. Navigate to the **SQL Editor** tab.
3. Create a new query.
4. Copy the entire contents of [schema.sql](file:///d:/hangout/backend/schema.sql) and paste them into the SQL Editor.
5. Click **Run** to create all tables (`admins`, `banners`, `menu`, `gallery`, `offers`, `about`, `contact`).

### 3. Installation
Navigate to the `backend` folder and install dependencies:
```bash
cd backend
npm install
```

### 4. Environment Variables
Create a `.env` file in the `backend/` directory by copying `.env.example`:
```bash
cp .env.example .env
```
Fill out the variables in `.env`:
*   `PORT`: Port for the Express server to run on (e.g. `5000`)
*   `SUPABASE_URL`: Your Supabase Project API URL (found under Project Settings > API)
*   `SUPABASE_ANON_KEY`: Your Supabase Anon public key
*   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role key (highly recommended for server-side operations to bypass RLS)
*   `JWT_SECRET`: Secret key for signing JSON Web Tokens
*   `ADMIN_EMAIL` & `ADMIN_PASSWORD`: Credentials used by the seed script to create the initial admin user.
*   `USE_CLOUDINARY`: Set to `true` to store images on Cloudinary, or `false` to store files locally in `/uploads`.
*   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Required only if `USE_CLOUDINARY=true`.

### 5. Database Seeding
Seed the initial and unique Admin account into your Supabase database:
```bash
npm run seed
```

### 6. Running the Server
To run in development mode with hot-reloading (nodemon):
```bash
npm run dev
```
To run in production mode:
```bash
npm start
```

---

## Modular Image Upload System

The backend features a modular upload service:
1. **Local Mode (`USE_CLOUDINARY=false`)**: Multer parses form-data, saves images to the `backend/uploads/` directory, and the API stores a relative URL (e.g., `/uploads/image-16789012.png`) in Supabase. The Express server serves these images statically via `http://localhost:5000/uploads/...`.
2. **Cloudinary Mode (`USE_CLOUDINARY=true`)**: Multer processes files locally, the `uploadService` automatically uploads them to Cloudinary, deletes the local file, and stores the Cloudinary secure URL (e.g., `https://res.cloudinary.com/...`) in Supabase.
3. **Deletions**: Deleting documents (Banner, Menu, Gallery, Offers, etc.) automatically triggers the `deleteImage(url)` helper, which deletes the file from local storage or from Cloudinary (using its public ID).

---

## API Documentation

All request bodies must be sent as `application/json` (except for endpoints accepting image uploads, which must be sent as `multipart/form-data`).

Protected routes require a `Bearer <JWT_TOKEN>` token inside the `Authorization` header.

### API Response Format

#### Success
```json
{
  "success": true,
  "message": "Operation description",
  "data": {} // Object or array containing data (Mapped automatically to match Mongoose schemas)
}
```

#### Failure (Validation / Runtime Error)
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Error details on field"
    }
  ]
}
```

---

### Endpoints Details

#### 1. Authentication
*   **POST** `/api/admin/login`
    *   **Access**: Public
    *   **Body**: `{ "email": "admin@example.com", "password": "securepassword" }`
    *   **Returns**: JWT token and admin details.

#### 2. Banners
*   **GET** `/api/banner`
    *   **Access**: Public
    *   **Returns**: Banners sorted by `displayOrder` ascending.
*   **POST** `/api/banner`
    *   **Access**: Protected (Admin)
    *   **Body (`multipart/form-data`)**:
        *   `image` (File, required)
        *   `title` (String, optional)
        *   `subtitle` (String, optional)
        *   `displayOrder` (Number, optional, default: 0)
*   **PUT** `/api/banner/:id`
    *   **Access**: Protected (Admin)
    *   **Body (`multipart/form-data`)**:
        *   `image` (File, optional - replaces previous image if provided)
        *   `title` (String, optional)
        *   `subtitle` (String, optional)
        *   `displayOrder` (Number, optional)
*   **DELETE** `/api/banner/:id`
    *   **Access**: Protected (Admin)
    *   **Description**: Deletes banner and removes its image.

#### 3. Menu Items
*   **GET** `/api/menu`
    *   **Access**: Public
    *   **Query Params (Optional Filters)**:
        *   `category`: e.g. `Beverages`
        *   `isFeatured`: `true` or `false`
        *   `isAvailable`: `true` or `false`
*   **GET** `/api/menu/:id`
    *   **Access**: Public
    *   **Returns**: A single menu item by ID.
*   **POST** `/api/menu`
    *   **Access**: Protected (Admin)
    *   **Body (`multipart/form-data`)**:
        *   `image` (File, required)
        *   `category` (String, required)
        *   `itemName` (String, required)
        *   `description` (String, optional)
        *   `price` (Number, required)
        *   `isAvailable` (Boolean, optional, default: true)
        *   `isFeatured` (Boolean, optional, default: false)
*   **PUT** `/api/menu/:id`
    *   **Access**: Protected (Admin)
    *   **Body (`multipart/form-data`)**: Any menu properties (image optional).
*   **DELETE** `/api/menu/:id`
    *   **Access**: Protected (Admin)
    *   **Description**: Deletes menu item and its image.

#### 4. Gallery Images
*   **GET** `/api/gallery`
    *   **Access**: Public
    *   **Returns**: All gallery items sorted by `createdAt` desc.
*   **POST** `/api/gallery`
    *   **Access**: Protected (Admin)
    *   **Body (`multipart/form-data`)**:
        *   `image` (File, required)
        *   `caption` (String, optional)
*   **DELETE** `/api/gallery/:id`
    *   **Access**: Protected (Admin)
    *   **Description**: Deletes gallery item and image.

#### 5. Offers
*   **GET** `/api/offers`
    *   **Access**: Public
    *   **Query Params (Optional)**:
        *   `activeOnly`: Set to `true` to only fetch active (and unexpired) offers.
*   **POST** `/api/offers`
    *   **Access**: Protected (Admin)
    *   **Body (`multipart/form-data`)**:
        *   `image` (File, required)
        *   `title` (String, required)
        *   `description` (String, optional)
        *   `expiryDate` (Date ISO-8601, optional)
        *   `isActive` (Boolean, optional, default: true)
*   **PUT** `/api/offers/:id`
    *   **Access**: Protected (Admin)
    *   **Body (`multipart/form-data`)**: Any offer fields (image optional).
*   **DELETE** `/api/offers/:id`
    *   **Access**: Protected (Admin)

#### 6. About Page (Singleton)
*   **GET** `/api/about`
    *   **Access**: Public
    *   **Returns**: About page details.
*   **PUT** `/api/about`
    *   **Access**: Protected (Admin)
    *   **Body (`multipart/form-data`)**:
        *   `image` (File, optional if updating, required if creating initial)
        *   `description` (String, required)
    *   **Description**: Creates (if missing) or updates the single about details page.

#### 7. Contact Details (Singleton)
*   **GET** `/api/contact`
    *   **Access**: Public
    *   **Returns**: Contact details.
*   **PUT** `/api/contact`
    *   **Access**: Protected (Admin)
    *   **Body (`application/json`)**:
        *   `address` (String, required)
        *   `phone` (String, required)
        *   `email` (String, required)
        *   `openingHours` (String, required)
        *   `instagram` (String, optional)
        *   `facebook` (String, optional)
        *   `whatsapp` (String, optional)
        *   `googleMapsLink` (String, optional)
    *   **Description**: Creates or updates the single contact detail record.
