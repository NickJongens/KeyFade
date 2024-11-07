const crypto = require('crypto');

const secret = process.env.HMAC_SECRET; // Load HMAC secret from environment variables

const verifyHMAC = (req, res, next) => {
    const signature = req.headers['x-signature'];

    // Ensure the signature is present
    if (!signature) {
        console.warn('Missing signature in headers:', { receivedHeaders: req.headers });
        return res.status(401).send('Missing signature'); // Use 401 for missing signature
    }

    // Get the HTTP method
    const method = req.method; // Get the HTTP method (GET, POST, etc.)
    const body = req.body; // Get the request body

    // Create a base string for HMAC without protocol
    const baseString = method === 'POST' 
        ? `${method}${req.get('host')}${req.originalUrl}${JSON.stringify(body)}` 
        : `${method}${req.get('host')}${req.originalUrl}`;

    console.log('Base string for HMAC validation:', { baseString }); // Log the base string for debugging

    // Calculate HMAC using the secret
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(baseString);
    const calculatedSignature = hmac.digest('hex');
    console.log('Final base string for HMAC:', baseString);
    console.log('Calculated HMAC:', { calculatedSignature }); // Log calculated HMAC for debugging

    // Compare the calculated signature with the received signature
    if (calculatedSignature !== signature) {
        console.warn('Invalid signature received:', {
            receivedSignature: signature,
            calculatedSignature,
            baseString,
            reqBody: body
        });
        return res.status(401).send('Invalid signature'); // Use 401 for invalid signature
    }

    console.log('HMAC verification successful.'); // Log successful verification
    next();
};

module.exports = verifyHMAC;
