import json
rows=json.load(open('plan/shots.json'))
T=["0.0–1.96","1.96–4.74","4.74–5.04","5.04–7.56","8.08–10.64","11.0–13.56","14.16–17.74","18.2–22.54","22.66–24.28","24.5–28.18","28.38–30.24","30.8–32.96","33.24–36.58","36.6–37.0"]
out=[dict(n=r['n'],t=t+' s',title=r['title'],who=r['who'],act=r['act'],frames=[dict(id=f['id'],desc=f['p']) for f in r['frames']]) for r,t in zip(rows,T)]
open('tools/shots.html','w').write(open('sh2d.html').read().replace('__DATA__',json.dumps(out,ensure_ascii=False)))
