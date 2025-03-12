const axios = require('axios');
const { WEBHOOK_URL, BACKEND_URL } = process.env;

const sendWebhookNotification = async (title, payload) => {
  if (!WEBHOOK_URL) {
    console.error("WEBHOOK_URL is not defined in the environment variables.");
    return;
  }

  // Function to create the server start message
  const createServerStartMessage = () => ({
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": title,
    "themeColor": "00FF00", // Green for server start
    "title": title,
    "sections": [
      {
        "facts": [
          { "name": "Backend URL", "value": BACKEND_URL },
        ],
        "text": "Server Started"
      }
    ]
  });

  // Function to create the error alert message
  const createErrorMessage = () => ({
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": title,
    "themeColor": "FF0000", // Red for error alerts
    "title": title,
    "sections": [
      {
        "facts": [
          { "name": "Error Message", "value": payload.errorMessage || 'No specific error' },
          { "name": "Secret ID", "value": payload.secretId || 'N/A' },
          { "name": "IP Address", "value": payload.ip || 'Unknown' },
        ],
        "text": payload.text || 'Rate limit or security alert triggered. Consider blocking this IP at the firewall or proxy level to prevent further requests from this IP.'
      }
    ]
  });

  // Select the correct message based on the title
  const message = title === 'Server Start'
    ? createServerStartMessage()
    : createErrorMessage();

  try {
    await axios.post(WEBHOOK_URL, message);
    console.log("Webhook notification sent successfully.");
  } catch (error) {
    console.error("Failed to send webhook notification:", error.message);
  }
};

module.exports = { sendWebhookNotification };
