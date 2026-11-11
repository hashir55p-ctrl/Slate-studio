import sys,subprocess,base64,wave,numpy as np
src,vid,out=sys.argv[1],sys.argv[2],sys.argv[3]
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',src,'-ac','1','-ar','16000','/tmp/vb_tmp.wav'],check=True)
w=wave.open('/tmp/vb_tmp.wav'); sr=w.getframerate(); x=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(float)/32768
dur=len(x)/sr; n=int(dur*30)+1; N=int(sr*.032); win=np.hanning(N)
rms=[];V=[]
fr=np.fft.rfftfreq(N,1/sr)
for i in range(n):
    c=int(i/30*sr); f=x[max(0,c-N//2):c+N//2]
    if len(f)<N: f=np.pad(f,(0,N-len(f)))
    rms.append(np.sqrt((f**2).mean())); sp=np.abs(np.fft.rfft(f*win))**2
    def band(a,b): m=(fr>=a)&(fr<b); return sp[m].sum()+1e-12, (sp[m]*fr[m]).sum()/(sp[m].sum()+1e-12)
    tot=sp.sum()+1e-12; hi=sp[(fr>=4000)].sum()/tot; e1,f1=band(250,1000); e2,f2=band(1000,3200)
    V.append((hi,f1,f2))
rms=np.array(rms); p95=np.percentile(rms,95); env=np.clip(rms/p95*200,0,255).astype(np.uint8)
thr=p95*.06; vis=bytearray()
for i in range(n):
    hi,f1,f2=V[i]
    if rms[i]<thr: code=0
    elif hi>.4: code=6
    elif f1>600 and f2<1700: code=1
    elif f1<480 and f2>2000: code=3
    elif f2>1700: code=2
    elif f1<480: code=5
    else: code=4
    it=int(min(31,round(env[i]/255*31)))
    vis.append((code<<5)|it)
b=lambda a:base64.b64encode(bytes(a)).decode()
open(out,'w').write("VB.%s={dur:%.3f,url:'assets/%s.mp3',env:'%s'};\nVB.%s.vis='%s';\n"%(vid,dur,vid.replace('s','s'),b(env),vid,b(vis)))
print('dur',dur,'frames',n,'codes',np.bincount([v>>5 for v in vis],minlength=8))
