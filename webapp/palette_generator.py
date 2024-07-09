import random

def rgb_palette(size = 1):
    return [(random.random(), random.random(), random.random()) for _ in range(size)]

def hls_palette(size = 1, h_spread=1, l_spread=0, s_spread=0):
    h = random.random()
    dh = h_spread/size
    s = random.random()*(1-s_spread-0.1)+0.1 if s_spread else random.random()/2+0.3
    ds = s_spread/size
    l = random.random()*(1-l_spread-0.1)+0.1 if l_spread else random.random()/2+0.3
    dl = l_spread/size
    return [(((h+i*dh)%1)*360, l+i*dl, s+i*ds) for i in range(size)]

