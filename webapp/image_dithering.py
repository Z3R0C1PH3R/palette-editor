import cv2
import matplotlib.pyplot as plt
import numpy as np
from time import perf_counter

PALETTE_SIZE = 8
RGB_TO_GRAY_MAP = np.array([0.299, 0.587, 0.114])


BAYER8 = [[ 0, 8, 2,10],
          [12, 4,14, 6],
          [ 3,11, 1, 9],
          [15, 7,13, 5]]

def palette_downsize(img, n=8):
    return (img*(n-1)+0.5)//1/(n-1)

def ordered_dithering(img, palette_size=8, s=0.5, map=BAYER8):
    new_img = np.zeros(img.shape)
    n = len(map)
    w,h = len(img[0]), len(img)
    for i in range(h):
        for j in range(w):
            new_img[i,j] = palette_downsize(img[i,j] + s*(map[i%n][j%n]/n**2 - 0.5), palette_size)

    return new_img

def show_image(img):
    plt.imshow(img,cmap="gray")
    plt.axis("off")
    plt.show()

img1 = cv2.imread("image2.jpg")
img1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
img1 = img1/256
# show_image(img1)

img01 = palette_downsize(img1,8)
# show_image(img1)
cv2.imwrite("1.png", cv2.cvtColor((img01*256).astype(np.float32), cv2.COLOR_RGB2BGR))

t1 = perf_counter()
img2 = ordered_dithering(img1)
print(perf_counter()-t1)
# show_image(img1)
cv2.imwrite("2.png", cv2.cvtColor((img2*256).astype(np.float32), cv2.COLOR_RGB2BGR))

t1 = perf_counter()
img3 = ordered_dithering(img1, s=0.2)
print(perf_counter()-t1)
# show_image(img1)

cv2.imwrite("3.png", cv2.cvtColor((img3*256).astype(np.float32), cv2.COLOR_RGB2BGR))
