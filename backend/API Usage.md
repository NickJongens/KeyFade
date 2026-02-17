# How to create a new secret with the API

**POST** `/api/create`

## Request Details

### Request Body

Send a JSON object with the following properties:

- **value** (string, required): The secret you want to store.
- **expiryDays** (number, optional): The number of days until the secret expires. Defaults to 1 day and must be between 1 and 90.

### Example Request

```bash
curl -X POST https://demo-api.keyfade.com/api/create \
  -H "Content-Type: application/json" \
  -d '{
        "value": "mysecretvalue",
        "expiryDays": 7
      }'
```
## Expected Response

A successful request returns a `201 Created` status with a JSON response containing:

- **message**: Confirmation that the secret and key were stored.
- **secretId**: The unique identifier for the secret.
- **key**: The generated secure 16-character key.
- **expiresOn**: The expiration date for the secret.
- **fullUrl**: A complete URL (based on your FRONTEND_URL) to retrieve the secret.

## Example Response
```
{
  "message": "Secret and key stored successfully",
  "secretId": "9b1deb4d-3b7d-4f8d-a47a-3f4b98b2f5a7",
  "key": "e4f8a1d2b3c4d5e6",
  "expiresOn": "2025-03-24T12:34:56.789Z",
  "fullUrl": "https://demo.keyfade.com/9b1deb4d-3b7d-4f8d-a47a-3f4b98b2f5a7/e4f8a1d2b3c4d5e6"
}
```
