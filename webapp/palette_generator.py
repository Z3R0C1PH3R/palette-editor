import random


def sign(n):
    if n == 0:
        return 0
    if n > 0:
        return 1
    return -1

def rgb_palette(size = 1):
    return [(random.random(), random.random(), random.random()) for _ in range(size)]

def hls_palette(size = 1, h_spread=1, l_spread=0, s_spread=0):
    h = random.random()
    dh = h_spread/size
    s = 1 + sign(s_spread)*(random.random()*(1-s_spread-0.1)+0.1) if s_spread else random.random()/2+0.3
    ds = s_spread/size
    l = 1 + sign(l_spread)*(random.random()*(1-l_spread-0.1)+0.1) if l_spread else random.random()/2+0.3
    dl = l_spread/size
    return [(((h+i*dh)%1)*360, (l+i*dl)%1, (s+i*ds)%1) for i in range(size)]

