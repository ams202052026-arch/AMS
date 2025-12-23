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
        
        // Check if business is open on this day
        await checkBusinessHours(selectedDate);
    });
    
    staffSelect.addEventListener('change', loadTimeSlots);

    staffSelect.addEventListener('change', loadTimeSlots);

    // Check if business is open on selected date
    async function checkBusinessHours(date) {
        try {
            const selectedDate = new Date(date);
            const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
            
            // Get business ID from service
            const response = await fetch(`/api/services/${serviceId}`);
            const serviceData = await response.json();
            const businessId = serviceData.service.businessId;
            
            // Check business availability for this date
            const availResponse = await fetch(`/api/services/business-availability?businessId=${businessId}&date=${date}`);
            const availData = await availResponse.json();
            
            // Show message below date input
            const dateGroup = dateInput.closest('.form-group');
            let messageDiv = dateGroup.querySelector('.date-message');
            
            if (!messageDiv) {
                messageDiv = document.createElement('div');
                messageDiv.className = 'date-message';
                const hint = dateGroup.querySelector('.hint');
                if (hint) {
                    hint.parentNode.insertBefore(messageDiv, hint.nextSibling);
                } else {
                    dateGroup.appendChild(messageDiv);
                }
            }
            
            if (!availData.available) {
                messageDiv.innerHTML = `<span class="error-text">⚠️ ${availData.reason || 'Business is closed on ' + dayName + 's'}</span>`;
                messageDiv.style.display = 'block';
                timeSlotsContainer.innerHTML = `<p class="hint">${availData.reason || 'Business is closed on this day'}</p>`;
                startTimeInput.value = '';
                endTimeInput.value = '';
            } else {
                messageDiv.style.display = 'none';
                // Load time slots if staff is selected
                if (staffSelect.value) {
                    loadTimeSlots();
                }
            }
        } catch (error) {
            console.error('Error checking business hours:', error);
            // Continue to load time slots even if check fails
            if (staffSelect.value) {
                loadTimeSlots();
            }
        }
    }

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
            timeSlotsContainer.innerHTML = '<p class="hint">Please select a date</p>';
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
                const staffName = staffId ? 'this staff member' : 'any staff';
                timeSlotsContainer.innerHTML = `<p class="hint">No available slots for ${staffName} on this date</p>`;
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
        modalIcon.textContent = icon;
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

            if (response.ok) {
                // Success - redirect to appointments page
                window.location.href = '/appointments';
            } else {
                // Error - show modal with error message
                const contentType = response.headers.get('content-type');
                let errorMessage = 'An error occurred while booking. Please try again.';
                
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    errorMessage = data.error || data.message || errorMessage;
                } else {
                    const text = await response.text();
                    // Try to extract error message from HTML
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    errorMessage = doc.querySelector('.error-message, p')?.textContent || errorMessage;
                }
                
                showModal('Booking Conflict', errorMessage, '⚠️');
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
