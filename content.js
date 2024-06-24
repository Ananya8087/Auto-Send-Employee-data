console.log('Content script is running');

// Define data outside the window load event listener scope
let data = {};

window.addEventListener('load', () => {
  console.log('Window loaded, capturing initial data');

  // Function to wait until the sidebar is loaded
  function waitForSidebarElement(callback) {
    const checkInterval = setInterval(() => {
      const sidebarElement = document.querySelector('.p-sidebar.p-component.p-sidebar-right.p-sidebar-active');
      if (sidebarElement) {
        clearInterval(checkInterval);
        callback(sidebarElement);
      }
    }, 500); // Check every 500ms
  }

  // Function to send data to Google Sheets with claim status
  function sendDataToGoogleSheet(data, claimStatus) {
    data.claim_status = claimStatus; // Update claim status in data object
    fetch('https://script.google.com/macros/s/AKfycbyTkJysE2o5dxmNNk18-7LUybw130On4MzghRThE7TUzTgkS0No2V5S2_491-3lrqZw/exec', {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
      console.log('Data sent successfully:', result);
      // Handle success if needed
    })
    .catch(error => {
      console.error('Error sending data:', error);
      // Handle error if needed
    });
  }

  // Wait for the sidebar element
  waitForSidebarElement((sidebarElement) => {
    // Capture Claimed Amount from the sidebar
    const claimedAmountElement = sidebarElement.querySelector('div:nth-child(2) > div > b');
    const claimedAmount = claimedAmountElement ? claimedAmountElement.innerText.trim() : 'N/A';

    // Initialize cashDiscount with default value
    let cashDiscount = 'N/A';

    // Capture the email
    const emailElement = document.querySelector('span.user_name_header');
    const email = emailElement ? emailElement.innerText.trim() : 'N/A';

    // Capture the Case ID
    const caseIdElement = document.querySelector('div[data-v-7c7aad76] b[data-v-7c7aad76]');
    const caseId = caseIdElement ? caseIdElement.innerText.trim() : 'N/A';

    // Capture the caseType based on the presence of targetImageSrc (assumed to be defined)
    const targetImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAAAxdEVYdENyZWF0aW9uIFRpbWUAVHVlc2RheSAyNCBPY3RvYmVyIDIwMjMgMDE6MjY6MTUgUE1IQK2TAAAEG0lEQVRYhe2Yz08bRxTHv5usvWtjpwYM2GoUhV+KU5VKTqJECqRS6X9AEkLSQ8G5UtSeIoxURQk4p7YKyi3xkkOJ2iZnuDQ+JI7UtKkslYiKukVQhWIqbEd4sdc/WOdADTGzy84upuGQ721n9s1+9r0382aGKRaLRexh7XvTAFra84CsUcN0WsbTn9IIh1cxPZ1BLJbHWuG/QVkGLpcJR9/j0NFhw8lTVlRVGfMFozcH5+dyGB9P4uGPKeRydKYcx6DzYzsufVKNw4fNuwMoSTLu3I7jwf2XWFvT9Y0NsSyDc+cd8F2ugcVC51EqwNnZHIavxxD9I2uMbIuOHOEx6K9Hcwu3c8DnUxKG/P8gkTDoNhU5nSyuDbvR1sYbB5ydzeKLzxeQiFcWriSnk8VXX7+Lpmb1vFRNhExGxvD1pV2DA4Dl5QICI0tIp2XVd1SXmeCd+LY519rKwWYr/z9RlBGN6svTmRkJQjCO/s/qFPsVQzw/l0Pvp/MoFNQHHr11EF6vRbU/EslgcmIFkxMrmpAmM4OgcAiNjWSoFUM8/m1yWzgaeb0W+IcaINw9RHh6q/K5Ir67l1TsIyxFcQ2hUEoXjCjKiEQyiuFtbeXQfaFac4xQKIVUisx3AvDZLxlks/o2ONFoFgP9L+Dr/Rtn2qMIjCyV9Z/vdmiOIUlF/Posow0YDou64JQ0ObGCx482x9EKcUlPnqwSbYTl8ylpB2ibEkX1pUNNU79ReDBegXXP5TbhzIe2jefYYp7KLh4nZyaxDkqS/j93u1j4LtcCAFpazPAes5aFdXR0mWocSSJz3/B+8HW53Cb0+WoU+8aERFk+6hUByPOM4p8Y0UD/C0QiZF6piecZoo3Iwdpa/U6NLeYxJiQwJiTK2r3HrLrGcTrJbxMtbR9YsLBAl9QlLcYKEILxjedSuPt8NXj8SKSuz++3kaWT8GB7e5UuuK364ftk2awN3HBTr4OnT5PfJiyPn7Ao5gKtRFEuqyTrE6hW047nGRw/QeFBu30/OjvthgGB9Z3M6zO3+4Jj250PAHzUaceBA/u1AQGg51I1TGbjXgSAwMhSWTXxDzWohtpsZtBzUXlDoWjR2GhGV9c7OwIURRljwubE2S7UXWcdaGpS3varnknSaRkD/QuYmalMbVaTx8Phm5sHVb2rOr2s1n3wDzUork2VUn09iyuD6qEHNO5mmprNuDbs3hXIujoWX151oUXjbEx1cP/rzyxuBP6tWLg9Hg5XBhs04agBgfVjqBBM4MH9lygUjNVqk4nB2XMO9PbVUF8m6b48mpvL4d54EqGHKeqjAc+vXx71XKxWPLlVFLCk1VUZPz9NIxwW8ft0FrFYfsOzLMvA7TbBc5RDe4cNp05aUUVZ7ioG+H9pz9+wvgXcqfY84Ctvoo39/B4rCgAAAABJRU5ErkJggg==';
    const caseTypeElement = document.querySelector(`img[src="${targetImageSrc}"]`);
    const caseType = caseTypeElement ? 'RI' : 'PA';

    // Create the data object
    data = {
      caseType: caseType,
      email: email || 'N/A',
      caseId: caseId || 'N/A',
      cashDiscount: cashDiscount || '0',
      claimedAmount: claimedAmount || 'N/A',
      detailAmount: 'N/A'  // Placeholder for detailAmount
    };

    // Log the captured data to the console
    console.log('Captured initial data:', data);

    // Function to fetch all caseIds from Google Sheets
    function fetchAllCaseIds(callback) {
      fetch('https://script.google.com/macros/s/AKfycbyTkJysE2o5dxmNNk18-7LUybw130On4MzghRThE7TUzTgkS0No2V5S2_491-3lrqZw/exec')
        .then(response => response.json())
        .then(allData => {
          console.log('Existing case IDs:', allData.caseIds);

          // Convert data.caseId to integer (assuming it's always a single value)
          const currentCaseId = parseInt(data.caseId);

          // Check if the current caseId exists in the fetched caseIds
          const caseIds = Array.isArray(allData.caseIds) ? allData.caseIds : [];
          const exists = caseIds.length >= 1 && caseIds.includes(currentCaseId);

          if (exists) {
            console.log('Duplicate case ID found:', currentCaseId);
          } else {
            console.log('No duplicate found. Ready to submit.');
          }

          callback(allData.caseIds);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
          callback([]);
        });
    }

    // Function to update cashDiscount when the Update button is clicked
    function updateCashDiscount() {
      const cashDiscountElement = sidebarElement.querySelector('.p-field.p-col input[type="text"][placeholder="enter amount"]');
      const cashDiscountValue = cashDiscountElement ? cashDiscountElement.value.trim() : 'N/A';
      data.cashDiscount = cashDiscountValue; // Update data object with new cashDiscount value
      console.log('Updated cashDiscount:', cashDiscountValue);
      console.log(data);
    }

    // Fetch and log existing caseIds immediately after loading the window
    fetchAllCaseIds(existingCaseIds => {
      // No need to log "No duplicate found. Ready to submit." again here
    });

    // Add input event listener to cashDiscountElement
    const cashDiscountElement = sidebarElement.querySelector('.p-field.p-col input[type="text"][placeholder="enter amount"]');
    cashDiscountElement.addEventListener('input', updateCashDiscount);

    // Function to find the element and extract its inner text with a delay
    function extractDetailAmountWithDelay(callback) {
      // Find the element
      var detailAmountElement = document.querySelector('p.detail_amnt_data b');
      console.log(detailAmountElement);
      
      // Check if the element exists
      if (detailAmountElement) {
          // Set a delay before extracting the inner text
          setTimeout(function() {
              // Extract the inner text after the delay
              var detailAmountValue = detailAmountElement.textContent.trim();
              console.log('Detail Amount:', detailAmountValue);
              callback(detailAmountValue);
          }, 2000); // 2000 milliseconds delay (2 seconds)
      } else {
          console.log('Detail Amount element not found.');
          callback('N/A');
      }
    }

    // Call the function and update the data object with detailAmount
    extractDetailAmountWithDelay(function(detailAmountValue) {
      data.detailAmount = detailAmountValue || 'N/A';
      console.log('Final Data after detailAmount update:', data);
    });

    // Select the Update button
    const updateButton = document.querySelector('.btn_header.reject_btn.patient_update_btn');

    // Add click listener to Update button
    updateButton.addEventListener('click', () => {
      console.log('Update button clicked');
      updateCashDiscount(); // Update cashDiscount when the button is clicked
    });

    // Select the Save Draft button and <span class="pi pi-plus-circle p-button-icon"></span> button
    const saveDraftButton = document.querySelector('.qcButtons .qc_reject_btn'); // Adjust selector as per your HTML structure
    const failButton = document.querySelector('span.pi.pi-plus-circle.p-button-icon'); // Adjust selector as per your HTML structure

    // Add click listener to save draft button
    saveDraftButton.addEventListener('click', () => {
      console.log('Save Draft button clicked');
      sendDataToGoogleSheet(data, 'QC Pass'); // Send data with claim status as "QC Pass"
    });

    // Add click listener to fail button
    failButton.addEventListener('click', () => {
      console.log('Fail button clicked');
      sendDataToGoogleSheet(data, 'QC Fail'); // Send data with claim status as "QC Fail"
    });
  });
});
