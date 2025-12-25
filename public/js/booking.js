document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('date');
    const staffSelect = document.getElementById('staffId');
    const timeSlotsContainer = document.getElementById('timeSlots');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const bookingForm = document.querySelector('.booking-form');

    // Get service data from data attributes
    const bookingData = document.getElementById('bookingData');
    const serviceId = bookingData ? bookingData.dataset.serviceId : null;
    const servicePrice = bookingData ? parseFloat(bookingData.dataset.servicePrice) : 0;

    console.log('Booking page loaded');
    console.log('Service ID:', serviceId);
    console.log('Service Price:', servicePrice);

    // Check if serviceId is defined
    if (!serviceId) {
        console.error('ERROR: serviceId is not defined!');
        timeSlotsContainer.innerHTML = '<p class="hint">Error: Service ID missing. Please go back and select a service again.</p>';
        return;
    }

    // Check business hours when date changes
    dateInput.addEventListener('change', async function() {
        const selectedDate = this.value;
        if (!selectedDate) return;
        
        // Always try to load time slots if staff is selected
        if (staffSelect.value) {
            await loadTimeSlots();
        } else {
            timeSlotsContainer.innerHTML = '<p class="hint">Please select a staff member first</p>';
        }
    });
    
    staffSelect.addEventListener('change', async function() {
        if (dateInput.value) {
            await loadTimeSlots();
        } else {
            timeSlotsContainer.innerHTML = '<p class="hint">Please select a date first</p>';
        }
    });

    async function loadTimeSlots() {
        const date = dateInput.value;
        const staffId = staffSelect.value;

        console.log('Loading time slots for date:', date, 'staff:', staffId || 'Not selected');

        // Clear previously selected time slot
        startTimeInput.value = '';
        endTimeInput.value = '';

        if (!staffId) {
            timeSlotsContainer.innerHTML = '<p class="hint">Please select a staff member first</p>';
            return;
        }

        if (!date) {
            timeSlotsContainer.innerHTML = '<p class="hint">Please select a date first</p>';
            return;
        }

        // Show loading state
        timeSlotsContainer.innerHTML = '<p class="hint">Loading available time slots...</p>';

        try {
            const params = new URLSearchParams({
                serviceId: serviceId,
                staffId: staffId,
                date: date
            });

            console.log('Fetching slots from:', `/api/services/slots?${params}`);
            const response = await fetch(`/api/services/slots?${params}`);
            
            if (!response.ok) {
                console.error('API error:', response.status, response.statusText);
                timeSlotsContainer.innerHTML = '<p class="hint">Error loading time slots. Please try again.</p>';
                return;
            }
            
            const data = await response.json();
            console.log('Slots received:', data.slots ? data.slots.length : 0, 'slots');

            // Check if there's a message indicating business is closed
            if (data.message && data.message.includes('closed')) {
                timeSlotsContainer.innerHTML = `<p class="hint">${data.message}</p>`;
                return;
            }

            if (data.slots && data.slots.length > 0) {
                timeSlotsContainer.innerHTML = data.slots.map(slot => `
                    <div class="time-slot" data-start="${slot.start}" data-end="${slot.end}">
                        ${slot.display || slot.start}
                    </div>
                `).join('');

                // Add click handlers
                document.querySelectorAll('.time-slot').forEach(slot => {
                    slot.addEventListener('click', function() {
                        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                        this.classList.add('selected');
                        startTimeInput.value = this.dataset.start;
                        endTimeInput.value = this.dataset.end;
                        console.log('Time slot selected:', this.dataset.start, '-', this.dataset.end);
                    });
                });
            } else {
                timeSlotsContainer.innerHTML = `<p class="hint">No available time slots for this date</p>`;
            }
        } catch (error) {
            console.error('Error loading slots:', error);
            timeSlotsContainer.innerHTML = '<p class="hint">Error loading time slots</p>';
        }
    }

    // Modal functions
    function showModal(title, message, icon = '⚠️') {
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalIcon = document.getElementById('modalIcon');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        if (modalIcon) {
            modalIcon.textContent = icon;
        }
        modal.style.display = 'flex';
    }

    function hideModal() {
        const modal = document.getElementById('messageModal');
        modal.style.display = 'none';
    }

    // Close modal on button click
    document.getElementById('modalCloseBtn').addEventListener('click', hideModal);

    // Close modal on overlay click
    document.getElementById('messageModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideModal();
        }
    });

    // Form validation and submission
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('Form submitting...');
        console.log('Date:', dateInput.value);
        console.log('Start Time:', startTimeInput.value);
        console.log('End Time:', endTimeInput.value);
        console.log('Staff:', staffSelect.value);

        if (!startTimeInput.value || !endTimeInput.value) {
            showModal('Missing Information', 'Please select a time slot before booking!', '⚠️');
            console.error('Form validation failed: No time slot selected');
            return false;
        }

        if (!dateInput.value) {
            showModal('Missing Information', 'Please select a date!', '⚠️');
            console.error('Form validation failed: No date selected');
            return false;
        }

        console.log('Form validation passed, showing confirmation...');
        
        // Show confirmation modal
        showBookingConfirmation();
    });

    // Show booking confirmation modal
    function showBookingConfirmation() {
        const modal = document.getElementById('bookingConfirmModal');
        const selectedDate = new Date(dateInput.value).toLocaleDateString('en-US', { 
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
        });
        const selectedStaff = staffSelect.options[staffSelect.selectedIndex].text;
        const selectedTime = `${formatTime12Hour(startTimeInput.value)} - ${formatTime12Hour(endTimeInput.value)}`;
        
        document.getElementById('confirmDate').textContent = selectedDate;
        document.getElementById('confirmTime').textContent = selectedTime;
        document.getElementById('confirmStaff').textContent = selectedStaff;
        
        modal.style.display = 'flex';
    }

    // Close booking confirmation modal
    window.closeBookingConfirmModal = function() {
        document.getElementById('bookingConfirmModal').style.display = 'none';
    };

    // Confirm and submit booking
    window.confirmBooking = async function() {
        document.getElementById('bookingConfirmModal').style.display = 'none';
        
        // Submit form via fetch to handle errors
        try {
            const formData = new FormData(bookingForm);
            const response = await fetch('/appointments/book', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(formData)
            });

            const contentType = response.headers.get('content-type');
            
            if (response.ok) {
                // Success - redirect to appointments page
                window.location.href = '/appointments';
            } else {
                // Error - show modal with error message
                let errorMessage = 'An error occurred while booking. Please try again.';
                
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    errorMessage = data.error || data.message || errorMessage;
                    console.error('Booking error:', errorMessage);
                } else {
                    const text = await response.text();
                    console.error('Booking error (HTML response):', text);
                    // Try to extract error message from HTML
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    const errorElement = doc.querySelector('.error-message, .alert-error, p');
                    if (errorElement) {
                        errorMessage = errorElement.textContent.trim();
                    }
                }
                
                showModal('Booking Error', errorMessage, '⚠️');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showModal('Network Error', 'Unable to submit booking. Please check your connection and try again.', '❌');
        }
    };

    // Handle reward selection and price calculation
    const redemptionSelect = document.getElementById('redemptionId');
    if (redemptionSelect && servicePrice) {
        redemptionSelect.addEventListener('change', function() {
            const priceBreakdown = document.getElementById('priceBreakdown');
            const breakdownDiscount = document.getElementById('breakdownDiscount');
            const breakdownFinal = document.getElementById('breakdownFinal');
            
            if (this.value) {
                const option = this.options[this.selectedIndex];
                const discountType = option.dataset.discountType;
                const discountValue = parseFloat(option.dataset.discountValue);
                
                let discount = 0;
                if (discountType === 'percentage') {
                    discount = (servicePrice * discountValue) / 100;
                } else if (discountType === 'fixed') {
                    discount = Math.min(discountValue, servicePrice);
                }
                
                const finalPrice = Math.max(0, servicePrice - discount);
                
                breakdownDiscount.textContent = '-₱' + discount.toFixed(2);
                breakdownFinal.textContent = '₱' + finalPrice.toFixed(2);
                priceBreakdown.style.display = 'block';
            } else {
                priceBreakdown.style.display = 'none';
            }
        });
    }
});


// Helper function to format time to 12-hour format
function formatTime12Hour(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}
