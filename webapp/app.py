from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import base64
import palette_generator
from time import perf_counter

app = Flask(__name__)

PALETTE_SIZE = 8
BAYER8 = [[ 0, 8, 2,10],
          [12, 4,14, 6],
          [ 3,11, 1, 9],
          [15, 7,13, 5]]

INTERPOLATION_METHODS = {
    'INTER_NEAREST': cv2.INTER_NEAREST,
    'INTER_LINEAR': cv2.INTER_LINEAR,
    'INTER_AREA': cv2.INTER_AREA,
    'INTER_CUBIC': cv2.INTER_CUBIC,
    'INTER_LANCZOS4': cv2.INTER_LANCZOS4
}



def palette_downsize(img, n=PALETTE_SIZE, palette=None):
    if not palette:
        return np.floor(img*(n-1)+0.5)/(n-1)
    else:
        return palette[np.minimum(np.floor(img*(n-1)+0.5).astype(int), n-1)]

def ordered_dithering(img, palette_size=PALETTE_SIZE, s=0.2, map=BAYER8, palette=None):
    if palette:
        new_img = np.zeros(img.shape+(3,))
    else:
        new_img = np.zeros(img.shape)

    n = len(map)
    h, w = img.shape[:2]
    for i in range(h):
        for j in range(w):
            new_img[i,j] = palette_downsize(img[i,j] + s*(map[i%n][j%n]/n**2 - 0.5), palette_size, palette=palette)
    return new_img


def allowed_file_size(file):
    file.seek(0, 2)  # Go to the end of the file
    size = file.tell()  # Get the size of the file
    file.seek(0)  # Go back to the start of the file
    return size <= 4000 * 4000 * 3  # Assuming 3 bytes per pixel (RGB)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/randomize_palette', methods=['POST'])
def randomize_palette():
    data = request.json
    print("Received data:", data)
    if data is None:
        return jsonify({'error': 'No JSON data received'}), 400
    
    h_spread = data.get('hueSpread', 0.5)
    s_spread = data.get('sSpread', 0.6)
    l_spread = data.get('lSpread', 0.6)
    size = data.get('colorCount', PALETTE_SIZE)
    
    print(f"Generating palette with: h_spread={h_spread}, s_spread={s_spread}, l_spread={l_spread}, size={size}")
    p = palette_generator.hls_palette(size=size, h_spread=h_spread, s_spread=s_spread, l_spread=l_spread)
    palette = list(cv2.cvtColor(np.array([p]).astype(np.float32), cv2.COLOR_HLS2RGB)[0])
    
    # Convert to hex format
    hex_palette = ['#%02x%02x%02x' % tuple((color * 255).astype(int)) for color in palette]
    
    print("Generated palette:", hex_palette)
    return jsonify({'palette': hex_palette})

@app.route('/upload_image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    
    if not allowed_file_size(file):
        return jsonify({'error': 'Image size exceeds 4000x4000 pixels'}), 400

    # Read the image file
    img_array = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    
    # Check dimensions
    height, width = img.shape[:2]
    if height > 4000 or width > 4000:
        return jsonify({'error': 'Image dimensions exceed 4000x4000 pixels'}), 400

    # Convert the image to base64 for sending back to the client
    _, buffer = cv2.imencode('.png', img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return jsonify({'image': img_base64})


@app.route('/apply_palette', methods=['POST'])
def apply_palette():
    data = request.json
    image_data = data['image']
    palette_hex = data['palette']
    slider_values = data['sliderValues']
    
    # Decode the base64 image
    img_data = base64.b64decode(image_data.split(',')[1])
    img_array = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    
    # Resize the image
    resize_factor = slider_values['imageResize'] / 100
    if resize_factor != 1:
        new_width = int(img.shape[1] * resize_factor)
        new_height = int(img.shape[0] * resize_factor)
        interpolation_method = INTERPOLATION_METHODS.get(slider_values['interpolationMethod'], cv2.INTER_AREA)
        img = cv2.resize(img, (new_width, new_height), interpolation=interpolation_method)
    
    # Convert image to grayscale and normalize
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) / 255.0
    
    # Convert hex palette to RGB
    palette = [tuple(int(h.lstrip('#')[i:i+2], 16) for i in (0, 2, 4)) for h in palette_hex]
    palette = list(np.array(palette) / 255.0)
    
    t1 = perf_counter()
    # Apply dithering
    dithered = ordered_dithering(
        img_gray, 
        palette_size=len(palette), 
        s=slider_values['ditheringSpread'],
        palette=palette
    )
    print("TIME:", perf_counter()-t1)

    # Apply bloom effect
    bloom_radius = slider_values.get('bloomRadius', 0.1) * min(img.shape[:2])/10
    bloom_threshold = slider_values.get('bloomThreshold', 0.9)
    bloom_amount = slider_values.get('bloomAmount', 0.3)

    # Calculate kernel size for Gaussian blur (must be odd)
    kernel_size = max(1, int(bloom_radius)*2+1)  # Ensure at least 1

    blur = cv2.GaussianBlur(
        np.where(img_gray[..., None] > bloom_threshold, dithered, 0),
        (0,0), kernel_size, kernel_size
    )

    result = np.clip(dithered + blur * bloom_amount, 0, 1)
    
    # Convert back to uint8 and BGR color space
    result = (result * 255).astype(np.uint8)
    result_bgr = cv2.cvtColor(result, cv2.COLOR_RGB2BGR)
    
    # Encode the result image
    _, buffer = cv2.imencode('.png', result_bgr)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return jsonify({'editedImage': f'data:image/png;base64,{img_base64}'})

if __name__ == '__main__':
    app.run(debug=True)