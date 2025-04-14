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
    const imageComparison = document.querySelector('.image-comparison');
    let compressedBlob = null;

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
                // Add class to show labels
                imageComparison.classList.add('has-images');
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
        if (infoElement.id === 'compressedInfo') {
            downloadBtn.classList.add('ready');
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Image';
        }
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
        const savings = Math.max(0, ((1 - (compressedSize / originalSize)) * 100)).toFixed(1);
        
        compressionStats.style.display = 'block';
        compressionStats.textContent = compressedSize < originalSize 
            ? `Compression reduced file size by ${savings}%`
            : 'No additional compression needed';
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

    // Add improved slider functionality
    const slider = document.querySelector('.comparison-slider');
    const beforeImage = document.querySelector('.before-image');
    let isSliding = false;

    function updateSliderPosition(x) {
        const bounds = imageComparison.getBoundingClientRect();
        const position = Math.min(Math.max(0, x - bounds.left), bounds.width);
        const percentage = (position / bounds.width) * 100;
        
        slider.style.left = `${percentage}%`;
        // Change clip-path direction to reveal original image from left side
        beforeImage.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
    }

    function initSlider(e) {
        isSliding = true;
        e.preventDefault(); // Prevent default touch behavior
        updateSliderPosition(e.type === 'touchstart' ? e.touches[0].clientX : e.clientX);
    }

    function stopSliding() {
        isSliding = false;
    }

    function slide(e) {
        if (!isSliding) return;
        updateSliderPosition(e.type === 'touchmove' ? e.touches[0].clientX : e.clientX);
    }

    function handleDoubleClick(e) {
        // Quick toggle between full original and compressed view
        updateSliderPosition(e.clientX < imageComparison.offsetWidth / 2 ? 0 : imageComparison.offsetWidth);
    }

    // Add double click handler
    imageComparison.addEventListener('dblclick', handleDoubleClick);

    // Mouse events
    slider.addEventListener('mousedown', initSlider);
    window.addEventListener('mousemove', slide);
    window.addEventListener('mouseup', stopSliding);

    // Touch events
    slider.addEventListener('touchstart', initSlider);
    window.addEventListener('touchmove', slide);
    window.addEventListener('touchend', stopSliding);

    // Initialize slider position
    function initializeSlider() {
        updateSliderPosition(imageComparison.getBoundingClientRect().left + (imageComparison.offsetWidth / 2));
    }

    // Initialize slider when images are loaded
    originalPreview.addEventListener('load', initializeSlider);
    compressedPreview.addEventListener('load', initializeSlider);

    // Initialize without labels at start
    imageComparison.classList.remove('has-images');

    // Replace old menu toggle with new functionality
    const menuIcon = document.querySelector('.menu-icon');
    const menuDropdown = document.querySelector('.menu-dropdown');

    menuIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.fixed-menu')) {
            menuDropdown.classList.remove('active');
        }
    });
});
