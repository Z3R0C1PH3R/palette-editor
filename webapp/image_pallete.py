import cv2
import matplotlib.pyplot as plt
import numpy as np
from time import perf_counter
import palette_generator

PALETTE_SIZE = 8
# PALETTE = palette_generator.rgb_palette(PALETTE_SIZE)
p = palette_generator.hls_palette(size=PALETTE_SIZE, h_spread=0.5, sl_spread=0.6)
PALETTE = list(cv2.cvtColor(np.array([p]).astype(np.float32), cv2.COLOR_HLS2RGB)[0])
cv2.imwrite("palette.png", cv2.cvtColor((np.reshape(PALETTE, (1, PALETTE_SIZE, 3))*256).astype(np.float32), cv2.COLOR_RGB2BGR))

BAYER8 = [[ 0, 8, 2,10],
          [12, 4,14, 6],
          [ 3,11, 1, 9],
          [15, 7,13, 5]]

def palette_downsize(img, n=PALETTE_SIZE, palette=None):
    if not palette:
        return np.floor(img*(n-1)+0.5)/(n-1)
    else:
        return palette[min(np.floor(img*(n-1)+0.5).astype(int), n-1)]

def ordered_dithering(img, palette_size=PALETTE_SIZE, s=0.2, map=BAYER8, palette=None):
    new_img = np.zeros(img.shape) if not palette else np.zeros(img.shape+(3,))
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

img1 = cv2.imread(input("File Name: "))
img1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
img1 = img1/256

t1 = perf_counter()
img01 = ordered_dithering(img1, palette=None)
print(perf_counter()-t1)
# show_image(img1)
cv2.imwrite("1.png", cv2.cvtColor((img01*256).astype(np.float32), cv2.COLOR_RGB2BGR))


t1 = perf_counter()
img2 = ordered_dithering(img1, palette=PALETTE)
print(perf_counter()-t1)
# show_image(img1)
cv2.imwrite("2.png", cv2.cvtColor((img2*256).astype(np.float32), cv2.COLOR_RGB2BGR))

