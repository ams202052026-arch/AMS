// Convert 24-hour time to 12-hour format with AM/PM
exports.formatTime12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
};

// Format time slot object
exports.formatTimeSlot = (timeSlot) => {
    if (!timeSlot || !timeSlot.start || !timeSlot.end) return '';
    return `${exports.formatTime12Hour(timeSlot.start)} - ${exports.formatTime12Hour(timeSlot.end)}`;
};
