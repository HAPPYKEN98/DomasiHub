const API_URL = window.location.hostname.includes('localhost') 
    ? 'http://localhost:3000' 
    : 'https://domasi-hub-production.up.railway.app';

document.addEventListener("DOMContentLoaded", () => {
    const marketplaceForm = document.getElementById("marketplaceForm");
    const printerForm = document.getElementById("printerForm");
    const accommodationForm = document.getElementById("accommodationForm");

    if (marketplaceForm) {
        marketplaceForm.addEventListener("submit", (e) => handleFormSubmit(e, "marketplace"));
    }
    if (printerForm) {
        printerForm.addEventListener("submit", (e) => handleFormSubmit(e, "printing"));
    }
    if (accommodationForm) {
        accommodationForm.addEventListener("submit", (e) => handleFormSubmit(e, "accommodation"));
    }
});

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}

async function handleFormSubmit(e, category) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Publishing...";
    }

    try {
        const formData = new FormData(form);
        const imageFile = formData.get("image");
        let imageBase64 = "";

        if (imageFile && imageFile.size > 0) {
            imageBase64 = await fileToBase64(imageFile);
        }

        const fullName = localStorage.getItem('user_name') || 
                         localStorage.getItem('user_fullname') || 
                         localStorage.getItem('fullname') || 
                         localStorage.getItem('username') || 
                         'Campus Student';

        const regNumber = localStorage.getItem('user_reg') || 
                          localStorage.getItem('regNumber') || 
                          '';

        const postedByFormatted = regNumber ? `${fullName} (${regNumber})` : fullName;

        const payload = {
            posted_by: postedByFormatted,
            category: category,
            title: formData.get("title") || "",
            price: parseFloat(formData.get("price")) || 0,
            contact_number: formData.get("contact_number") || "",
            image_path: imageBase64,
            item_condition: formData.get("item_condition") || "",
            security_condition: formData.get("security_condition") || "",
            location_details: formData.get("location_details") || ""
        };

        const response = await fetch(`${API_URL}/api/listings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            alert("Success: " + (result.message || "Listing created successfully!"));
            form.reset();
            const activeModal = form.closest(".modal-overlay");
            if (activeModal) {
                activeModal.classList.remove("active");
            }
        } else {
            alert("Error: " + (result.error || "Failed to save listing."));
        }

    } catch (error) {
        console.error("Submission failed:", error);
        alert("Server communication error. Check if backend is running.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = category === "printing" ? "Launch Station" : 
                                   category === "accommodation" ? "Publish Lodging Unit" : "Publish Item";
        }
    }
}