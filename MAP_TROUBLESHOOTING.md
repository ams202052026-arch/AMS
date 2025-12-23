# 🗺️ Map Troubleshooting Guide

## Problem: Map Not Showing

### Quick Diagnostics

1. **Test Map Page**
   - Visit: `http://localhost:3000/test-map`
   - This page will show detailed diagnostics
   - Check the debug log for specific errors

2. **Browser Console**
   - Open Developer Tools (F12)
   - Check Console tab for JavaScript errors
   - Look for Google Maps API errors

### Common Issues and Solutions

#### Issue 1: Google Maps API Key Invalid
**Symptoms:**
- Map container is gray/blank
- Console error: "Google Maps API error: InvalidKeyMapError"

**Solution:**
1. Get a valid API key from: https://console.cloud.google.com/apis/credentials
2. Update `.env` file:
   ```
   GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```
3. Restart the server
4. Enable required APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API

#### Issue 2: API Key Restrictions
**Symptoms:**
- Console error: "This API key is not authorized to use this service"

**Solution:**
1. Go to Google Cloud Console
2. Edit your API key
3. Under "API restrictions", select:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Under "Website restrictions", add:
   - `localhost:3000`
   - Your production domain

#### Issue 3: Callback Function Not Defined
**Symptoms:**
- Console error: "initMap is not a function"

**Solution:**
- The callback function must be defined BEFORE the API script loads
- Check that `initMap()` function exists in the page
- Verify the callback parameter matches: `callback=initMap`

#### Issue 4: Map Container Has No Height
**Symptoms:**
- Map appears but is very small or invisible

**Solution:**
- Ensure map container has explicit height:
  ```css
  #map {
      height: 300px;
      width: 100%;
  }
  ```

#### Issue 5: CORS or Mixed Content Errors
**Symptoms:**
- Console error about CORS or mixed content

**Solution:**
- Use HTTPS in production
- For development, ensure all resources use same protocol
- Check that API key allows localhost

#### Issue 6: JavaScript Errors Before Map Loads
**Symptoms:**
- Other JavaScript errors prevent map initialization

**Solution:**
- Check console for errors before map loads
- Fix any syntax errors in the page
- Ensure jQuery or other dependencies load first

### Testing Steps

1. **Basic API Test**
   ```javascript
   // Open browser console and run:
   console.log(typeof google);
   // Should output: "object"
   
   console.log(google.maps.version);
   // Should output version number like "3.55"
   ```

2. **Map Element Test**
   ```javascript
   // Check if map element exists:
   console.log(document.getElementById('map'));
   // Should output the div element
   
   // Check dimensions:
   const mapEl = document.getElementById('map');
   console.log(mapEl.offsetWidth, mapEl.offsetHeight);
   // Should output non-zero numbers
   ```

3. **Manual Map Creation**
   ```javascript
   // Try creating map manually in console:
   const testMap = new google.maps.Map(document.getElementById('map'), {
       zoom: 10,
       center: { lat: 14.5995, lng: 120.9842 }
   });
   // Should create a map
   ```

### Environment Setup

1. **Check .env File**
   ```bash
   # Verify these variables exist:
   GOOGLE_MAPS_API_KEY=your_key_here
   NODE_ENV=development
   ```

2. **Restart Server**
   ```bash
   # Stop server (Ctrl+C)
   # Start again:
   npm start
   # or
   node server.js
   ```

3. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear cache in browser settings

### API Key Setup Guide

1. **Create Google Cloud Project**
   - Go to: https://console.cloud.google.com/
   - Create new project or select existing

2. **Enable APIs**
   - Go to "APIs & Services" > "Library"
   - Enable:
     - Maps JavaScript API
     - Places API
     - Geocoding API

3. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the key

4. **Restrict API Key (Recommended)**
   - Click on the API key to edit
   - Under "Application restrictions":
     - Select "HTTP referrers"
     - Add: `localhost:3000/*` and your domain
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose the 3 APIs above
   - Save

5. **Add to .env**
   ```
   GOOGLE_MAPS_API_KEY=AIza...your_key_here
   ```

### Debugging Tools

1. **Test Map Page**
   - URL: `http://localhost:3000/test-map`
   - Shows real-time diagnostics
   - Tests all map features

2. **Browser DevTools**
   - Network tab: Check if API script loads
   - Console tab: Check for errors
   - Elements tab: Inspect map container

3. **Google Maps API Checker**
   - Visit: https://developers.google.com/maps/documentation/javascript/error-messages
   - Look up specific error codes

### Still Not Working?

1. **Check API Quota**
   - Go to Google Cloud Console
   - Check if you've exceeded free tier limits
   - Enable billing if needed

2. **Try Different Browser**
   - Test in Chrome, Firefox, Edge
   - Disable browser extensions
   - Try incognito/private mode

3. **Check Network**
   - Ensure internet connection works
   - Check if firewall blocks Google APIs
   - Try different network

4. **Verify Server**
   - Check server logs for errors
   - Ensure server is running on correct port
   - Test other pages work

### Alternative: Use Free API Key (Temporary)

The code includes a fallback API key for testing:
```javascript
key=<%= process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw' %>
```

This fallback key has limitations:
- May have usage limits
- May stop working anytime
- Not suitable for production

**Always use your own API key for production!**

### Success Indicators

When map is working correctly, you should see:
- ✅ Interactive map with zoom controls
- ✅ Marker that can be dragged
- ✅ Click on map to set location
- ✅ Search address button works
- ✅ Get current location button works
- ✅ No errors in console

### Contact Support

If still having issues:
1. Check browser console for specific error
2. Visit test page: `/test-map`
3. Copy debug log
4. Report issue with:
   - Browser and version
   - Error messages
   - Debug log output
   - Steps to reproduce

---

**Last Updated:** December 22, 2024