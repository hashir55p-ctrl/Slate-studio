legs={"upperLeg.L":[-88,0,-4],"upperLeg.R":[-88,0,4],"lowerLeg.L":[90,0,0],"lowerLeg.R":[90,0,0],"spine":[10,0,0],"chest":[5,0,0]}
REST={"upperArm.L":[-60,-10,-12],"upperArm.R":[-60,10,12],"foreArm.L":[-60,0,0],"foreArm.R":[-60,0,0]}
def P(**kw):
    d=dict(legs); d.update(REST)
    for k,v in kw.items(): d[k.replace('_','.')]=v
    return d
def M(**kw): # mirror right->both
    o={}
    for k,v in kw.items():
        o[k]=v
        if k.endswith('_R'): o[k[:-2]+'_L']=[v[0],-v[1],-v[2]]
    return o
SEAT={
 'rest':P(),
 'talkR':P(upperArm_R=[-52,30,15],foreArm_R=[-100,0,0]),
 'palms':P(upperArm_L=[-45,15,-20],upperArm_R=[-45,-15,20],foreArm_L=[-95,50,0],foreArm_R=[-95,-50,0]),
 'chin':P(upperArm_R=[-82,45,8],foreArm_R=[-140,0,0],head=[8,0,0]),
 'sip':P(upperArm_R=[-65,55,10],foreArm_R=[-145,0,0],head=[-6,0,0]),
 'point':P(upperArm_R=[-75,25,5],foreArm_R=[-25,0,0]),
 'phone':P(**M(upperArm_R=[-40,55,15],foreArm_R=[-110,0,0]),head=[22,0,0]),
 'laugh':P(**M(upperArm_R=[-20,60,10],foreArm_R=[-80,0,0]),spine=[-4,0,0],chest=[-6,0,0],head=[-14,0,0]),
}
STAND={
 'srest':{"upperArm.L":[4,0,-4],"upperArm.R":[4,0,4],"foreArm.L":[-12,0,0],"foreArm.R":[-12,0,0]},
 'stalk':{"upperArm.L":[4,0,-4],"upperArm.R":[-30,30,15],"foreArm.L":[-12,0,0],"foreArm.R":[-95,0,0]},
 'schop':{"upperArm.L":[-35,-40,-12],"upperArm.R":[-35,40,12],"foreArm.L":[-80,0,0],"foreArm.R":[-80,0,0]},
 'sshrug':{"upperArm.L":[-38,15,-18],"upperArm.R":[-38,-15,18],"foreArm.L":[-75,40,0],"foreArm.R":[-75,-40,0]},
 'sphone':{"upperArm.L":[4,0,-4],"upperArm.R":[-55,50,10],"foreArm.L":[-12,0,0],"foreArm.R":[-100,0,0],"head":[15,0,0]},
}
