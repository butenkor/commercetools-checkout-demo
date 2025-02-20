# Project description

A simple Node.js, Express, JS/HTML based checkout (https://docs.commercetools.com/checkout/overview) demo.

# Installation Guide

## Prerequisites

- Ensure you have **Node.js >=23.7.0** installed. You can check your version using:
  ```sh
  node -v
  ```
- Install **npm** (comes with Node.js)

## Installation Steps

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Set up environment variables:**

   Add `.env` file in the project root and adjust the template appropriately:

   ```sh
   # Server
   PORT=3555
   # Commercetools
   CTP_PROJECT_KEY=xxx
   CTP_CLIENT_ID=xxx
   CTP_CLIENT_SECRET=xxx
   CTP_AUTH_URL=https://auth.europe-west1.gcp.commercetools.com
   CTP_API_URL=https://api.europe-west1.gcp.commercetools.com
   # Checkout
   # us-central1.gcp, australia-southeast1.gcp
   CHECKOUT_REGION=europe-west1.gcp
   CHECKOUT_APPLICATION_KEY=xxx
   ```

3. **Run the server:**

   ```sh
   npm start
   ```

4. **Access the application:**

   The server runs on **[http://localhost:3555/](http://localhost:3555/)** by default.

# Configuration

- You can switch in the `index.html` file between 2 checkout modes `checkoutFlow | paymentFlow`.
- Adjust in `server.js` the `createCart` function with your own inputs in regards to currency, country and the SKU from your commercetools project.

