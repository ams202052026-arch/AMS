# 🔍 Mode Switch Debug Guide

## Issue: Button Not Responding

If clicking "Switch to Business" button does nothing, follow these debugging steps:

## 🧪 Quick Tests

### 1. Open Browser Console (F12)
Check for JavaScript errors:
```
- Press F12
- Go to Console tab
- Look for red error messages
- Check if debug messages appear
```

### 2. Test Button Manually
In browser console, run:
```javascript
// Test if modal exists
document.getElementById('modeSwitchModal')

// Test if function exists
typeof showModeSwitchModal

// Manually trigger modal
document.getElementById('modeSwitchModal').style.display = 'flex'

// Test API
fetch('/api/mode-status').then(r => r.json()).then(console.log)
```

### 3. Check Network Tab
- Open Network tab in DevTools
- Click the button
- Look for `/api/mode-status` request
- Check if it returns 200 OK

## 🔧 Common Issues & Fixes

### Issue 1: JavaScript Not Loading
**Symptoms**: No console logs, button does nothing

**Fix**:
1. Check if scripts are loading:
   ```html
   <script src="/js/headerAndNavigation.js"></script>
   <script src="/js/debug-mode-switch.js"></script>
   ```

2. Verify files exist in `public/js/` folder

3. Hard refresh browser: `Ctrl + Shift + R`

### Issue 2: Modal Not Showing
**Symptoms**: Button clicks but modal doesn't appear

**Fix**:
1. Check modal CSS:
   ```css
   .modal-overlay {
       display: none; /* Should be flex when open */
       position: fixed;
       z-index: 1000;
   }
   ```

2. Manually test in console:
   ```javascript
   document.getElementById('modeSwitchModal').style.display = 'flex'
   ```

3. Check if modal HTML exists in page source

### Issue 3: API Not Responding
**Symptoms**: Modal opens but shows "Not Applied" always

**Fix**:
1. Test API directly: `http://localhost:3000/api/mode-status`

2. Check server logs for errors

3. Verify user is logged in:
   ```javascript
   // In console
   document.cookie
   ```

4. Check if route exists in `routes/auth.js`

### Issue 4: Function Not Defined
**Symptoms**: Console error "showModeSwitchModal is not defined"

**Fix**:
1. Check if function is in header partial
2. Verify script tags are in correct order
3. Check for JavaScript syntax errors

## 📋 Step-by-Step Debug Process

### Step 1: Verify Button Exists
```javascript
// In browser console
const btn = document.querySelector('.mode-switch-btn');
console.log('Button:', btn);
console.log('Button text:', btn?.textContent);
console.log('Button onclick:', btn?.onclick);
```

### Step 2: Test Modal
```javascript
// In browser console
const modal = document.getElementById('modeSwitchModal');
console.log('Modal:', modal);
console.log('Modal display:', modal?.style.display);

// Try to show it
if (modal) {
    modal.style.display = 'flex';
}
```

### Step 3: Test API
```javascript
// In browser console
fetch('/api/mode-status')
    .then(r => r.json())
    .then(data => {
        console.log('API Response:', data);
        console.log('Business Status:', data.businessStatus);
    })
    .catch(err => console.error('API Error:', err));
```

### Step 4: Test Function
```javascript
// In browser console
if (typeof showModeSwitchModal === 'function') {
    console.log('Function exists, calling it...');
    showModeSwitchModal();
} else {
    console.error('Function not found!');
}
```

## 🎯 Expected Behavior

When everything works correctly:

1. **Click Button**
   - Console: "🔍 Mode Switch Button Clicked!"
   - Modal appears with fade-in animation

2. **API Call**
   - Console: "🔍 Testing API call..."
   - Console: API Response data logged

3. **Modal Content**
   - Shows current business status
   - Shows appropriate action button
   - Button text matches status

4. **Button Action**
   - Clicking action button redirects to correct page

## 🔍 Debug Checklist

- [ ] Browser console shows no errors
- [ ] Button element exists in DOM
- [ ] Modal element exists in DOM
- [ ] showModeSwitchModal function is defined
- [ ] API endpoint `/api/mode-status` returns 200
- [ ] API returns valid JSON with businessStatus
- [ ] Modal CSS allows it to be visible
- [ ] No JavaScript conflicts
- [ ] Scripts load in correct order
- [ ] User is logged in (has session)

## 🚀 Quick Fix Commands

### Restart Server
```bash
# Stop current server (Ctrl+C)
node server.js
```

### Clear Browser Cache
```
Ctrl + Shift + Delete (Windows)
Cmd + Shift + Delete (Mac)
```

### Hard Refresh
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Test with Different Browser
- Try Chrome, Firefox, or Edge
- Test in Incognito/Private mode

## 📊 Debug Output Examples

### Successful Output:
```
🔍 Debug Mode Switch Script Loaded
🔍 DOM Content Loaded - Testing Mode Switch Button
Button found: true
Modal found: true
Button text: Switch to Business
✅ showModeSwitchModal function exists
✅ Close button found
```

### Failed Output:
```
🔍 Debug Mode Switch Script Loaded
🔍 DOM Content Loaded - Testing Mode Switch Button
❌ Mode Switch Button not found!
❌ Modal not found!
❌ showModeSwitchModal function not found!
```

## 🔗 Test URLs

1. **Home Page**: http://localhost:3000/home
2. **API Test**: http://localhost:3000/api/mode-status
3. **Login**: http://localhost:3000/login

## 💡 Tips

1. **Always check console first** - Most issues show errors there
2. **Test API separately** - Verify backend works before testing UI
3. **Use debug script** - The debug-mode-switch.js logs everything
4. **Test with test accounts** - Use accounts from test-business-mode-switch.js
5. **Check server logs** - Backend errors appear in terminal

## 🆘 Still Not Working?

If button still doesn't work after all checks:

1. **Copy exact error message** from console
2. **Check server terminal** for backend errors
3. **Verify database** has user and business data
4. **Test with fresh login** - Logout and login again
5. **Check session** - Verify session is working

---

**Remember**: The debug script (`debug-mode-switch.js`) logs everything to console. Always check console first!

**Test Account**: customer-approved@test.com / password123