# KeyFade

Keyfade simplifies the process of securely sharing passwords and sensitive data. By using end-to-end encryption, it ensures that only the intended recipients can view the shared content.

It's designed for simplicity and security, making password sharing easy for both individuals and teams. Whether you're working on a personal project or collaborating with a team, Keyfade takes the complexity out of sharing passwords securely by expiring links to the credential.

## Features

- **Store Secrets:** Securely store secrets in Azure Key Vault.
- **Retrieve Secrets:** Retrieve secrets based on secret IDs.
- **Expire Secrets:** Automatic cleanup of expired secrets to ensure security.
- **Rate Limiting:** Protect the API from abuse with rate limiting for secret access.
- **Webhook Notifications:** Send alerts via webhooks (such as Microsoft Teams) for key actions like rate limiting, security alerts, or server startup.

## Architecture

This service is built using the following technologies:

- **Node.js:** A JavaScript runtime used for building the server.
- **Express** Web frontend for interacting with the service.
- **Azure SDK (Key Vault & Identity):** Azure SDK libraries to interact with Azure Key Vault and authenticate.
- **Express.js:** Web framework for handling HTTP requests.
- **Axios:** HTTP client for sending webhook notifications.
- **Winston:** Logging library for structured and configurable logging.

### Environment Variables:

  CLIENT_ID:
  AzureClient/App ID for authentication

  CLIENT_SECRET:
  Secret key associated with the Client/App ID

  TENANT_ID:
  Your Azure Active Directory Tenant ID
  KEY_VAULT_NAME:
  Name of the Key Vault used for secure data storage without the full url
  
  BACKEND_URL:
  URL of the backend (e.g., https://demo-api.keyfade.com)

  FRONTEND_URL:
  URL of the frontend (e.g., https://demo.keyfade.com)

  HMAC_SECRET:
  Secret key shared between the frontend and backend for HMAC validation
  
  WEBHOOK_URL:	
  URL of the Microsoft Teams Webhook for notifications

## Build & Run

Build the container if you've made any changes or would like to ensure you have a local container:

```
docker build -t keyfade:latest .
```

Docker Run:

```
docker run -d -p <frontendport>:9001 -p <backendport>:9002 \
  --name keyfade \
  -e CLIENT_ID=<YOUR_CLIENT_ID> \
  -e CLIENT_SECRET=<YOUR_CLIENT_SECRET> \
  -e TENANT_ID=<YOUR_TENANT_ID> \
  -e KEY_VAULT_NAME=<YOUR_AZURE_KEY_VAULT> \
  -e BACKEND_URL=https://demo-api.keyfade.com \
  -e FRONTEND_URL=https://demo.keyfade.com \
  -e HMAC_SECRET=<YOUR_HMAC_SECRET> \
  -e WEBHOOK_URL=<YOUR_TEAMS_WEBHOOK_URL> \
  -e CREATE_PASSWORD_LABEL="Secret to Encrypt:" \
  -e CREATE_EXPIRY_OPTIONS_LABEL="Expiry Options:" \
  -e LINK_GENERATED_LABEL="Encrypted Link:" \
  -e LINK_COPY_LABEL="Copy Link" \
  -e SECRET_LABEL="Secret:" \
  -e LINK_BELOW_TEXT="Please remember to send this link to your technician." \
  -e EXPIRY_SLIDER_COLOR=black \
  -e TEXT_COLOR=black \
  -e BUTTON_COLOR=black \
  -e DELETE_BUTTON_COLOR=red \
  -e LOGO_URL=https://public.keyfade.com/logo.png \
  -e FAVICON_URL=https://demo.keyfade.com/favicon.ico \
  keyfade:latest
```

## Azure Key Vault Setup

1. Setup an Azure Key Vault (Free or close to free - less than $0.10 a month with typical usage)

2. Create an App Registration in [Entra ID - App Registrations](https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade/quickStartType~/null/sourceType/Microsoft_AAD_IAM)

3. Note down the **'Application (client) ID'**

4. Note down the **'Directory (tenant) ID'**

5. Create a **'New Client secret'** under **'Certificates & secrets'** and copy the **Value**, not the ID.
   This will be your Client_Secret for deploying.

There are no API permissions to be given here. These are provided in the Key Vault.

7. Setup an **'Access Policy'** within your Azure Key Vault with 'Configure from a template > Secret Management'.
  Use the **'Application (client) ID'** or **'Application Name'** to search for a principle to add permissions to the key vault.

8. Add the values above to the docker run command, or docker-compose file, then **deploy your container**.

# Recommendations/Options
- Setup a Cloudflare tunnel to point to a self-hosted container for both the frontend and backend ports.
- Setup an Azure Kubernetes Cluster behind a load balancer to provide public access to each service.
- Run the container within Azure Container Instances.



