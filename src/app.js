// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", function() {
    // Event listener for form submission
    document.getElementById("secretForm").addEventListener("submit", async function (e) {
        e.preventDefault(); // Prevent default form submission

        // Get the secret and expiry options from the form
        const secret = document.getElementById("secret").value;
        const expiryDays = document.getElementById("expiryRange").value;

        // Basic validation
        if (!secret) {
            alert("Please enter a secret.");
            return;
        }

        // Update UI to indicate loading
        document.getElementById("result").innerText = "Creating secure link...";

        // Create the request payload
        const data = { secret: secret, expiryDays: expiryDays };

        try {
            // Send a POST request to the backend function
            const response = await fetch("/api/createSecret", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            // Check if the response is OK (status 200-299)
            if (response.ok) {
                const result = await response.json();
                const secureUrl = result.secureUrl; // Expecting 'secureUrl' in response

                // Update UI with the secure link
                document.getElementById("result").innerHTML = `<p>Secure link created:</p><a href="${secureUrl}" target="_blank">${secureUrl}</a>`;
            } else {
                // Handle errors from the server
                const error = await response.json();
                throw new Error(error.message || "Error creating secure link");
            }
        } catch (error) {
            // Display error message to the user
            document.getElementById("result").innerText = `Failed to create secure link: ${error.message}`;
        }
    });

    // Update the expiry label as the slider is moved
    document.getElementById("expiryRange").addEventListener("input", function () {
        document.getElementById("expiryLabel").innerText = this.value;
    });
});
