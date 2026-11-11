import struct,json,io,base64,sys,numpy as np
from PIL import Image
def conv(src,name,idxn):
    d=open(src,'rb').read();n=struct.unpack('<I',d[12:16])[0];j=json.loads(d[20:20+n]);bs=20+n+8
    def bv(i):
        v=j['bufferViews'][i];return d[bs+v['byteOffset']:bs+v['byteOffset']+v['byteLength']]
    pr=j['meshes'][0]['primitives'][0]['attributes']
    def acc(i,dt,c):
        a=j['accessors'][i];return np.frombuffer(bv(a['bufferView']),dtype=dt).reshape(-1,c)
    ia=j['accessors'][j['meshes'][0]['primitives'][0]['indices']]
    idx=np.frombuffer(bv(ia['bufferView']),dtype={5125:np.uint32,5123:np.uint16}[ia['componentType']]).astype(np.uint32)
    assert idx.max()<65535
    idx=idx.astype(np.uint16)
    P=acc(pr['POSITION'],np.float32,3);UV=acc(pr['TEXCOORD_0'],np.float32,2);N=acc(pr['NORMAL'],np.float32,3)
    img=j['images'][0];im=Image.open(io.BytesIO(bv(img['bufferView']))).convert('RGB')
    im=im.resize((1536,1536),Image.LANCZOS)
    b=io.BytesIO();im.save(b,'JPEG',quality=80);tex=b.getvalue()
    pad=lambda x:x+b'\0'*((-len(x))%4)
    parts=[(idx.tobytes(),34963),(P.tobytes(),34962),(UV.tobytes(),34962),(N.tobytes(),34962),(tex,None)]
    off=0;views=[];blob=b''
    for by,tg in parts:
        v={'buffer':0,'byteOffset':off,'byteLength':len(by)}
        if tg:v['target']=tg
        views.append(v);by=pad(by);blob+=by;off+=len(by)
    J={'asset':{'version':'2.0','generator':'slate'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':name}],
    'meshes':[{'primitives':[{'attributes':{'POSITION':1,'NORMAL':3,'TEXCOORD_0':2},'indices':0,'material':0}]}],
    'materials':[{'name':'skin','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'baseColorTexture':{'index':0},'metallicFactor':0.0,'roughnessFactor':0.85}}],
    'textures':[{'source':0}],'images':[{'bufferView':4,'mimeType':'image/jpeg'}],
    'accessors':[{'bufferView':0,'componentType':5123,'count':len(idx),'type':'SCALAR'},{'bufferView':1,'componentType':5126,'count':len(P),'type':'VEC3','min':P.min(0).tolist(),'max':P.max(0).tolist()},{'bufferView':2,'componentType':5126,'count':len(P),'type':'VEC2'},{'bufferView':3,'componentType':5126,'count':len(P),'type':'VEC3'}],
    'bufferViews':views,'buffers':[{'byteLength':len(blob)}]}
    js=json.dumps(J,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
    out=struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(blob))+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(blob),0x004E4942)+blob
    open('glb/%s.glb'%name.lower(),'wb').write(out)
    open('embed_%s.js'%name.lower(),'w').write("EMBED_GLB.push({name:'%s',size:1.75,humanoid:true,r:[0,0,0],b64:'"%name+base64.b64encode(out).decode()+"'});\n")
    X,Y,Z=P.T;H=Y.max()-Y.min();f=(Y-Y.min())/H;cx=(X.min()+X.max())/2
    hd=Z[f>.9];ft=Z[f<.04]
    print(name,'verts',len(P),'tris',len(idx)//3,'glb',len(out),'H',round(H,3),'W',round(X.max()-X.min(),3),'Z',round(Z.min(),3),round(Z.max(),3),'head z',round(hd.min(),3),round(hd.max(),3),'toe z',round(ft.max(),3),round(ft.min(),3),'v/arm',round(((X.max()-X.min())/H),2))
B='/mnt/user-data/attachments/9ca842aa-d85d-532d-978b-b47b8d77c79c/'
conv(B+'151309ca-jesvin.glb','Jesvin',0);conv('/mnt/user-data/attachments/9ca842aa-d85d-532d-978b-b47b8d77c79c/aa3d8bdf-stany.glb','Stany',1);conv(B+'8de5c1bb-renjith.glb','Renjith',2);conv(B+'f57e851d-hashir.glb','Hashir',3)
