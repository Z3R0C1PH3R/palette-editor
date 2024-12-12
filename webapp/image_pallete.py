import cv2
import matplotlib.pyplot as plt
import numpy as np
from time import perf_counter
import palette_generator

BLOOM_RADIUS = 0.1
BLOOM_THRESHOLD = 0.9
BLOOM_AMOUNT = 0.3
PALETTE_SIZE = 8
PALETTE = palette_generator.rgb_palette(PALETTE_SIZE)
p = palette_generator.hls_palette(size=PALETTE_SIZE, h_spread=0.3, s_spread=0.6, l_spread=0.6)
PALETTE = cv2.cvtColor(np.array([p]).astype(np.float32), cv2.COLOR_HLS2RGB)[0].tolist()
# PALETTE = [[0.43378081917762756, 0.3269331753253937, 0.3537280261516571], [0.5534668564796448, 0.35724711418151855, 0.3623049557209015], [0.6667681336402893, 0.44829848408699036, 0.3939458727836609], [0.749582052230835, 0.5834992527961731, 0.4611319303512573], [0.8211460113525391, 0.7223750352859497, 0.5395679473876953], [0.8814599514007568, 0.8497384190559387, 0.6292539834976196], [0.9106460213661194, 0.9305238723754883, 0.7301901578903198], [0.9274981021881104, 0.9683378338813782, 0.842376172542572]]
cv2.imwrite("palette.png", cv2.cvtColor((np.reshape(PALETTE, (1, PALETTE_SIZE, 3))*256).astype(np.float32), cv2.COLOR_RGB2BGR))

print(PALETTE)
BAYER8 = [[ 0, 8, 2,10],
          [12, 4,14, 6],
          [ 3,11, 1, 9],
          [15, 7,13, 5]]

def palette_downsize(img, n=PALETTE_SIZE, palette=None):
    if palette:
        return palette[min(np.floor(img*(n-1)+0.5).astype(int), n-1)]
    else:
        return np.floor(img*(n-1)+0.5)/(n-1)

def ordered_dithering(img, palette_size=PALETTE_SIZE, s=0.2, map=BAYER8, palette=None):
    new_img = np.zeros(img.shape+(3,)) if palette else np.zeros(img.shape)
    n = len(map)
    w,h = len(img[0]), len(img)
    for i in range(h):
        for j in range(w):
            new_img[i,j] = palette_downsize(img[i,j] + s*(map[i%n][j%n]/n**2 - 0.5), palette_size, palette=palette)

    return new_img

def show_image(img):
    plt.imshow(img,cmap="gray")
    plt.axis("off")
    plt.show()

img1 = cv2.imread("image.jpg")
img1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
img1 = img1/256

t1 = perf_counter()
img01 = ordered_dithering(img1, palette=None)
print("Dithering time: ", perf_counter()-t1)
# show_image(img1)
cv2.imwrite("1.png", cv2.cvtColor((img01*256).astype(np.float32), cv2.COLOR_RGB2BGR))


t1 = perf_counter()
img2 = ordered_dithering(img1, palette=PALETTE)
print("Dithering + palette time: ", perf_counter()-t1)
# show_image(img1)
cv2.imwrite("2.png", cv2.cvtColor((img2*256).astype(np.float32), cv2.COLOR_RGB2BGR))


BLOOM_RADIUS = BLOOM_RADIUS * min(img1.shape)/10
t1 = perf_counter()
#blur = cv2.GaussianBlur(np.where(img2==PALETTE[-1], PALETTE[-1], [0,0,0]), (0,0), BLOOM_RADIUS, BLOOM_RADIUS)
# blur2 = cv2.GaussianBlur(np.where(img2==PALETTE[-2], PALETTE[-2], [0,0,0]), (0,0), BLOOM_RADIUS//2, BLOOM_RADIUS//2)
# img3 = cv2.addWeighted(img2, 1, cv2.addWeighted(blur1, 0.5, blur2, 1, 0), 0.2, 0)
blur = cv2.GaussianBlur(np.where(img1[..., None] > BLOOM_THRESHOLD, img2, 0), (0,0), BLOOM_RADIUS, BLOOM_RADIUS)
img3 = cv2.addWeighted(img2, 1, blur, BLOOM_AMOUNT, 0)
print("Bloom Time: ", perf_counter()-t1)
cv2.imwrite("3.png", cv2.cvtColor((img3*256).astype(np.float32), cv2.COLOR_RGB2BGR))

show_image(blur)