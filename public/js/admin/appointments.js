function openWalkInModal() {
    document.getElementById('walkInModal').classList.add('active');
    loadServicesForWalkIn();
}

function closeWalkInModal() {
    document.getElementById('walkInModal').classList.remove('active');
}

async function loadServicesForWalkIn() {
    try {
        const response = await fetch('/api/services');
        const data = await response.json();
        const select = document.querySelector('#walkInModal select[name="serviceId"]');
        
        select.innerHTML = '<option value="">Select Service</option>';
        data.services.forEach(service => {
            select.innerHTML += `<option value="${service._id}">${service.name} - ₱${service.price}</option>`;
        });
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Reschedule functionality removed - admins cannot reschedule appointments

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
