// Reusable confirmation modal for admin actions

function showConfirmModal(title, message, confirmText, confirmClass, onConfirm) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').innerHTML = message;
    document.getElementById('confirmBtn').textContent = confirmText;
    document.getElementById('confirmBtn').className = `btn-sm ${confirmClass}`;
    
    modal.style.display = 'flex';
    
    // Set up confirm button
    document.getElementById('confirmBtn').onclick = function() {
        modal.style.display = 'none';
        onConfirm();
    };
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'none';
}

// Helper function to submit form bypassing event listeners
function submitFormDirectly(form) {
    const tempForm = document.createElement('form');
    tempForm.method = form.method;
    tempForm.action = form.action;
    
    // Copy all inputs
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        const newInput = document.createElement('input');
        newInput.type = 'hidden';
        newInput.name = input.name;
        newInput.value = input.value;
        tempForm.appendChild(newInput);
    });
    
    document.body.appendChild(tempForm);
    tempForm.submit();
}

// Intercept form submissions for confirmation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin confirmations loaded');
    
    // Approve confirmation
    const approveForms = document.querySelectorAll('form[action*="/approve"]');
    console.log('Found', approveForms.length, 'approve forms');
    approveForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Approve form intercepted');
            showConfirmModal(
                '✅ Approve Appointment',
                'Sigurado ka bang gusto mong aprubahan ang appointment na ito?<br><br>Makakatanggap ng notification ang customer.',
                'Oo, Aprubahan',
                'btn-success',
                () => submitFormDirectly(form)
            );
        });
    });
    
    // Complete confirmation
    const completeForms = document.querySelectorAll('form[action*="/complete"]');
    console.log('Found', completeForms.length, 'complete forms');
    completeForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Complete form intercepted');
            showConfirmModal(
                '🎉 Complete Appointment',
                'Sigurado ka bang tapos na ang serbisyo?<br><br>Makakatanggap ng points ang customer at hindi na ito mababago.',
                'Oo, Tapos Na',
                'btn-success',
                () => submitFormDirectly(form)
            );
        });
    });
    
    // Cancel confirmation
    const cancelForms = document.querySelectorAll('form[action*="/cancel"]:not([action*="reschedule"])');
    console.log('Found', cancelForms.length, 'cancel forms');
    cancelForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Cancel form intercepted');
            showConfirmModal(
                '❌ Cancel Appointment',
                'Sigurado ka bang gusto mong kanselahin ang appointment na ito?<br><br>Makakatanggap ng notification ang customer.',
                'Oo, Kanselahin',
                'btn-danger',
                () => submitFormDirectly(form)
            );
        });
    });
});
