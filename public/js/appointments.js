function openRescheduleModal(appointmentId, serviceId, serviceName, staffId, currentDate, currentStart, currentEnd) {
    document.getElementById('rescheduleAppointmentId').value = appointmentId;
    document.getElementById('rescheduleServiceId').value = serviceId;
    document.getElementById('rescheduleStaffId').value = staffId;
    document.getElementById('rescheduleServiceName').textContent = `Service: ${serviceName}`;
    document.getElementById('rescheduleModal').style.display = 'flex';
    
    // Set up date change listener
    const dateInput = document.getElementById('rescheduleDate');
    dateInput.addEventListener('change', loadRescheduleTimeSlots);
    
    // Check for Sunday
    dateInput.addEventListener('input', function() {
        const selectedDate = new Date(this.value);
        if (selectedDate.getDay() === 0) {
            this.value = '';
            document.getElementById('rescheduleTimeSlots').innerHTML = '<p class="hint">We are closed on Sundays. Please select a different date.</p>';
        }
    });
}

function closeRescheduleModal() {
    document.getElementById('rescheduleModal').style.display = 'none';
    document.getElementById('rescheduleForm').reset();
    document.getElementById('rescheduleTimeSlots').innerHTML = '<p class="hint">Please select a date first</p>';
}

async function loadRescheduleTimeSlots() {
    const serviceId = document.getElementById('rescheduleServiceId').value;
    const staffId = document.getElementById('rescheduleStaffId').value;
    const date = document.getElementById('rescheduleDate').value;
    const timeSlotsContainer = document.getElementById('rescheduleTimeSlots');
    
    if (!date) {
        timeSlotsContainer.innerHTML = '<p class="hint">Please select a date first</p>';
        return;
    }
    
    if (!staffId) {
        timeSlotsContainer.innerHTML = '<p class="hint">Staff information missing</p>';
        return;
    }
    
    timeSlotsContainer.innerHTML = '<p class="hint">Loading available time slots...</p>';
    
    try {
        const response = await fetch(`/api/services/slots?serviceId=${serviceId}&staffId=${staffId}&date=${date}`);
        const data = await response.json();
        
        if (data.slots && data.slots.length > 0) {
            timeSlotsContainer.innerHTML = data.slots.map(slot => `
                <div class="time-slot" data-start="${slot.start}" data-end="${slot.end}">
                    ${slot.display}
                </div>
            `).join('');
            
            // Add click handlers
            document.querySelectorAll('#rescheduleTimeSlots .time-slot').forEach(slot => {
                slot.addEventListener('click', function() {
                    document.querySelectorAll('#rescheduleTimeSlots .time-slot').forEach(s => s.classList.remove('selected'));
                    this.classList.add('selected');
                    document.getElementById('rescheduleStartTime').value = this.dataset.start;
                    document.getElementById('rescheduleEndTime').value = this.dataset.end;
                });
            });
        } else {
            timeSlotsContainer.innerHTML = '<p class="hint">No available slots for this date</p>';
        }
    } catch (error) {
        console.error('Error loading slots:', error);
        timeSlotsContainer.innerHTML = '<p class="hint">Error loading time slots</p>';
    }
}

function showErrorModal(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').style.display = 'flex';
}

function closeErrorModal() {
    document.getElementById('errorModal').style.display = 'none';
}

// Handle reschedule form submission
document.addEventListener('DOMContentLoaded', function() {
    const rescheduleForm = document.getElementById('rescheduleForm');
    if (rescheduleForm) {
        rescheduleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const appointmentId = document.getElementById('rescheduleAppointmentId').value;
            const newDate = document.getElementById('rescheduleDate').value;
            const newStartTime = document.getElementById('rescheduleStartTime').value;
            const newEndTime = document.getElementById('rescheduleEndTime').value;
            
            if (!newDate || !newStartTime || !newEndTime) {
                showErrorModal('Please select a date and time slot.');
                return;
            }
            
            try {
                const response = await fetch(`/appointments/${appointmentId}/reschedule`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        newDate,
                        newStartTime,
                        newEndTime
                    })
                });
                
                if (response.ok) {
                    window.location.reload();
                } else {
                    const data = await response.json();
                    showErrorModal(data.error || 'Failed to reschedule appointment');
                }
            } catch (error) {
                console.error('Error:', error);
                showErrorModal('An error occurred while rescheduling. Please try again.');
            }
        });
    }
});

function cancelAppointment(appointmentId) {
    // Show confirmation modal
    const modal = document.getElementById('cancelModal');
    modal.style.display = 'flex';
    
    // Set up confirm button
    document.getElementById('confirmCancelBtn').onclick = function() {
        modal.style.display = 'none';
        performCancelAppointment(appointmentId);
    };
}

function closeCancelModal() {
    document.getElementById('cancelModal').style.display = 'none';
}

async function performCancelAppointment(appointmentId) {
    try {
        const response = await fetch(`/appointments/${appointmentId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            window.location.reload();
        } else {
            const data = await response.json();
            showErrorModal(data.error || 'Failed to cancel appointment');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorModal('An error occurred while cancelling. Please try again.');
    }
}

// Load notifications count
async function loadNotificationCount() {
    try {
        const response = await fetch('/api/notifications/unread-count');
        const data = await response.json();
        const badge = document.querySelector('.notification-badge');
        if (badge && data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadNotificationCount);
