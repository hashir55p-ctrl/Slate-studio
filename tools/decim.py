import struct, json, sys, io
import numpy as np
from PIL import Image

def read_glb(path):
    d = open(path, 'rb').read()
    l = struct.unpack('<I', d[12:16])[0]
    j = json.loads(d[20:20 + l])
    off = 20 + l
    bl = struct.unpack('<I', d[off:off + 4])[0]
    bin_ = d[off + 8:off + 8 + bl]
    return j, bin_

def view(j, b, ai, dtype, ncomp):
    a = j['accessors'][ai]
    bv = j['bufferViews'][a['bufferView']]
    o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    return np.frombuffer(b, dtype=dtype, count=a['count'] * ncomp, offset=o).reshape(a['count'], ncomp) if ncomp > 1 else np.frombuffer(b, dtype=dtype, count=a['count'], offset=o)

def img_bytes(j, b, i):
    bv = j['bufferViews'][j['images'][i]['bufferView']]
    o = bv.get('byteOffset', 0)
    return b[o:o + bv['byteLength']]

def islands(T, nv):
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    a = np.concatenate([T[:, 0], T[:, 1], T[:, 2]]); b = np.concatenate([T[:, 1], T[:, 2], T[:, 0]])
    g = coo_matrix((np.ones(len(a), np.int8), (a, b)), shape=(nv, nv))
    return connected_components(g, directed=False)[1]

def cluster(P, N, UV, T, G, ISL):
    mn = P.min(0); ext = (P.max(0) - mn).max()
    c3 = np.floor((P - mn) / ext * G).astype(np.int64)
    key = (c3[:, 0] * (G + 2) + c3[:, 1]) * (G + 2) + c3[:, 2]
    _, pid = np.unique(key, return_inverse=True)
    np_ = pid.max() + 1
    cntp = np.bincount(pid, minlength=np_).astype(np.float64)
    Nc = np.stack([np.bincount(pid, weights=N[:, k], minlength=np_) / cntp for k in range(3)], 1)
    side = ((N * Nc[pid]).sum(1) >= 0).astype(np.int64)
    _, vid = np.unique((pid * (ISL.max() + 1) + ISL) * 2 + side, return_inverse=True)
    nv = vid.max() + 1
    def avg(A, inv, n):
        cnt = np.bincount(inv, minlength=n).astype(np.float64)
        out = np.zeros((n, A.shape[1]))
        for k in range(A.shape[1]):
            out[:, k] = np.bincount(inv, weights=A[:, k], minlength=n) / cnt
        return out
    Pp = avg(P, pid, np_)
    U2 = avg(UV, vid, nv); N2 = avg(N, vid, nv)
    N2 /= np.maximum(np.linalg.norm(N2, axis=1, keepdims=True), 1e-9)
    v2p = np.zeros(nv, np.int64); v2p[vid] = pid
    P2 = Pp[v2p]
    t = vid[T]; tp = pid[T]
    ok = (tp[:, 0] != tp[:, 1]) & (tp[:, 1] != tp[:, 2]) & (tp[:, 0] != tp[:, 2])
    t = t[ok]
    s = np.sort(t, axis=1)
    _, first = np.unique(s, axis=0, return_index=True)
    t = t[np.sort(first)]
    return P2, N2, U2, t

def dilate(im, U, t):
    from PIL import ImageDraw
    from scipy import ndimage
    W, H = im.size
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    px = U * [W, H]
    for tri in px[t]:
        d.polygon([tuple(tri[0]), tuple(tri[1]), tuple(tri[2])], fill=255, outline=255)
    mk = np.array(m) > 0
    mk = ndimage.binary_erosion(mk, iterations=1) | (ndimage.binary_erosion(mk, iterations=1) == mk) & mk
    a = np.array(im)
    _, (iy, ix) = ndimage.distance_transform_edt(~mk, return_indices=True)
    return Image.fromarray(a[iy, ix])

def main(src, dst, target_tris, tex_color=1024, tex_orm=512, tex_norm=1024):
    j, b = read_glb(src)
    pr = j['meshes'][0]['primitives'][0]
    at = pr['attributes']
    P = view(j, b, at['POSITION'], np.float32, 3).astype(np.float64)
    N = view(j, b, at['NORMAL'], np.float32, 3).astype(np.float64)
    UV = view(j, b, at['TEXCOORD_0'], np.float32, 2).astype(np.float64)
    T = view(j, b, pr['indices'], np.uint32, 1).reshape(-1, 3).astype(np.int64)
    ISL = islands(T, len(P)); print('  islands', ISL.max() + 1)
    lo, hi = 12, 400
    best = None
    for _ in range(9):
        G = (lo + hi) // 2
        res = cluster(P, N, UV, T, G, ISL)
        nt = len(res[3])
        if best is None or abs(nt - target_tris) < abs(len(best[1][3]) - target_tris):
            best = (G, res)
        if nt > target_tris: hi = G - 1
        else: lo = G + 1
        if lo > hi: break
    G, (P2, N2, U2, t) = best
    # drop unused verts
    used = np.unique(t)
    remap = -np.ones(len(P2), np.int64); remap[used] = np.arange(len(used))
    P2, N2, U2 = P2[used], N2[used], U2[used]; t = remap[t]
    print(src.split('/')[-1], 'G', G, 'verts', len(P2), 'tris', len(t))
    pos = P2.astype('<f4'); nor = N2.astype('<f4'); uv = U2.astype('<f4')
    idx = t.reshape(-1).astype('<u2' if len(P2) < 65535 else '<u4')
    def jpg(i, size, q, mode='RGB'):
        im = Image.open(io.BytesIO(img_bytes(j, b, i))).convert(mode)
        im = im.resize((size, size), Image.LANCZOS)
        im = dilate(im, U2, t)
        o = io.BytesIO(); im.save(o, 'JPEG', quality=q, optimize=True); return o.getvalue()
    imgs = [jpg(0, tex_color, 86), jpg(1, tex_orm, 82), jpg(2, tex_norm, 90)]
    chunks = []; bvs = []
    def add(data, target=None):
        while sum(len(c) for c in chunks) % 4: chunks.append(b'\0')
        o = sum(len(c) for c in chunks); chunks.append(data)
        d = {'buffer': 0, 'byteOffset': o, 'byteLength': len(data)}
        if target: d['target'] = target
        bvs.append(d); return len(bvs) - 1
    bp = add(pos.tobytes(), 34962); bn = add(nor.tobytes(), 34962); bu = add(uv.tobytes(), 34962); bi = add(idx.tobytes(), 34963)
    bimg = [add(x) for x in imgs]
    out = {
        'asset': {'version': '2.0', 'generator': 'slate-decim'},
        'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': 'kochi_asset'}],
        'meshes': [{'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2}, 'indices': 3, 'material': 0}]}],
        'materials': [{'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'baseColorTexture': {'index': 0}, 'metallicFactor': 1.0, 'roughnessFactor': 1.0, 'metallicRoughnessTexture': {'index': 1}}, 'normalTexture': {'index': 2, 'scale': 1.0}, 'doubleSided': True}],
        'textures': [{'source': 0}, {'source': 1}, {'source': 2}],
        'images': [{'mimeType': 'image/jpeg', 'bufferView': bimg[k]} for k in range(3)],
        'accessors': [
            {'bufferView': bp, 'componentType': 5126, 'count': len(pos), 'type': 'VEC3', 'min': pos.min(0).tolist(), 'max': pos.max(0).tolist()},
            {'bufferView': bn, 'componentType': 5126, 'count': len(nor), 'type': 'VEC3'},
            {'bufferView': bu, 'componentType': 5126, 'count': len(uv), 'type': 'VEC2'},
            {'bufferView': bi, 'componentType': 5123 if idx.dtype == np.dtype('<u2') else 5125, 'count': len(idx), 'type': 'SCALAR'}],
        'bufferViews': bvs,
        'buffers': [{'byteLength': sum(len(c) for c in chunks)}]
    }
    binb = b''.join(chunks)
    while len(binb) % 4: binb += b'\0'
    out['buffers'][0]['byteLength'] = len(binb)
    js = json.dumps(out, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    glb = b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(binb)) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(binb)) + b'BIN\0' + binb
    open(dst, 'wb').write(glb)
    print('  ->', dst.split('/')[-1], round(len(glb) / 1e6, 2), 'MB')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]))
