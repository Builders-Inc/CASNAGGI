# Deployment Guide for Namecheap Shared Hosting (cPanel)

This guide walks you through deploying the FastAPI backend and React frontend to your Namecheap Shared Hosting account.

## Prerequisites
1. Access to your Namecheap cPanel.
2. The domain name is pointed to this hosting account.
3. MongoDB cluster URL (e.g., MongoDB Atlas) for the backend.

---

## Part 1: Deploying the Backend (FastAPI)

1. **Upload Backend Files:**
   - In cPanel, open **File Manager**.
   - Create a folder outside of `public_html` (e.g., `api_backend`).
   - Upload the entire `backend` folder contents into `api_backend`.

2. **Create a Python App:**
   - In cPanel, find the **Software** section and click on **Setup Python App**.
   - Click **Create Application**.
   - **Python version:** Select the highest 3.x version available (preferably 3.10 or higher).
   - **Application root:** Enter the folder name you created (e.g., `api_backend`).
   - **Application URL:** This is the URL where your API will be hosted (e.g., `yourdomain.com/api` or a subdomain like `api.yourdomain.com`).
   - **Application startup file:** `passenger_wsgi.py`
   - **Application Entry point:** `application`
   - Click **Create**.

3. **Install Dependencies:**
   - On the same "Setup Python App" page, scroll down to the **Configuration files** section.
   - Enter `requirements.txt` and click **Add**.
   - Click **Run Pip Install** and select `requirements.txt` from the dropdown. Wait for it to finish.
   
4. **Environment Variables:**
   - Scroll down to **Environment variables**.
   - Add your environment variables:
     - `MONGO_URL`: Your MongoDB connection string.
     - `DB_NAME`: Your database name.
     - `CORS_ORIGINS`: Your frontend domain (e.g., `https://yourdomain.com`).
   - **Important:** Click **Save** at the top, then **Restart** the application.

---

## Part 2: Deploying the Frontend (React)

1. **Build the Application:**
   - On your local computer, navigate to the `frontend` directory.
   - Create a `.env.production` file (or just `.env`) with your API URL:
     ```env
     REACT_APP_API_URL=https://yourdomain.com/api
     ```
   - Run the build command:
     ```bash
     yarn build
     ```
     *(or `npm run build`)*
   - This creates a `build` directory containing the optimized static files.

2. **Upload Frontend Files:**
   - In cPanel, open **File Manager**.
   - Navigate to the `public_html` directory.
   - Delete the default Namecheap `index.php` or `default.html` if it exists.
   - Upload the **contents** of your local `frontend/build` folder (including the `index.html`, `static` folder, etc.) into `public_html`.
   - Also, upload the `.htaccess` file from `frontend/public/.htaccess` to `public_html` to enable client-side routing. *(Note: you may need to enable "Show Hidden Files" in File Manager settings to see `.htaccess`)*.

---

## Troubleshooting

- **500 Internal Server Error on API:** Check the Passenger logs in cPanel (usually in `stderr.log` or by enabling `PassengerAppEnv development` via `.htaccess`). Ensure the MongoDB URL is correct and IP whitelist in MongoDB Atlas allows Namecheap IPs.
- **404 Errors on Frontend Reload:** Ensure the `.htaccess` file was successfully uploaded to `public_html`.
- **API CORS Errors:** Make sure `CORS_ORIGINS` in your Python app matches the exact URL of your frontend (e.g., `https://yourdomain.com`).
