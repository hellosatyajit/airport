export const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Airport Search</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 0 20px;
    }
    input {
      padding: 10px;
      width: 300px;
      font-size: 16px;
    }
    .loading {
      color: #555;
    }
    .response {
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <h1>Search App</h1>
  <input 
    type="text" 
    id="searchInput" 
    placeholder="Type to search..."
  />
  <p id="loading" class="loading" style="display: none;">Loading...</p>
  <div id="response" class="response"></div>

  <script>
    const input = document.getElementById('searchInput');
    const loading = document.getElementById('loading');
    const responseDiv = document.getElementById('response');

    let debounceTimeout;

    input.addEventListener('input', (event) => {
      const value = event.target.value.trim();

      clearTimeout(debounceTimeout);

      debounceTimeout = setTimeout(async () => {
        if (value === '') {
          responseDiv.innerHTML = '';
          loading.style.display = 'none';
          return;
        }

        loading.style.display = 'block';
        responseDiv.innerHTML = '';

        try {
          const response = await fetch(
            \`/search?q=\${encodeURIComponent(value)}\`
          );

          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const data = await response.json();

          if (data.error) {
            responseDiv.innerHTML = \`<p>Error: \${data.error}</p>\`;
          } else {
            const results = data.data.map(
              airport => \`<p>\${airport.ident} - \${airport.iata_code || 'N/A'} - \${airport.name} - \${airport.municipality}, \${airport.iso_country}</p>\`
            ).join('');
            responseDiv.innerHTML = results;
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          responseDiv.innerHTML = '<p>Error fetching data.</p>';
        } finally {
          loading.style.display = 'none';
        }
      }, 300);
    });
  </script>
</body>
</html>
`;
