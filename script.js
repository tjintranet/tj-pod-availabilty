let booksData = [];

document.getElementById('search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const isbn = document.getElementById('isbn').value;
    if (isValidISBN13(isbn)) {
        searchISBN(isbn);
    } else {
        showInvalidISBNFeedback();
    }
});

document.getElementById('isbn').addEventListener('input', function(e) {
    const isbn = e.target.value.replace(/[-\s]/g, '');
    const isValid = isValidISBN13(isbn);
    e.target.classList.toggle('is-valid', isValid);
    e.target.classList.toggle('is-invalid', !isValid);
    document.getElementById('isbn-feedback').style.display = isValid ? 'none' : 'block';
    document.getElementById('search-button').disabled = !isValid;
});

document.getElementById('isbn').addEventListener('click', function(e) {
    e.target.select();
});

document.getElementById('clear-button').addEventListener('click', function() {
    const isbnInput = document.getElementById('isbn');
    isbnInput.value = '';
    isbnInput.classList.remove('is-valid', 'is-invalid');
    document.getElementById('isbn-feedback').style.display = 'none';
    document.getElementById('search-button').disabled = true;
    document.getElementById('result').innerHTML = '';
});

document.getElementById('bulk-search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('csv-file');
    const file = fileInput.files[0];
    if (file) {
        processCSV(file);
    }
});

async function fetchData() {
    try {
        const response = await fetch('data.json');
        booksData = await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function searchISBN(isbn) {
    const result = booksData.find(book => book.code === isbn);
    
    let resultHTML = '';
    if (result) {
        resultHTML = `
            <div class="alert result-success">
                <p><strong>ISBN:</strong> ${result.code}</p>
                <p><strong>Description:</strong> ${result.description}</p>
                <p><strong>Setup Date:</strong> ${result.setupdate}</p>
            </div>
        `;
    } else {
        resultHTML = '<div class="alert result-warning">Item not available for POD</div>';
    }
    
    document.getElementById('result').innerHTML = resultHTML;
}

function isValidISBN13(isbn) {
    isbn = isbn.replace(/[-\s]/g, '');
    
    if (isbn.length !== 13 || !/^\d{13}$/.test(isbn)) {
        return false;
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += (i % 2 === 0) ? parseInt(isbn[i]) : parseInt(isbn[i]) * 3;
    }
    
    let checksum = (10 - (sum % 10)) % 10;
    return isbn[12] === checksum.toString();
}

function showInvalidISBNFeedback() {
    document.getElementById('isbn').classList.add('is-invalid');
    document.getElementById('isbn-feedback').style.display = 'block';
}

function processCSV(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const isbns = content.split(/\r\n|\n/).filter(isbn => isbn.trim() !== '');
        processBulkISBNs(isbns);
    };
    reader.readAsText(file);
}

function processBulkISBNs(isbns) {
    let resultHTML = '<table class="table"><thead><tr><th>ISBN</th><th>Status</th></tr></thead><tbody>';
    
    isbns.forEach(isbn => {
        isbn = isbn.replace(/[-\s]/g, '');
        if (isValidISBN13(isbn)) {
            const result = booksData.find(book => book.code === isbn);
            const status = result ? 'Available for POD' : 'Not available for POD';
            const statusClass = result ? 'text-success' : 'text-danger';
            resultHTML += `<tr><td>${isbn}</td><td class="${statusClass}">${status}</td></tr>`;
        } else {
            resultHTML += `<tr><td>${isbn}</td><td class="text-warning">Invalid ISBN</td></tr>`;
        }
    });
    
    resultHTML += '</tbody></table>';
    document.getElementById('bulk-result').innerHTML = resultHTML;
}

// Fetch data when the page loads
fetchData();
