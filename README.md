![KeyFade Logo](https://public.keyfade.com/logo.png)

# KeyFade - A Secure Link-Based Encryption Tool

<a href="https://www.buymeacoffee.com/NickJongens" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174">
</a>

KeyFade is a link-based encryption tool that allows users to encrypt secrets into shareable links with a specified expiration period. 
This project includes a user-friendly frontend, that connects to a secure backend API for encryption and storage of sensitive information using Azure Key Vault.

[Demo](https://demo.keyfade.com/)

## Features

### Frontend Features:
- **Encrypted Link Generation:** Easily create secure, encrypted links for sensitive data.
- **Link Expiry Options:** Choose from various expiry durations for your encrypted links.
- **Responsive UI:** A clean and responsive interface, styled with Chakra UI and customised with Tailwind CSS.
- **Customisable Themes and Settings:** Modify colors, labels, and other UI properties using environment variables.
  
### Backend Features:
- **Secure Secret Storage:** Stores secrets in Azure Key Vault, ensuring data is stored securely.
- **Secret Retrieval & Deletion:** API to retrieve and delete secrets from Azure Key Vault.
- **Rate Limiting & Security:** Protect the API with rate limiting to prevent abuse.
- **Webhook Notifications:** Send alerts via webhooks (e.g., Microsoft Teams) on server startup, rate-limiting events, or security alerts.
- **Expiration and Cleanup:** Automatically clean up expired secrets stored in Azure Key Vault.

## Architecture

This project is divided into two parts: the **Frontend** and the **Backend**. 

### Frontend:
- Built using **Vite** for fast development and hot reloading.
- Styled using **Chakra UI** and **Tailwind CSS** for a responsive, customisable interface.
- Connects to the backend API for generating and managing encrypted links.

### Backend:
- Built using **Node.js** with **Express.js** for API handling.
- **Azure Key Vault** integration to securely store and manage secrets.
- **Rate Limiting** and **Webhook Notifications** using libraries like **express-rate-limit** and **axios**.
- **Cron Jobs** for secret expiration cleanup.

## Readme/Setup
[Frontend](https://github.com/NickJongens/KeyFade/blob/main/keyfade-frontend/)

[Backend](https://github.com/NickJongens/KeyFade/blob/main/keyfade-backend/)


