 //   Function to get Location. Returns a promise that resolves into {lat, long}
      function getLocation() {
        // Create a new promise
        let locationPromise = new Promise((resolve, reject) => {
          // Access the current position of the user:
          navigator.geolocation.getCurrentPosition((pos) => {
            // Grab the lat and long
            let long = pos.coords.longitude;
            let lat = pos.coords.latitude;
            // If you can get those values: resolve with an object or reject if not
            resolve({ lat, long });
          }, reject);
        });
        //   return the promise
        return locationPromise;
      }


// Write your code here:

// Get our locations using pos.coords, returns lat, long
function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition((pos) => {
      let long = pos.coords.longitude;
      let lat = pos.coords.latitude;
      resolve({ lat, long });
    }, reject);
  });
}

$(document).ready(function () {

  // Once our page is open, load in the logs
  loadLogs();

  // On submission, get our form data, location, weather etc, ensure not default. 
  $("#tripForm").on("submit", async function (event) {
    event.preventDefault();

    // Get form data
    let formData = new FormData(event.target);
    let date = formData.get("tripDate");
    let notes = formData.get("notes");

    // Get user location
    let coords;
    try {
      coords = await getLocation();
    } catch (err) {
      alert("Location is required. Please allow location access.");
      return;
    }

    let lat = coords.lat;
    let long = coords.long;

    // Build API URL (use current_weather=true which Open-Meteo expects)
    let huntURL = "https://api.open-meteo.com/v1/forecast?latitude=" +
      lat + "&longitude=" + long +
      "&daily=sunrise,sunset&current_weather=true&timezone=auto&forecast_days=1&temperature_unit=fahrenheit";

    // Fetch weather info, if fetch throws an error, then display error and tell user to try again later.
    let response;
    try {
      response = await axios.get(huntURL);
    } catch (err) {
      alert("Weather fetch failed. Try again later.");
      return;
    }
    let weather = response.data;

    // Pull weather and fields from our API response
    let sunrise = (weather && weather.daily && weather.daily.sunrise && weather.daily.sunrise[0]) ? weather.daily.sunrise[0] : null;
    let sunset = (weather && weather.daily && weather.daily.sunset && weather.daily.sunset[0]) ? weather.daily.sunset[0] : null;

    // Get current temp in location from OpenMetro
    let temp = null;
    if (weather && weather.current_weather && typeof weather.current_weather.temperature !== "undefined") {
      temp = weather.current_weather.temperature;
    } else {
      // fallback: try hourly.temperature_2m[0] if present (still student-y)
      if (weather && weather.hourly && weather.hourly.temperature_2m && weather.hourly.temperature_2m.length > 0) {
        temp = weather.hourly.temperature_2m[0];
      }
    }

    // Make the template for our logs
    let logEntry = {
      latitude: lat,
      longitude: long,
      date: date,
      sunriseTime: sunrise,
      sunsetTime: sunset,
      notes: notes,
      temperature: temp
    };

    // Save our logs to localStorage
    let logs = localStorage.getItem("huntingLogs");
    if (logs) {
      logs = JSON.parse(logs);
      logs.push(logEntry);
    } else {
      logs = [logEntry];
    }
    localStorage.setItem("huntingLogs", JSON.stringify(logs));

    // reload UI
    loadLogs();

    // clear our submission form
    event.target.reset();
  });



  // Our log loading function
  function loadLogs() {
    let logContainer = $("#logContainer");

    let logs = localStorage.getItem("huntingLogs");

    if (!logs) {
      logContainer.html("<p>No logs saved yet.</p>");
      return;
    }

    logs = JSON.parse(logs);

    if (logs.length === 0) {
      logContainer.html("<p>No logs saved yet.</p>");
      return;
    }

    // Build our base html for the logs output
    let html = "";
    for (let i = 0; i < logs.length; i++) {
      let log = logs[i];
      // show "N/A" if temp missing
      let tempDisplay = (log.temperature === null || typeof log.temperature === "undefined") ? "N/A" : log.temperature + "°F";
      html += `
        <div class="log-item">
          <p><strong>Date:</strong> ${log.date}</p>
          <p><strong>Coordinates:</strong> ${log.latitude}, ${log.longitude}</p>
          <p><strong>Sunrise:</strong> ${log.sunriseTime || "N/A"}</p>
          <p><strong>Sunset:</strong> ${log.sunsetTime || "N/A"}</p>
          <p><strong>Temperature:</strong> ${tempDisplay}</p>
          <p><strong>Notes:</strong> ${log.notes}</p>
          <hr>
        </div>
      `;
    }

    logContainer.html(html);
  }

});
