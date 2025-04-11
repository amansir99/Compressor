document.addEventListener('DOMContentLoaded', () => {
    const uploadSection = document.querySelector('.upload-section');
    const imageInput = document.getElementById('imageInput');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalInfo = document.getElementById('originalInfo');
    const compressedInfo = document.getElementById('compressedInfo');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const compressionStats = document.querySelector('.compression-stats');
    let compressedBlob = null;

    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Set initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') || (prefersDarkScheme.matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = savedTheme;

    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
    });

    // Drag and drop functionality
    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.classList.add('drag-over');
    });

    uploadSection.addEventListener('dragleave', () => {
        uploadSection.classList.remove('drag-over');
    });

    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });

    uploadSection.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });

    // Set initial quality value display
    qualityValue.textContent = `50%`;
    qualitySlider.style.setProperty('--slider-value', '50%');

    qualitySlider.addEventListener('input', (e) => {
        const sliderValue = parseInt(e.target.value);
        qualityValue.textContent = `${sliderValue}%`;
        qualityValue.classList.add('changing');
        qualitySlider.style.setProperty('--slider-value', `${sliderValue}%`);
        
        if (originalPreview.src) {
            compressImage(originalPreview);
        }
    });

    qualitySlider.addEventListener('change', () => {
        qualityValue.classList.remove('changing');
    });

    async function handleImageUpload(file) {
        if (file.size > 50 * 1024 * 1024) {
            alert('File size must be less than 50MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            originalPreview.onload = () => {
                updateFileInfo(originalInfo, file);
                compressImage(originalPreview);
            };
        };
        reader.readAsDataURL(file);
    }

    async function compressImage(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Convert slider value to compression quality
        // At 0 -> quality = 1 (original)
        // At 100 -> quality = 0.005 (maximum compression)
        const sliderValue = parseInt(qualitySlider.value);
        const quality = sliderValue === 0 ? 1 : sliderValue === 100 ? 0.005 : 1 - (sliderValue / 100);

        // Calculate dimensions while maintaining aspect ratio
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        const maxDimension = 1920;

        if (width > maxDimension || height > maxDimension) {
            if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
            } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
            }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
            (blob) => {
                compressedBlob = blob;
                const url = URL.createObjectURL(blob);
                compressedPreview.src = url;
                updateFileInfo(compressedInfo, blob);
                updateCompressionStats();
                downloadBtn.disabled = false;
            },
            'image/jpeg',
            quality
        );
    }

    function updateFileInfo(infoElement, file) {
        const size = formatFileSize(file.size);
        infoElement.textContent = `Size: ${size}`;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function updateCompressionStats() {
        const originalSize = originalPreview.src ? atob(originalPreview.src.split(',')[1]).length : 0;
        const compressedSize = compressedBlob.size;
        const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        compressionStats.style.display = 'block';
        compressionStats.textContent = `Compression reduced file size by ${savings}%`;
    }

    downloadBtn.addEventListener('click', async () => {
        if (!compressedBlob) return;

        try {
            const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const isAndroid = /Android/i.test(navigator.userAgent);

            if (isAndroid) {
                // Create a temporary anchor element
                const a = document.createElement('a');
                a.href = compressedPreview.src; // Your compressed image URL
                a.download = 'compressed-image';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                // Desktop download logic
                const url = URL.createObjectURL(compressedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'compressed-image.jpg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Show success modal
                const modal = document.getElementById('successModal');
                modal.style.display = 'block';
                
                // Hide modal after 3 seconds
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download image. Please try again.');
        }
    });

    // Close modal when clicking X
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('successModal').style.display = 'none';
    });
});
