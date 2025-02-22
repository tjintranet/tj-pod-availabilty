let booksData = [];
let bulkResults = [];

// Event Listeners
document.getElementById('search-button').addEventListener('click', function(e) {
    e.preventDefault();
    const isbn = document.getElementById('isbn').value;
    if (isValidISBN13(isbn)) {
        searchISBN(isbn);
    } else {
        showInvalidISBNFeedback();
    }
});

// Upload spinner
document.getElementById('isbn').addEventListener('input', handleISBNInput);
document.getElementById('isbn').addEventListener('click', function(e) {
    e.target.select();
});
document.getElementById('clear-button').addEventListener('click', clearSingleSearch);
document.getElementById('file-upload').addEventListener('change', handleFileChange);
document.getElementById('bulk-clear-button').addEventListener('click', clearBulkUpload);
document.getElementById('download-button').addEventListener('click', downloadResults);

function showSpinner() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block';
    document.getElementById('bulk-result').innerHTML = '';
    document.getElementById('file-upload').disabled = true;
    document.getElementById('bulk-clear-button').disabled = true;
}

function hideSpinner() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'none';
    document.getElementById('file-upload').disabled = false;
    document.getElementById('bulk-clear-button').disabled = false;
}

function updateProgress(processed, total) {
    const percentage = Math.round((processed / total) * 100);
    document.getElementById('progress-text').textContent = `${processed} of ${total} (${percentage}%)`;
}

// Input Handlers
function handleISBNInput(e) {
    const isbn = e.target.value.replace(/[-\s]/g, '');
    const isValid = isValidISBN13(isbn);
    e.target.classList.toggle('is-valid', isValid);
    e.target.classList.toggle('is-invalid', !isValid);
    document.getElementById('isbn-feedback').style.display = isValid ? 'none' : 'block';
    document.getElementById('search-button').disabled = !isValid;
}

function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.name.toLowerCase().endsWith('.csv')) {
            processCSV(file);
        } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            processExcel(file);
        } else {
            showAlert('Unsupported file type. Please upload a CSV or Excel file.', 'danger');
            e.target.value = '';
        }
    }
}

// File Processing
function processCSV(file) {
    showSpinner();
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const isbns = content.split(/\r\n|\n/).filter(isbn => isbn.trim() !== '');
        
        // Process ISBNs in chunks to prevent UI blocking
        const chunkSize = 50;
        const chunks = [];
        for (let i = 0; i < isbns.length; i += chunkSize) {
            chunks.push(isbns.slice(i, i + chunkSize));
        }
        
        processChunks(chunks, isbns.length);
    };
    reader.readAsText(file);
}

function processExcel(file) {
    showSpinner();
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const isbns = XLSX.utils.sheet_to_json(worksheet, {header: 1})
            .flat()
            .map(isbn => isbn ? isbn.toString().trim() : '')
            .filter(isbn => isbn !== '');

        // Process ISBNs in chunks
        const chunkSize = 100;
        const chunks = [];
        for (let i = 0; i < isbns.length; i += chunkSize) {
            chunks.push(isbns.slice(i, i + chunkSize));
        }
        
        processChunks(chunks, isbns.length);
    };
    reader.readAsArrayBuffer(file);
}

// Process chunks with setTimeout
async function processChunks(chunks, totalIsbns) {
    let processedIsbns = 0;
    let allResults = [];
    
    function processNextChunk() {
        if (chunks.length === 0) {
            // All chunks processed
            processBulkISBNs(allResults);
            hideSpinner();
            return;
        }
        
        const chunk = chunks.shift();
        processedIsbns += chunk.length;
        allResults = allResults.concat(chunk);
        
        updateProgress(processedIsbns, totalIsbns);
        
        // Process next chunk in the next event loop iteration
        setTimeout(processNextChunk, 0);
    }
    
    processNextChunk();
}

// Data Processing
async function fetchData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        booksData = await response.json();
        console.log('Loaded books data:', booksData);
    } catch (error) {
        console.error('Error fetching data:', error);
        showAlert('Error loading data. Please try again later.', 'danger');
    }
}

function searchISBN(isbn) {
    const result = booksData.find(book => book.code === isbn);
    
    let resultHTML = '';
    if (result) {
        resultHTML = `
            <div class="alert alert-success mb-0">
                <p class="mb-2"><strong>ISBN:</strong> ${result.code}</p>
                <p class="mb-2"><strong>Description:</strong> ${result.description}</p>
                <p class="mb-0"><strong>Setup Date:</strong> ${result.setupdate}</p>
            </div>
        `;
    } else {
        resultHTML = '<div class="alert alert-warning mb-0">Item not available for POD</div>';
    }
    
    document.getElementById('result').innerHTML = resultHTML;
}

function processBulkISBNs(isbns) {
    console.log('Processing bulk ISBNs:', isbns);
    if (!booksData || booksData.length === 0) {
        console.error('No books data available');
        showAlert('Error: Book data not loaded. Please refresh the page and try again.', 'danger');
        return;
    }
    let resultHTML = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>ISBN</th>
                        <th>Description</th>
                        <th>Setup Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    bulkResults = isbns.map(isbn => {
        isbn = isbn.toString().replace(/[-\s]/g, '');
        const result = booksData.find(book => book.code === isbn);
        let status, statusClass, description, setupdate;
        
        if (isValidISBN13(isbn)) {
            if (result) {
                status = 'Available for POD';
                statusClass = 'success';
                description = result.description;
                setupdate = formatDate(result.setupdate);
            } else {
                status = 'Not available for POD';
                statusClass = 'danger';
                description = '-';
                setupdate = '-';
            }
        } else {
            status = 'Invalid ISBN';
            statusClass = 'warning';
            description = '-';
            setupdate = '-';
        }
        
        resultHTML += `
            <tr>
                <td>${isbn}</td>
                <td>${description || '-'}</td>
                <td>${setupdate}</td>
                <td><span class="badge bg-${statusClass}">${status}</span></td>
            </tr>
        `;
        
        return { isbn, status, description, setupdate };
    });
    
    resultHTML += '</tbody></table></div>';
    document.getElementById('bulk-result').innerHTML = resultHTML;
    document.getElementById('download-button').disabled = false;
}

function downloadResults() {
    if (bulkResults.length === 0) return;
    
    const csv = 'ISBN,Description,Setup Date,Status\n' + 
        bulkResults.map(result => `${result.isbn},"${result.description || ''}","${result.setupdate}","${result.status}"`).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "isbn_results.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function formatDate(dateStr) {
    if (!dateStr || dateStr === '-') return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        
        return `${day}-${month}-${year}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
    }
}

// Utility Functions
function isValidISBN13(isbn) {
    isbn = isbn.replace(/[-\s]/g, '');
    if (isbn.length !== 13 || !/^\d{13}$/.test(isbn)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += (i % 2 === 0) ? parseInt(isbn[i]) : parseInt(isbn[i]) * 3;
    }
    let checksum = (10 - (sum % 10)) % 10;
    return isbn[12] === checksum.toString();
}

function showInvalidISBNFeedback() {
    const isbnInput = document.getElementById('isbn');
    isbnInput.classList.add('is-invalid');
    document.getElementById('isbn-feedback').style.display = 'block';
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    const cardBody = document.querySelector('.card-body');
    cardBody.insertBefore(alertDiv, cardBody.firstChild);
}

function clearSingleSearch() {
    const isbnInput = document.getElementById('isbn');
    isbnInput.value = '';
    isbnInput.classList.remove('is-valid', 'is-invalid');
    document.getElementById('isbn-feedback').style.display = 'none';
    document.getElementById('search-button').disabled = true;
    document.getElementById('result').innerHTML = '';
}

function clearBulkUpload() {
    document.getElementById('file-upload').value = '';
    document.getElementById('bulk-result').innerHTML = '';
    document.getElementById('download-button').disabled = true;
    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('progress-text').textContent = '';
    bulkResults = [];
}

function downloadResults() {
    if (bulkResults.length === 0) return;
    
    const csv = 'ISBN,Description,Setup Date,Status\n' + 
        bulkResults.map(result => `${result.isbn},"${result.description || ''}","${result.setupdate || ''}","${result.status}"`).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "isbn_results.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await fetchData();
    console.log('Initialization complete');
});