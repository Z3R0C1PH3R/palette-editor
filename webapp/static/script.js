document.addEventListener('DOMContentLoaded', function() {
    const randomizePaletteBtn = document.getElementById('randomizePalette');
    const applyPaletteBtn = document.getElementById('applyPalette');
    const imageUpload = document.getElementById('imageUpload');
    const originalImage = document.getElementById('originalImage');
    const editedImage = document.getElementById('editedImage');
    const paletteDisplay = document.getElementById('paletteDisplay');
    const copyPaletteBtn = document.getElementById('copyPalette');
    const customPaletteInput = document.getElementById('customPalette');
    const applyCustomPaletteBtn = document.getElementById('applyCustomPalette');
    const downloadImageBtn = document.getElementById('downloadImage');
    const resetAllBtn = document.getElementById('resetAll');
    const viewImageBtn = document.getElementById('viewImage');

    const sliders = {
        ditheringSpread: document.getElementById('ditheringSpread'),
        hueSpread: document.getElementById('hueSpread'),
        sSpread: document.getElementById('sSpread'),
        lSpread: document.getElementById('lSpread'),
        colorCount: document.getElementById('colorCount'),
        imageResize: document.getElementById('imageResize'),
        interpolationMethod: document.getElementById('interpolationMethod'),
        bloomRadius: document.getElementById('bloomRadius'),
        bloomThreshold: document.getElementById('bloomThreshold'),
        bloomAmount: document.getElementById('bloomAmount')
    };

    let currentPalette = [];
    let currentImageData = null;
    let isProcessing = false;

    randomizePaletteBtn.addEventListener('click', function() {
        const sliderValues = getSliderValues();
        console.log("Sending request with values:", sliderValues);
        fetch('/randomize_palette', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sliderValues)
        })
        .then(response => response.json())
        .then(data => {
            console.log("Received palette:", data.palette);
            currentPalette = data.palette;
            displayPalette(currentPalette);
            customPaletteInput.value = currentPalette.join(',');
        })
        .catch(error => console.error('Error:', error));
    });

    copyPaletteBtn.addEventListener('click', function() {
        const paletteString = currentPalette.join(',');
        navigator.clipboard.writeText(paletteString).then(() => {
            alert('Palette copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy palette: ', err);
        });
    });

    applyCustomPaletteBtn.addEventListener('click', function() {
        const customPalette = customPaletteInput.value.split(',').map(color => color.trim());
        if (customPalette.every(color => /^#[0-9A-Fa-f]{6}$/.test(color))) {
            currentPalette = customPalette;
            displayPalette(currentPalette);
        } else {
            alert('Invalid palette format. Please use comma-separated hex values (e.g., #FF0000,#00FF00,#0000FF)');
        }
    });

    // Update image upload handler
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('image', file);

            fetch('/upload_image', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    imageUpload.value = '';
                } else {
                    currentImageData = 'data:image/png;base64,' + data.image;
                    document.getElementById('previewImage').src = currentImageData;
                    applyPaletteBtn.disabled = false;
                }
            })
            .catch(error => console.error('Error:', error));
        }
    });

    // Update applyPalette handler
    applyPaletteBtn.addEventListener('click', function() {
        if (isProcessing) {
            console.log('Processing in progress, please wait...');
            return;
        }
    
        if (!currentImageData || currentPalette.length === 0) {
            alert('Please upload an image and generate a palette first.');
            return;
        }
    
        isProcessing = true;
        applyPaletteBtn.disabled = true;
        document.querySelector('.loading-overlay').classList.add('active');
    
        fetch('/apply_palette', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: currentImageData,
                palette: currentPalette,
                sliderValues: getSliderValues()
            })
        })
        .then(response => response.json())
        .then(data => {
            const prevEditedImage = document.getElementById('editedImage').src;
            if (prevEditedImage && prevEditedImage !== '') {
                addToImageHistory(prevEditedImage);
            }
            document.getElementById('editedImage').src = data.editedImage;
            updateImageButtons(true);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while processing the image.');
        })
        .finally(() => {
            isProcessing = false;
            applyPaletteBtn.disabled = false;
            document.querySelector('.loading-overlay').classList.remove('active');
        });
    });

    downloadImageBtn.addEventListener('click', function() {
        if (editedImage.src) {
            const link = document.createElement('a');
            link.download = 'edited_image.png';
            link.href = editedImage.src;
            link.click();
        }
    });

    viewImageBtn.addEventListener('click', function() {
        if (editedImage.src) {
            window.open(editedImage.src, '_blank');
        }
    });

    resetAllBtn.addEventListener('click', () => {
        try {
            resetAll();
        } catch (error) {
            console.warn('Reset warning:', error);
            // Continue execution even if there's an error
        }
    });

    // Get all slider elements and their value displays
    const colorCountSlider = document.getElementById('colorCount');
    const colorCountValue = document.getElementById('colorCountValue');
    const hueSpreadSlider = document.getElementById('hueSpread');
    const hueSpreadValue = document.getElementById('hueSpreadValue');
    const sSpreadSlider = document.getElementById('sSpread');
    const sSpreadValue = document.getElementById('sSpreadValue');
    const lSpreadSlider = document.getElementById('lSpread');
    const lSpreadValue = document.getElementById('lSpreadValue');
    const imageResizeSlider = document.getElementById('imageResize');
    const imageResizeValue = document.getElementById('imageResizeValue');
    const ditheringSpreadSlider = document.getElementById('ditheringSpread');
    const ditheringSpreadValue = document.getElementById('ditheringSpreadValue');
    const bloomRadiusSlider = document.getElementById('bloomRadius');
    const bloomRadiusValue = document.getElementById('bloomRadiusValue');
    const bloomThresholdSlider = document.getElementById('bloomThreshold');
    const bloomThresholdValue = document.getElementById('bloomThresholdValue');
    const bloomAmountSlider = document.getElementById('bloomAmount');
    const bloomAmountValue = document.getElementById('bloomAmountValue');
    const interpolationMethodSelect = document.getElementById('interpolationMethod');
    const applyPaletteButton = document.getElementById('applyPalette');
    const downloadButton = document.getElementById('downloadImage');

    // Update reset function to clear preview
    function resetAll() {
        // Reset all slider values to defaults
        if (colorCountSlider) colorCountSlider.value = '8';
        if (colorCountValue) colorCountValue.textContent = '8';
        if (hueSpreadSlider) hueSpreadSlider.value = '0.3';
        if (hueSpreadValue) hueSpreadValue.textContent = '30%';
        if (sSpreadSlider) sSpreadSlider.value = '0.6';
        if (sSpreadValue) sSpreadValue.textContent = '60%';
        if (lSpreadSlider) lSpreadSlider.value = '0.6';
        if (lSpreadValue) lSpreadValue.textContent = '60%';
        if (imageResizeSlider) imageResizeSlider.value = '100';
        if (imageResizeValue) imageResizeValue.textContent = '100%';
        if (ditheringSpreadSlider) ditheringSpreadSlider.value = '0.2';
        if (ditheringSpreadValue) ditheringSpreadValue.textContent = '20%';
        if (bloomRadiusSlider) bloomRadiusSlider.value = '0.1';
        if (bloomRadiusValue) bloomRadiusValue.textContent = '10%';
        if (bloomThresholdSlider) bloomThresholdSlider.value = '0.9';
        if (bloomThresholdValue) bloomThresholdValue.textContent = '90%';
        if (bloomAmountSlider) bloomAmountSlider.value = '0.3';
        if (bloomAmountValue) bloomAmountValue.textContent = '30%';
        if (interpolationMethodSelect) interpolationMethodSelect.value = 'INTER_AREA';

        // Clear image previews
        if (previewImage) previewImage.src = '';
        if (editedImage) editedImage.src = '';
        if (imageUpload) imageUpload.value = '';
        if (customPaletteInput) customPaletteInput.value = '';

        // Disable buttons
        applyPaletteButton.disabled = true;
        downloadButton.disabled = true;

        // Clear palette display
        if (paletteDisplay) paletteDisplay.innerHTML = '';
        
        // Clear current palette
        currentPalette = [];
        
        updateImageButtons(false);
    }
    
    // Remove auto-generation on load
    resetAll();

    // Call resetAll when the page loads
    resetAll();

    function displayPalette(palette) {
        console.log("Displaying palette:", palette);
        paletteDisplay.innerHTML = '';
        palette.forEach(color => {
            const colorBox = document.createElement('div');
            colorBox.className = 'color-box';
            colorBox.style.backgroundColor = color;
            paletteDisplay.appendChild(colorBox);
        });
    }

    function getSliderValues() {
        return {
            ditheringSpread: parseFloat(sliders.ditheringSpread.value),
            hueSpread: parseFloat(sliders.hueSpread.value),
            sSpread: parseFloat(sliders.sSpread.value),
            lSpread: parseFloat(sliders.lSpread.value),
            colorCount: parseInt(sliders.colorCount.value),
            imageResize: parseInt(sliders.imageResize.value),
            interpolationMethod: sliders.interpolationMethod.value,
            bloomRadius: parseFloat(sliders.bloomRadius.value),
            bloomThreshold: parseFloat(sliders.bloomThreshold.value),
            bloomAmount: parseFloat(sliders.bloomAmount.value)
        };
    }

    // Update slider value displays with bloom percentages
    for (let sliderId in sliders) {
        const slider = sliders[sliderId];
        const valueDisplay = document.getElementById(`${sliderId}Value`);
        if (slider.type === 'range') {
            slider.addEventListener('input', function() {
                if (['hueSpread', 'sSpread', 'lSpread', 'ditheringSpread', 'bloomRadius', 'bloomAmount', 'bloomThreshold'].includes(sliderId)) {
                    valueDisplay.textContent = `${(this.value * 100).toFixed(0)}%`;
                } else if (sliderId === 'imageResize') {
                    valueDisplay.textContent = `${this.value}%`;
                } else {
                    valueDisplay.textContent = this.value;
                }
            });
        }
    }

    function addToImageHistory(editedSrc) {
        if (!editedSrc || editedSrc === '' || editedSrc === 'http://127.0.0.1:5000/') {
            return;
        }

        const previousImages = document.querySelector('.previous-images');
        const newEntry = document.createElement('div');
        newEntry.className = 'image-pair';
        
        newEntry.innerHTML = `
            <div class="image-container">
                <img src="${editedSrc}" alt="Previous Edit">
                <div class="image-actions">
                    <button class="download-history" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="view-history" title="View">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
        `;
        
        const downloadBtn = newEntry.querySelector('.download-history');
        const viewBtn = newEntry.querySelector('.view-history');

        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const link = document.createElement('a');
            link.download = 'palette_edit.png';
            link.href = editedSrc;
            link.click();
        });

        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(editedSrc, '_blank');
        });
        
        // Add click handler to restore this version
        newEntry.addEventListener('click', () => {
            document.getElementById('editedImage').src = editedSrc;
            updateImageButtons(true);
        });

        previousImages.insertBefore(newEntry, previousImages.firstChild);
    }

    function updateImageButtons(enabled) {
        downloadImageBtn.disabled = !enabled;
        viewImageBtn.disabled = !enabled;
    }
});