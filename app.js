// Theme handling
const themeToggle = document.querySelector('.theme-toggle');
const htmlElement = document.documentElement;

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// Store important HTML elements in variables for easy access
const imageInput = document.getElementById('imageInput');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const compressionMode = document.getElementById('compressionMode');
const qualityControls = document.getElementById('qualityControls');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const originalInfo = document.getElementById('originalInfo');
const compressedInfo = document.getElementById('compressedInfo');
const downloadBtn = document.getElementById('downloadBtn');

// Variables to store the original image and its size
let originalImage = null;
let originalFileSize = 0;

// Add event listeners to respond to user actions
imageInput.addEventListener('change', handleImageUpload);        // When user selects an image
qualitySlider.addEventListener('input', updateQualityValue);    // When user moves the quality slider
qualitySlider.addEventListener('change', compressImage);        // When user finishes moving the slider
compressionMode.addEventListener('change', toggleCompressionMode); // When compression mode changes
downloadBtn.addEventListener('click', downloadImage);

// Function that runs when user selects an image
function handleImageUpload(e) {
    const file = e.target.files[0];  // Get the selected file
    if (!file) return;               // If no file selected, do nothing
    processImage(file);              // Process the selected image
}

// Function to process the uploaded image
function processImage(file) {
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    // Check if file is under 10MB
    if (file.size > 10 * 1024 * 1024) {
        alert('File size too large. Please select an image under 10MB.');
        return;
    }

    // Show loading animation
    document.querySelector('.upload-section').classList.add('loading');
    
    // Save original file size
    originalFileSize = file.size;

    // Create a FileReader to read the image
    const reader = new FileReader();
    reader.onload = function(event) {
        // Create new image object
        originalImage = new Image();
        originalImage.src = event.target.result;
        
        // When image loads, show it in the preview
        originalImage.onload = function() {
            // Hide loading animation
            document.querySelector('.upload-section').classList.remove('loading');
            // Show original image
            originalPreview.src = originalImage.src;
            // Display image information
            originalInfo.innerHTML = `
                <span>Size: ${(originalFileSize / 1024).toFixed(2)} KB</span>
                <span>Dimensions: ${originalImage.width}x${originalImage.height}</span>
                <span>Type: ${file.type.split('/')[1].toUpperCase()}</span>
            `;
            // Start compression
            compressImage();
        }
    }
    // Read the image file
    reader.readAsDataURL(file);

    // Add upload progress simulation
    const progress = document.querySelector('.upload-progress');
    let width = 0;
    const interval = setInterval(() => {
        width += 5;
        progress.style.width = `${width}%`;
        if (width >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                progress.style.width = '0%';
            }, 300);
        }
    }, 50);

    // Update size indicator
    updateSizeIndicator(file.size);
}

function updateSizeIndicator(originalSize) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const percentage = (originalSize / maxSize) * 100;
    const sizeBar = document.querySelector('.size-bar');
    const sizeText = document.querySelector('.size-text');
    
    sizeBar.style.width = `${percentage}%`;
    sizeBar.style.background = percentage > 80 ? '#ef4444' : '#10b981';
    sizeText.textContent = `${(originalSize / (1024 * 1024)).toFixed(2)}MB / 10MB`;
}

// Add drag and drop support
const uploadSection = document.querySelector('.upload-section');
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadSection.addEventListener(eventName, preventDefaults);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadSection.addEventListener(eventName, () => {
        uploadSection.classList.add('drag-over');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    uploadSection.addEventListener(eventName, () => {
        uploadSection.classList.remove('drag-over');
    });
});

uploadSection.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) processImage(file);
});

// Function to update quality percentage display
function updateQualityValue() {
    qualityValue.textContent = `${qualitySlider.value}%`;
    compressImage();
}

// Function to handle compression mode changes
function toggleCompressionMode() {
    qualityControls.style.display = 'block';
    compressImage();
}

// Main function to compress the image
async function compressImage() {
    if (!originalImage) return;

    const compressedPreviewParent = compressedPreview.parentElement;
    downloadBtn.disabled = true;
    compressedPreviewParent.classList.add('loading');
    
    try {
        // Create a canvas to draw and compress the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Keep original dimensions
        let width = originalImage.width;
        let height = originalImage.height;
        
        // Calculate quality (0 to 1, where 1 is highest quality)
        let quality = Math.max(0.001, Math.min(1.0, Math.pow((100 - qualitySlider.value) / 100, 2)));

        // Draw image on canvas at calculated dimensions
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(originalImage, 0, 0, width, height);
        
        // Convert canvas to compressed JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Check if compression was successful
        if (!compressedDataUrl || compressedDataUrl === 'data:,') {
            throw new Error('Compression failed');
        }

        compressedPreview.src = compressedDataUrl;

        // Calculate size of compressed image
        const base64str = compressedDataUrl.split(',')[1];
        const decodedString = atob(base64str);
        const compressedSize = decodedString.length;
        
        // Show compressed image information
        compressedInfo.innerHTML = `
            <span>Size: ${(compressedSize / 1024).toFixed(2)} KB</span>
            <span>Dimensions: ${width.toFixed(0)}x${height.toFixed(0)}</span>
            <span>Quality: ${(quality * 100).toFixed(0)}%</span>
        `;
        
        // Calculate and show compression statistics
        const compressionRatio = Math.min(99.9, Math.max(0, ((1 - (compressedSize / originalFileSize)) * 100)));
        const formattedRatio = compressionRatio.toFixed(1);
        document.querySelector('.compression-stats').style.display = 'block';
        document.querySelector('.compression-stats').innerHTML = `
            Compression Ratio: ${formattedRatio}%<br>
            Original: ${(originalFileSize / 1024).toFixed(2)} KB → Compressed: ${(compressedSize / 1024).toFixed(2)} KB
        `;

        // Enable download button after successful compression
        downloadBtn.disabled = false;

    } catch (error) {
        console.error('Compression error:', error);
        compressedInfo.innerHTML = 'Compression failed. Please try again.';
        document.querySelector('.compression-stats').style.display = 'none';
        downloadBtn.disabled = true;
    } finally {
        compressedPreviewParent.classList.remove('loading');
    }
}

// Function to download the compressed image
function downloadImage() {
    if (!compressedPreview.src) {
        alert('Please compress an image first');
        return;
    }
    
    try {
        // Create temporary link element
        const link = document.createElement('a');
        link.download = 'compressed-image.jpg';
        link.href = compressedPreview.src;
        
        // Required for Firefox
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
        }, 100);
    } catch (error) {
        console.error('Download failed:', error);
        alert('Failed to download image. Please try again.');
    }
}

// Error handling for the entire application
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ', msg, 'URL: ', url, 'Line: ', lineNo, 'Column: ', columnNo, 'Error object: ', error);
    alert('Sorry, something went wrong. Please try again.');
    return false;
};