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

    const sliders = {
        ditheringSpread: document.getElementById('ditheringSpread'),
        hueSpread: document.getElementById('hueSpread'),
        sSpread: document.getElementById('sSpread'),
        lSpread: document.getElementById('lSpread'),
        colorCount: document.getElementById('colorCount'),
        imageResize: document.getElementById('imageResize'),
        interpolationMethod: document.getElementById('interpolationMethod')
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
                    imageUpload.value = ''; // Reset the file input
                } else {
                    currentImageData = 'data:image/png;base64,' + data.image;
                    originalImage.src = currentImageData;
                    applyPaletteBtn.disabled = false;
                }
            })
            .catch(error => console.error('Error:', error));
        }
    });

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
        document.getElementById('loadingSpinner').style.display = 'flex';
    
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
            editedImage.src = data.editedImage;
            downloadImageBtn.disabled = false;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while processing the image.');
        })
        .finally(() => {
            isProcessing = false;
            applyPaletteBtn.disabled = false;
            document.getElementById('loadingSpinner').style.display = 'none';
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

    resetAllBtn.addEventListener('click', resetAll);

    function resetAll() {
        currentPalette = [];
        currentImageData = null;
        paletteDisplay.innerHTML = '';
        originalImage.src = '';
        editedImage.src = '';
        customPaletteInput.value = '';
        applyPaletteBtn.disabled = true;
        downloadImageBtn.disabled = true;
        imageUpload.value = '';
        
        // Reset sliders
        sliders.colorCount.value = 8;
        sliders.hueSpread.value = 0.3;
        sliders.sSpread.value = 0.6;
        sliders.lSpread.value = 0.6;
        sliders.ditheringSpread.value = 0.2;
        sliders.imageResize.value = 100;
        sliders.interpolationMethod.value = 'INTER_AREA';
    
        // Update value displays
        document.getElementById('colorCountValue').textContent = '8';
        document.getElementById('hueSpreadValue').textContent = '30%';
        document.getElementById('sSpreadValue').textContent = '60%';
        document.getElementById('lSpreadValue').textContent = '60%';
        document.getElementById('ditheringSpreadValue').textContent = '20%';
        document.getElementById('imageResizeValue').textContent = '100%';
    }

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
            interpolationMethod: sliders.interpolationMethod.value
        };
    }

    // Update slider value displays
    for (let sliderId in sliders) {
        const slider = sliders[sliderId];
        const valueDisplay = document.getElementById(`${sliderId}Value`);
        if (slider.type === 'range') {
            slider.addEventListener('input', function() {
                if (['hueSpread', 'sSpread', 'lSpread', 'ditheringSpread'].includes(sliderId)) {
                    valueDisplay.textContent = `${(this.value * 100).toFixed(0)}%`;
                } else if (sliderId === 'imageResize') {
                    valueDisplay.textContent = `${this.value}%`;
                } else {
                    valueDisplay.textContent = this.value;
                }
            });
        }
    }
});