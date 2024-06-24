// background.js

console.log('Background script is running');

chrome.runtime.onInstalled.addListener(() => {
  console.log("Enhanced Activity Tracker Extension installed.");
  chrome.storage.local.set({ activityData: {} });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background script:', message);
  
  if (message.type === "captureData") {
    console.log('Data to be captured:', message.data);

    
    sendToGoogleSheets(message.data); // Send data to Google Sheets
    console.log("sending",message.data);
    // Respond to sender
    sendResponse({ status: "Data received successfully" });
  }
});

function sendToGoogleSheets(data) {
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbypYX1ZzWxebYOQQM5V4DgUz-xdC4bsfl71U1yNHRMk2JeGyNgaiMC3CJhQW27tUcrJ/exec'; // Replace with your actual web app URL
  
  console.log('Sending data to Google Sheets:', data);
  
  fetch(scriptUrl, {
    method: 'POST',
    mode: 'no-cors', // Ensure CORS mode
    credentials: 'omit', // Omit credentials
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(result => {
    console.log('Data sent to Google Sheets:', result);
  })
  .catch(error => {
    console.error('Error sending data to Google Sheets:', error);
  });
}
