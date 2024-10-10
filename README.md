# TJ POD Availability Search Tool

## Overview

The TJ POD (Print on Demand) Availability Search Tool is a web-based application designed to check the availability of books for print-on-demand services. It allows users to search for individual ISBNs or perform bulk searches using CSV or Excel files.

## Features

### 1. Single ISBN Search

- Enter a single 13-digit ISBN
- Real-time validation of ISBN input
- Displays availability status and book details (if available)

### 2. Bulk ISBN Search

- Upload a CSV or Excel file containing multiple ISBNs
- Supports both .csv and .xlsx/.xls file formats
- Processes and displays results for all ISBNs in the file

### 3. Results Display

- Shows ISBN availability status
- For available books, displays additional details like description and setup date
- Presents bulk search results in a tabular format

### 4. Download Results

- Option to download bulk search results as a CSV file
- Downloaded file includes ISBN and availability status for each entry

### 5. User-Friendly Interface

- Tabbed interface for easy switching between single and bulk search
- Clear buttons to reset search forms
- Responsive design for use on various devices

## How to Use

### Single ISBN Search

1. Navigate to the "Single ISBN" tab
2. Enter a 13-digit ISBN in the input field
3. Click the "Search" button or press Enter
4. View the result displayed below the search form

### Bulk ISBN Search

1. Navigate to the "Bulk Upload" tab
2. Click "Choose File" and select a CSV or Excel file containing ISBNs
3. Click the "Search" button
4. View the results displayed in a table below
5. (Optional) Click "Download Results" to save the results as a CSV file

### Clearing Results

- For single search: Click the "Clear" button next to the search field
- For bulk search: Click the "Clear" button next to the file upload field

## Technical Details

- Built using HTML, CSS, and JavaScript
- Uses Bootstrap for responsive design
- Incorporates SheetJS library for Excel file processing
- Fetches ISBN data from a JSON file (`data.json`)

## Installation and Setup

1. Clone the repository to your local machine or web server
2. Ensure all files (`index.html`, `script.js`, `data.json`) are in the same directory
3. Open `index.html` in a web browser to use the tool

Note: The tool requires an internet connection to load Bootstrap and SheetJS libraries.

## Data Format

The tool expects ISBN data to be stored in a `data.json` file with the following structure:

```json
[
  {
    "code": "9781234567890",
    "description": "Book Title",
    "setupdate": "2023-01-01"
  },
  // ... more entries
]
```

## Limitations

- The tool is designed for client-side use and may not be suitable for very large datasets
- ISBN validation is performed for 13-digit ISBNs only
- The tool assumes ISBNs are in the first column of uploaded Excel files

## Support

For issues, feature requests, or contributions, please open an issue or pull request in the GitHub repository.
