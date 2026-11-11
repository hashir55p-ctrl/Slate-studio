import base64
def b(f): return base64.b64encode(open(f,'rb').read()).decode()
open('twod_data.js','w').write("const TWOD={draw:'%s',puppet:'%s',shots:'%s'};\n"%(b('s2d.html'),b('p2d.html'),b('sh2d_built.html')))
open('tt2.html','w').write('<!doctype html><meta charset=utf8><style>:root{--btn:#555;--fg:#fff;--mute:#aaa}body{background:#222;margin:0}</style><div class="b-top"><span class="logo">L</span><button>File</button></div><div id="x" style="height:10px"></div><script>var VB={s1:{b64:"'+b('vo/s1.mp3')+'"}};</script><script>'+open('twod_data.js').read()+'</script><script>'+open('twod.js').read()+'</script>')
