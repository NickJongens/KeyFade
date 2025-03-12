document.addEventListener('DOMContentLoaded', () => {
  // Get injected environment variables
  const HMAC_SECRET = window.HMAC_SECRET;
  const BACKEND_URL = window.BACKEND_URL;
  const FRONTEND_URL = window.FRONTEND_URL;

  // UI elements for different states
  const createState = document.getElementById('createState');
  const linkState = document.getElementById('linkState');
  const viewState = document.getElementById('viewState');

  // Create state elements
  const createForm = document.getElementById('createForm');
  const secretInput = document.getElementById('secretInput');
  const expirySlider = document.getElementById('expirySlider');
  const expiryLabel = document.getElementById('expiryLabel');

  // Link state elements
  const secretLink = document.getElementById('secretLink');
  const copyButton = document.getElementById('copyButton');

  // View state elements
  const secretValue = document.getElementById('secretValue');
  const deleteButton = document.getElementById('deleteButton');
  const viewCopyButton = document.getElementById('viewCopyButton');

  // Variables for delete confirmation
  let isDeleteConfirmed = false;
  let deleteTimer;

  // Expiry options and labels
  const expiryOptions = [1, 7, 14, 30, 60, 90];
  const expiryLabels = [
    "1 Day",
    "1 Week (7 Days)",
    "2 Weeks (14 Days)",
    "1 Month (30 Days)",
    "2 Months (60 Days)",
    "3 Months (90 Days)"
  ];

  // Set initial state: show create state only
  createState.classList.remove('hidden');
  linkState.classList.add('hidden');
  viewState.classList.add('hidden');

  // Update expiry label on slider input
  expirySlider.addEventListener('input', () => {
    const index = parseInt(expirySlider.value, 10);
    expiryLabel.textContent = expiryLabels[index];
  });

  // Create secret: submit form
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const secret = secretInput.value.trim();
    if (!secret) {
      alert("Please enter a secret.");
      return;
    }
    const expiryDays = expiryOptions[parseInt(expirySlider.value, 10)];
    try {
      const response = await fetch(`${BACKEND_URL}/api/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: secret, expiryDays }),
      });
      const data = await response.json();
      if (data.fullUrl) {
        secretLink.href = data.fullUrl;
        secretLink.textContent = data.fullUrl;
        // Switch to link state
        createState.classList.add('hidden');
        linkState.classList.remove('hidden');
      } else {
        alert('Failed to generate link.');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating link.');
    }
  });

  // Copy link functionality in Link State
  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(secretLink.href)
      .then(() => showToast('Link copied!'))
      .catch((err) => {
        console.error('Failed to copy link:', err);
        showToast('Failed to copy link.');
      });
  });

  // View state copy functionality
  if (viewCopyButton) {
    viewCopyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(secretValue.textContent)
        .then(() => showToast('Secret copied!'))
        .catch(err => {
          console.error('Failed to copy secret:', err);
          showToast('Failed to copy secret.');
        });
    });
  }

  // Helper function: show a non-intrusive toast message
  function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = 'rgba(0,0,0,0.7)';
      toast.style.color = '#fff';
      toast.style.padding = '10px 20px';
      toast.style.borderRadius = '4px';
      toast.style.fontSize = '0.9rem';
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease-in-out';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 2000);
  }

  // Helper function: compute HMAC signature using Web Crypto API
  async function computeHMAC(message, secret) {
    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // If URL is in the format /:id/:key, switch to View State
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length === 2) {
    const secretId = pathParts[0];
    const secretKey = pathParts[1];
    const originalUrl = `/api/secrets/${secretId}/${secretKey}`;
    // Remove protocol from BACKEND_URL for HMAC calculation
    const backendHost = BACKEND_URL.replace(/^https?:\/\//, '');
    const baseString = "GET" + backendHost + originalUrl;
    // Switch to view state
    createState.classList.add('hidden');
    linkState.classList.add('hidden');
    viewState.classList.remove('hidden');
    // Fetch secret with HMAC signature
    computeHMAC(baseString, HMAC_SECRET).then(signature => {
      fetch(`${BACKEND_URL}${originalUrl}`, {
        headers: { 'x-signature': signature }
      })
        .then(res => res.json())
        .then(data => {
          if (data.value) {
            secretValue.textContent = data.value;
            // Display days remaining notification if available
            if (data.daysLeft !== undefined && data.daysLeft !== null) {
              if (data.daysLeft === 1) {
                showToast('Link expiring today!');
              } else {
                showToast(`Link valid for ${data.daysLeft} Days`);
              }
            }
          } else {
            showToast('Secret not found or expired.');
            secretValue.textContent = 'Secret Expired or Deleted';
          }
        })
        .catch(err => {
          console.error(err);
          showToast('Error retrieving secret.');
          secretValue.textContent = 'Secret Expired or Deleted';
        });
    });

    // Delete secret functionality in View State with double-click confirmation
    deleteButton.addEventListener('click', () => {
      // If not yet confirmed, change the button text to "Confirm?"
      if (!isDeleteConfirmed) {
        isDeleteConfirmed = true;
        deleteButton.textContent = "Confirm?";
        // Reset confirmation after 3 seconds
        deleteTimer = setTimeout(() => {
          isDeleteConfirmed = false;
          deleteButton.textContent = "Delete";
        }, 3000);
        return; // Exit without deleting
      }
      
      // If confirmed, clear the timer and proceed with deletion
      clearTimeout(deleteTimer);
      const deleteBaseString = "DELETE" + backendHost + originalUrl;
      computeHMAC(deleteBaseString, HMAC_SECRET).then(signature => {
        fetch(`${BACKEND_URL}${originalUrl}`, {
          method: 'DELETE',
          headers: { 'x-signature': signature }
        })
          .then(res => res.json())
          .then(data => {
            showToast(data.message);
            deleteButton.disabled = true;
            // Immediately update secret box text if deletion is successful
            secretValue.textContent = 'Secret Expired or Deleted';
            // After 2 seconds, redirect to the home page
            setTimeout(() => {
              window.location.href = FRONTEND_URL;
            }, 2000);
          })
          .catch(err => {
            console.error(err);
            showToast('Error deleting secret.');
          });
      });
    });
  }
});
