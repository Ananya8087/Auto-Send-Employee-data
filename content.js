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

  // Function to fetch all caseIds from Google Sheets
  function fetchAllCaseIds(callback) {
    fetch('https://script.google.com/macros/s/AKfycbyTkJysE2o5dxmNNk18-7LUybw130On4MzghRThE7TUzTgkS0No2V5S2_491-3lrqZw/exec')
      .then(response => response.json())
      .then(allData => {
        console.log('Existing case IDs:', allData.caseIds);
        callback(allData.caseIds);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        callback([]);
      });
  }

  // Initialize data object
  let data = {};

  // Retrieve stored data from localStorage if available
  let storedData = localStorage.getItem('capturedData');
  if (storedData) {
    data = JSON.parse(storedData);
    console.log('Retrieved stored data:', data);
  }

  // Create QC Pass and QC Fail Buttons
  const mainSectionContainer = document.querySelector('.mainsection.d-md-flex');

  const qcPassButton = document.createElement('button');
  qcPassButton.style.position = "absolute";
  qcPassButton.textContent = 'QC Pass';
  qcPassButton.className = 'qcButton';
  qcPassButton.style.top = '45px';
  qcPassButton.style.right = '115px';
  qcPassButton.style.backgroundColor = "LawnGreen";
  mainSectionContainer.appendChild(qcPassButton);

  const qcFailButton = document.createElement('button');
  qcFailButton.style.position = "absolute";
  qcFailButton.textContent = 'QC Fail';
  qcFailButton.className = 'qcButton';
  qcFailButton.style.top = '45px';
  qcFailButton.style.right = '17px';
  qcFailButton.style.backgroundColor = "Red";
  mainSectionContainer.appendChild(qcFailButton);

  // Disable QC buttons initially
  qcPassButton.disabled = true;
  qcFailButton.disabled = true;

  // Debounce function implementation
  function debounce(func, delay) {
    let timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, arguments);
      }, delay);
    };
  }
  function monitorSubmitButtonState() {
    const submitButton = document.querySelector('.btn_header.submit_btn.qc_submit_btn.blue_btn');

    if (submitButton) {
      
      console.log("found");
      submitButton.addEventListener('click', () => {
        qcPassButton.disabled = !submitButton.disabled;
        qcFailButton.disabled = !submitButton.disabled;
      });

      // Check initial state
      qcPassButton.disabled = submitButton.disabled;
      qcFailButton.disabled = submitButton.disabled;
    }
  }

  // Monitor the Submit button state
  monitorSubmitButtonState();

  qcPassButton.addEventListener('click', () => {
    console.log('QC Pass button clicked');
    checkAndSendData('QC Pass');
  });

  // Add click listener to QC Fail button with debounce
  qcFailButton.addEventListener('click', () => {
    console.log('QC Fail button clicked');
    checkAndSendData('QC Fail');
  });

  // Function to check and send data to Google Sheets
  function checkAndSendData(claimStatus) {
    // Fetch existing caseIds and check for duplicates
    fetchAllCaseIds(existingCaseIds => {
      const currentCaseId = parseInt(data.caseId);
      const caseIds = Array.isArray(existingCaseIds) ? existingCaseIds : [];
      const exists = caseIds.length >= 1 && caseIds.includes(currentCaseId);

      if (exists) {
        console.log('Duplicate case ID found:', currentCaseId);
        console.log('Data not sent to Google Sheets.');
      } else {
        console.log('No duplicate found. Sending data to Google Sheets.');

        // Send data with claim status as QC Pass or QC Fail
        sendDataToGoogleSheet(data, claimStatus);
      }
    });
  }

  // Wait for the sidebar element
  waitForSidebarElement((sidebarElement) => {
    const claimedAmountElement = sidebarElement.querySelector('div:nth-child(2) > div > b');
    const claimedAmount = claimedAmountElement ? claimedAmountElement.innerText.trim() : 'N/A';

    // Capture the email
    const emailElement = document.querySelector('span.user_name_header');
    const email = emailElement ? emailElement.innerText.trim() : 'N/A';

    // Capture the Case ID
    const caseIdElement = document.querySelector('div[class=""] > button[class="unass_cases"] > div[class=""] > b[data-v-012f2b64=""]')
    const caseId = caseIdElement ? caseIdElement.innerText.trim() : 'N/A';
    console.log(caseIdElement);
    console.log(caseId);

    // Capture the caseType based on the presence of targetImageSrc (assumed to be defined)
    const targetImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAAAxdEVYdENyZWF0aW9uIFRpbWUAVHVlc2RheSAyNCBPY3RvYmVyIDIwMjMgMDE6MjY6MTUgUE1IQK2TAAAEG0lEQVRYhe2Yz08bRxTHv5usvWtjpwYM2GoUhV+KU5VKTqJECqRS6X9AEkLSQ8G5UtSeIoxURQk4p7YKyi3xkkOJ2iZnuDQ+JI7UtKkslYiKukVQhWIqbEd4sdc/WOdADTGzy84upuGQ721n9s1+9r0382aGKRaLRexh7XvTAFra84CsUcN0WsbTn9IIh1cxPZ1BLJbHWuG/QVkGLpcJR9/j0NFhw8lTVlRVGfMFozcH5+dyGB9P4uGPKeRydKYcx6DzYzsufVKNw4fNuwMoSTLu3I7jwf2XWFvT9Y0NsSyDc+cd8F2ugcVC51EqwNnZHIavxxD9I2uMbIuOHOEx6K9Hcwu3c8DnUxKG/P8gkTDoNhU5nSyuDbvR1sYbB5ydzeKLzxeQiFcWriSnk8VXX7+Lpmb1vFRNhExGxvD1pV2DA4Dl5QICI0tIp2XVd1SXmeCd+LY519rKwWYr/z9RlBGN6svTmRkJQjCO/s/qFPsVQzw/l0Pvp/MoFNQHHr11EF6vRbU/EslgcmIFkxMrmpAmM4OgcAiNjWSoFUM8/m1yWzgaeb0W+IcaINw9RHh6q/K5Ir67l1TsIyxFcQ2hUEoXjCjKiEQyiuFtbeXQfaFac4xQKIVUisx3AvDZLxlks/o2ONFoFgP9L+Dr/Rtn2qMIjCyV9Z/vdmiOIUlF/Posow0YDou64JQ0ObGCx482x9EKcUlPnqwSbYTl8ylpB2ibEkX1pUNNU79ReDBegXXP5TbhzIe2jefYYp7KLh4nZyaxDkqS/j93u1j4LtcCAFpazPAes5aFdXR0mWocSSJz3/B+8HW53Cb0+WoU+8aERFk+6hUByPOM4p8Y0UD/C0QiZF6piecZoo3Iwdpa/U6NLeYxJiQwJiTK2r3HrLrGcTrJbxMtbR9YsLBAl9QlLcYKEILxjedSuPt8NXj8SKSuz++3kaWT8GB7e5UuuK364ftk2awN3HBTr4OnT5PfJiyPn7Ao5gKtRFEuqyTrE6hW047nGRw/QeFBu30/OjvthgGB9Z3M6zO3+4Jj250PAHzUaceBA/u1AQGg51I1TGbjXgSAwMhSWTXxDzWohtpsZtBzUXlDoWjR2GhGV9c7OwIURRljwubE2S7UXWcdaGpS3varnknSaRkD/QuYmalMbVaTx8Phm5sHVb2rOr2s1n3wDzUork2VUn09iyuD6qEHNO5mmprNuDbs3hXIujoWX151oUXjbEx1cP/rzyxuBP6tWLg9Hg5XBhs04agBgfVjqBBM4MH9lygUjNVqk4nB2XMO9PbVUF8m6b48mpvL4d54EqGHKeqjAc+vXx71XKxWPLlVFLCk1VUZPz9NIxwW8ft0FrFYfsOzLMvA7TbBc5RDe4cNp05aUUVZ7ioG+H9pz9+wvgXcqfY84Ctvoo39/B4rCgAAAABJRU5ErkJggg==';
    const caseTypeElement = document.querySelector(`img[src="${targetImageSrc}"]`);
    const caseType = caseTypeElement ? 'RI' : 'PA';

    // Create the data object
    data = {
      caseType: caseType,
      email: email || 'N/A',
      caseId: caseId || 'N/A',
      cashDiscount: 'N/A',
      claimedAmount: claimedAmount || 'N/A', // Placeholder for claimedAmount
      detailAmount: 'N/A'   // Placeholder for detailAmount
    };

    // Log the captured data to the console
    console.log('Captured initial data:', data);

    // Function to update cashDiscount when the Update button is clicked
    function updateCashDiscount() {
      const cashDiscountElement = sidebarElement.querySelector('.p-field.p-col input[type="text"][placeholder="enter amount"]');
      const cashDiscountValue = cashDiscountElement ? cashDiscountElement.value.trim() : 'N/A';
      data.cashDiscount = cashDiscountValue; // Update data object with new cashDiscount value
      console.log('Updated cashDiscount:', cashDiscountValue);
      console.log(data);
    }

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

      // Store data in localStorage
      localStorage.setItem('capturedData', JSON.stringify(data));
      console.log('Data stored locally:', data);
    });

    // Select the Update button
    const updateButton = sidebarElement.querySelector('.btn_header.reject_btn.patient_update_btn');

    // Add click listener to Update button
    updateButton.addEventListener('click', () => {
      console.log('Update button clicked');
      updateCashDiscount(); // Update cashDiscount when the button is clicked

      // Update localStorage on button click
      localStorage.setItem('capturedData', JSON.stringify(data));
      console.log('Data stored locally:', data);
    });

    // Function to monitor the Submit button state


    // Debounce function for checkAndSendData to prevent multiple submissions
    const debouncedCheckAndSendData = debounce((claimStatus) => {
      console.log('Debounced sending data to Google Sheets');
      checkAndSendData(claimStatus);
    }, 6000); // 1000 milliseconds debounce delay (1 second)

    // Add click listener to QC Pass button with debounce
    qcPassButton.addEventListener('click', () => {
      console.log('QC Pass button clicked');
      debouncedCheckAndSendData('QC Pass');
    });

    // Add click listener to QC Fail button with debounce
    qcFailButton.addEventListener('click', () => {
      console.log('QC Fail button clicked');
      debouncedCheckAndSendData('QC Fail');
    });
  });
});
