/* Research visual rendering; MRI-derived brain attribution: brain/README.md. */
(() => {
    'use strict';
    const M = window.ResearchModels, TAU=Math.PI*2;

    class ResearchScenes {
        constructor(ctx) {
            this.ctx=ctx; this.time=0; this.hour=9.25; this.stimulusAge=100; this.networkTime=0;this.brainMix=0;this.plan={coffee:14,sleep:23,meal:19};
            this.mouse=new M.BehaviorModel(Math.floor(Math.random()*0xFFFFFFFF));
            // Pre-roll so every trace already spans the full 8-second history.
            this.mouse.advance(9);
            this.fallback=document.querySelector('.field-fallback');
            this.fallback.addEventListener('load',()=>{if(this.mode==='network')this.draw('network',this.w,this.h);});
        }
        advance(dt,mode) {
            this.time+=dt; this.stimulusAge+=dt;
            if(mode==='network')this.networkTime+=dt;
            if(mode==='waves') this.hour=(this.hour+dt*.035)%24;
            if(mode==='behavior') this.mouse.advance(dt);
        }
        ink(a=1){return `rgba(218,237,216,${a})`;}
        line(x1,y1,x2,y2,a=.3,weight=1,color) {
            const c=this.ctx;c.beginPath();c.lineWidth=weight;c.strokeStyle=color||this.ink(a);c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
        }
        text(t,x,y,size=10,a=.7,align='left',color) {
            const c=this.ctx;c.font=`${size}px -apple-system, BlinkMacSystemFont, "LXGWWenKai", sans-serif`;c.fillStyle=color||this.ink(a);c.textAlign=align;c.fillText(t,x,y);
        }
        // Figure-style panel heading: bold lowercase letter, then title.
        panelLabel(letter,title,x,y,size) {
            const c=this.ctx;size=size||(this.w<721?11:12);
            c.font=`700 ${size+1}px -apple-system, BlinkMacSystemFont, sans-serif`;c.fillStyle=this.ink(.95);c.textAlign='left';c.fillText(letter,x,y);
            const offset=c.measureText(letter).width+8;this.text(title,x+offset,y,size,.82);
        }
        circle(x,y,r,a=1,color) {
            const c=this.ctx;c.beginPath();c.fillStyle=color||this.ink(a);c.arc(x,y,r,0,TAU);c.fill();
        }
        draw(mode,width,height,rx=0,ry=0) {
            this.mode=mode;this.w=width;this.h=height;this.ctx.clearRect(0,0,width,height);
            if(mode==='network')this.network(rx,ry);
            else if(mode==='waves')this.waves();
            else this.behavior();
        }
        network(rx,ry) {
            const c=this.ctx,w=this.w,h=this.h;
            const mobile=w<721;
            const scale=mobile?Math.min(w/580,h*.48/410):Math.min(w*.66/580,h*.86/410);
            // The field itself reaches the viewport edges; the brain is no longer framed in a column.
            for(let i=0;i<38;i++){
                const drift=Math.sin(this.time*.2+i*.14)*h*.022;
                c.beginPath();c.moveTo(-30,h*(.28+i*.022)+drift);
                c.bezierCurveTo(w*.22,h*(.16+i*.025),w*.48,h*(.83-i*.014)+drift,w*.73,h*.49);
                c.strokeStyle=this.ink(.035+(i%4)*.008);c.lineWidth=.75;c.stroke();
                c.beginPath();c.moveTo(w*.75,h*.43);
                c.bezierCurveTo(w*.88,h*(.25+i*.012),w*.94,h*(.04+i*.025),w+30,h*(i*.026));c.stroke();
            }
            this.brainMix=M.brainTransition(this.networkTime);
            if(this.brainMesh?.draw(c,w,h,this.time,rx,ry,this.brainMix,this.stimulusAge))return;
            if(this.fallback.complete&&this.fallback.naturalWidth){
                const fw=scale*540,fh=fw*340/510;
                c.drawImage(this.fallback,(mobile?w*.5:w*.68)-fw/2,(mobile?h*.57:h*.46)-fh/2,fw,fh);
            }
        }

        waves() { window.StateExperience.draw(this); }
        cranialWindow(x,y,width,height) {
            const c=this.ctx,m=this.mouse,r=Math.min(width,height)*.46,cx=x+width/2,cy=y+height/2;
            c.save();
            const rim=c.createRadialGradient(cx-r*.3,cy-r*.4,r*.4,cx,cy,r*1.05);
            rim.addColorStop(0,'#55675b');rim.addColorStop(.86,'#839381');rim.addColorStop(.93,'#d1d7c6');rim.addColorStop(1,'#526654');
            this.circle(cx,cy,r*1.04,1,rim);
            this.circle(cx,cy,r,1,'#11231c');
            c.beginPath();c.arc(cx,cy,r*.94,0,TAU);c.strokeStyle='#afc4a647';c.lineWidth=1;c.stroke();
            const scale=r*1.65/100,ox=cx-50*scale,oy=cy-49*scale;
            c.translate(ox,oy);c.scale(scale,scale);
            if(!this.mouseCortex){
                c.save();c.setTransform(1,0,0,1,0,0);
                this.mouseCortex=new Path2D('M50 15C41 2 30 8 21 21C12 33 7 53 7 72C6 88 17 93 31 89C42 87 48 78 50 69C52 78 60 87 72 89C85 93 95 87 94 73C94 53 87 33 78 21C69 8 58 2 50 15Z');
                const random=M.randomSource(2913);this.cortexGrain=[];this.opticalSites=[];
                for(let i=0;i<1000;i++){
                    const px=7+random()*87,py=7+random()*85;
                    if(c.isPointInPath(this.mouseCortex,px,py))this.cortexGrain.push({x:px,y:py,r:.16+random()*.35,a:.04+random()*.1});
                }
                for(let i=0;i<m.cells.length;i++){
                    let px,py;
                    for(let attempt=0;attempt<200;attempt++){px=12+random()*77;py=12+random()*72;if(c.isPointInPath(this.mouseCortex,px,py))break;}
                    this.opticalSites.push({x:px,y:py});
                }
                c.restore();
            }
            c.fillStyle='#263b2d';c.fill(this.mouseCortex);
            c.save();c.clip(this.mouseCortex);
            // Broad calcium domains follow the same event kinetics; texture stays within cortex.
            m.cells.forEach((cell,i)=>{
                const p=this.opticalSites[i],activity=Math.min(1,cell.fluorescence/.45),radius=6+cell.radius*1.4;
                const glow=c.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);
                glow.addColorStop(0,`rgba(226,237,193,${.045+activity*.82})`);
                glow.addColorStop(.32,`rgba(169,204,131,${.025+activity*.53})`);
                glow.addColorStop(1,'rgba(124,173,104,0)');
                this.circle(p.x,p.y,radius,1,glow);
            });
            this.cortexGrain.forEach(p=>this.circle(p.x,p.y,p.r,p.a,'rgba(217,233,189,'+p.a+')'));
            const vessels=['M30 16C34 26 22 36 25 47S18 71 17 81','M24 43L13 36M25 56L36 65','M72 17C65 29 78 37 73 53S86 74 80 85','M74 43L86 35M73 60L61 70'];
            c.strokeStyle='rgba(10,23,16,.37)';c.lineWidth=.55;vessels.forEach(d=>c.stroke(new Path2D(d)));
            c.restore();c.strokeStyle='#c6d4b395';c.lineWidth=.75;c.stroke(this.mouseCortex);
            c.beginPath();c.moveTo(50,16);c.bezierCurveTo(47,32,52,50,50,69);c.strokeStyle='#c6d4b365';c.lineWidth=.55;c.stroke();
            // ROI 1–8 outlines match the ΔF/F rows; the remaining domains stay unlabelled.
            const rois=this.opticalSites.slice(0,8).map(p=>({x:ox+p.x*scale,y:oy+p.y*scale}));
            c.restore();
            const small=r<90;
            rois.forEach((p,i)=>{
                const active=Math.min(1,m.cells[i].fluorescence/.45);
                c.beginPath();c.arc(p.x,p.y,small?4.5:7,0,TAU);c.strokeStyle=`rgba(243,227,176,${.45+active*.5})`;c.lineWidth=.9;c.stroke();
                if(!small||i<4)this.text(String(i+1),p.x+(small?6:9),p.y-(small?4:6),small?8:9,.85,'left','#f3e3b0');
            });
            const bar=r*1.65/100*20;
            this.line(cx+r*.42-bar/2,cy+r*.86,cx+r*.42+bar/2,cy+r*.86,.85,1.5);
            this.text('1 mm',cx+r*.42,cy+r*.86+11,small?8:9,.7,'center');
        }
        topView(x,y,side) {
            const c=this.ctx,m=this.mouse,small=side<260;
            const map=p=>({x:x+p.x*side,y:y+p.y*side});
            c.save();
            c.beginPath();c.roundRect(x,y,side,side,4);c.fillStyle='#0d2f21';c.fill();c.strokeStyle=this.ink(.35);c.lineWidth=1;c.stroke();
            c.clip();
            for(let i=1;i<4;i++){this.line(x+i*side/4,y,x+i*side/4,y+side,.06,.7);this.line(x,y+i*side/4,x+side,y+i*side/4,.06,.7);}
            // Objects share collision geometry with the model.
            m.obstacles.forEach((o,i)=>{
                const p=map(o);c.beginPath();
                if(o.shape==='block')c.rect(p.x-o.r*side*.72,p.y-o.r*side*.72,o.r*side*1.44,o.r*side*1.44);else c.arc(p.x,p.y,o.r*side,0,TAU);
                c.fillStyle=this.ink(.07);c.fill();c.strokeStyle=this.ink(.32);c.lineWidth=.9;c.stroke();
                this.text('物体 '+'ABC'[i],p.x,p.y+3,small?8:9,.5,'center');
            });
            // Trajectory: older samples fade.
            m.trail.forEach((p,i)=>{if(!i)return;const a=map(m.trail[i-1]),b=map(p);this.line(a.x,a.y,b.x,b.y,.05+i/m.trail.length*.45,1.1,`rgba(185,238,208,${.05+i/m.trail.length*.5})`);});
            // Top-view silhouette under the pose overlay.
            const k=m.pose(),P=Object.fromEntries(Object.entries(k).map(([n,v])=>[n,map(v)]));
            const unit=side,heading=m.heading,headAngle=m.heading+m.head;
            c.fillStyle='rgba(222,228,212,.82)';
            c.beginPath();c.ellipse(P.center.x,P.center.y,.05*unit,.029*unit,heading,0,TAU);c.fill();
            c.beginPath();c.ellipse((P.neck.x+P.nose.x)/2,(P.neck.y+P.nose.y)/2,.03*unit,.019*unit,headAngle,0,TAU);c.fill();
            for(const ear of [P.earL,P.earR]){c.beginPath();c.arc(ear.x,ear.y,.008*unit,0,TAU);c.fill();}
            c.beginPath();m.tail.forEach((p,i)=>{const q=map(p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});
            c.strokeStyle='rgba(222,228,212,.6)';c.lineWidth=Math.max(1,.0045*unit);c.lineCap='round';c.stroke();
            // Skeleton and keypoints, as reported by a pose estimator.
            const bones=[['nose','neck'],['earL','neck'],['earR','neck'],['neck','center'],['center','tailBase'],['tailBase','tailMid'],['tailMid','tailTip']];
            bones.forEach(([a,b])=>this.line(P[a].x,P[a].y,P[b].x,P[b].y,1,1.1,'rgba(18,52,38,.9)'));
            bones.forEach(([a,b])=>this.line(P[a].x,P[a].y,P[b].x,P[b].y,1,.8,'#f3e3b0'));
            const colors={nose:'#f3e3b0',earL:'#8fc3e8',earR:'#8fc3e8',neck:'#b9eed0',center:'#b9eed0',tailBase:'#e2ba77',tailMid:'#e2ba77',tailTip:'#e2ba77'};
            Object.entries(P).forEach(([n,p])=>{this.circle(p.x,p.y,small?2.2:3,1,'#0d2f21');this.circle(p.x,p.y,small?1.5:2.1,1,colors[n]);});
            // Detection box with confidence.
            const xs=Object.values(P).map(p=>p.x),ys=Object.values(P).map(p=>p.y),margin=.018*unit;
            const bx=Math.min(...xs)-margin,by=Math.min(...ys)-margin,bw=Math.max(...xs)-bx+margin,bh=Math.max(...ys)-by+margin;
            c.setLineDash([3,3]);c.strokeStyle='#b9eed0aa';c.lineWidth=.9;c.strokeRect(bx,by,bw,bh);c.setLineDash([]);
            const confidence=(.955+.035*(.5+.5*Math.sin(m.time*1.7))).toFixed(2);
            const tag=`mouse ${confidence}`;c.font=`${small?8:9}px -apple-system, BlinkMacSystemFont, sans-serif`;const tw=c.measureText(tag).width+8;
            c.fillStyle='#b9eed0';c.fillRect(bx,by-(small?12:14),tw,small?12:14);this.text(tag,bx+4,by-(small?3:4),small?8:9,1,'left','#0d2f21');
            c.restore();
            // 40 cm arena: 10 cm scale bar.
            this.line(x+side-side/4-8,y+side+12,x+side-8,y+side+12,.8,1.5);
            this.text('10 cm',x+side-side/8-8,y+side+24,small?8:9,.65,'center');
        }
        behavior() {
            const c=this.ctx,w=this.w,h=this.h,m=this.mouse,mobile=w<721;
            const pad=mobile?16:Math.max(28,w*.035),now=m.time,windowS=8;
            const names={explore:'探索',dart:'疾跑',sniff:'嗅探',investigate:'物体探究',groom:'理毛',pause:'静止'};
            const colors={explore:'#9fd8b4',dart:'#e2ba77',sniff:'#8fc3e8',investigate:'#f3e3b0',groom:'#c9a2d6',pause:'#5f8571'};
            const action=m.investigating?'investigate':m.action;
            let S,R0,R1,stackTop,D,bx,by;
            if(mobile){
                S=Math.min(w*.56,h*.42);R0=pad;R1=w-pad;
                D=Math.min(R1-(pad+S+12),S*.82);bx=R1-D;by=26;
                stackTop=26+S+48;
            }else{
                S=Math.min(h-58,(w-pad*2)*.4);R0=pad+S+Math.max(40,w*.035);R1=w-pad;
                D=Math.min(h*.36,(R1-R0)*.36);bx=R0;by=30;stackTop=by+D+56;
            }
            // a · Top-view camera with pose estimation.
            this.panelLabel('a','俯视相机 · 姿态估计',pad,16);
            if(!mobile)this.text('8 keypoints · 30 fps',pad+S,16,10,.5,'right');
            this.topView(pad,26,S);
            // b · Widefield calcium imaging through the cranial window.
            this.panelLabel('b',mobile?'宽场钙成像':'宽场钙成像 · GCaMP',bx,by-10);
            this.cranialWindow(bx,by,D,D);
            // Readout of the shared clock.
            if(!mobile){
                const active=m.cells.filter(cell=>cell.fluorescence>.15).length;
                const rows=[['行为状态',names[action]],['速度',`${(m.speed*40).toFixed(1)} cm/s`],['头部角速度',`${Math.round(Math.abs(m.angularSpeed)*180/Math.PI)} °/s`],['活跃 ROI',`${active} / ${m.cells.length}`],['同步时钟',`t = ${now.toFixed(2)} s`]];
                const rx=bx+D+Math.max(28,w*.025),rowH=Math.min(34,D/6);
                rows.forEach(([label,value],i)=>{
                    const y=by+18+i*rowH;
                    this.text(label,rx,y,11,.55);this.text(value,R1,y,13,.92,'right');
                    if(i===0){c.font='13px -apple-system, BlinkMacSystemFont, "LXGWWenKai", sans-serif';c.fillStyle=colors[action];c.fillRect(R1-c.measureText(value).width-16,y-9,9,9);}
                    this.line(rx,y+rowH*.42,R1,y+rowH*.42,.08,.6);
                });
            }
            // c–f share one time axis over the last 8 s.
            const labelW=mobile?34:52,x0=R0+labelW,x1=R1,tx=t=>x1-(now-t)/windowS*(x1-x0);
            const roiCount=mobile?6:8,cellCount=mobile?12:24;
            const avail=h-stackTop-28;
            const ethoH=mobile?9:11,speedH=avail*.14,roiH=avail*.38,rasterH=avail*.2,gap=(avail-ethoH-speedH-roiH-rasterH)/3;
            const cY=stackTop,dY=cY+ethoH+gap,eY=dY+speedH+gap,fY=eY+roiH+gap;
            for(let t=Math.ceil(now-windowS);t<=now;t++){if(t%2)continue;this.line(tx(t),cY-4,tx(t),fY+rasterH,.05,.7);}
            // c · Ethogram.
            this.panelLabel('c','行为分期',R0,cY-8);
            if(!mobile){
                let lx=x1;c.font='9px -apple-system, BlinkMacSystemFont, "LXGWWenKai", sans-serif';
                for(const key of ['pause','groom','investigate','sniff','dart','explore']){const tw=c.measureText(names[key]).width;lx-=tw;this.text(names[key],lx,cY-8,9,.65);lx-=12;c.fillStyle=colors[key];c.fillRect(lx,cY-15,8,8);lx-=14;}
            }
            m.history.forEach((p,i)=>{const q=m.history[i+1];const xa=tx(p.t),xb=q?tx(q.t):x1;c.fillStyle=colors[p.action];c.fillRect(xa,cY,xb-xa+.5,ethoH);});
            // d · Speed.
            this.panelLabel('d','速度',R0,dY-6);
            const maxSpeed=12,sy=v=>dY+speedH-Math.min(1,v/maxSpeed)*speedH;
            this.line(x0,dY+speedH,x1,dY+speedH,.2,.7);this.text('12',x0-6,dY+8,8,.5,'right');this.text('0',x0-6,dY+speedH+3,8,.5,'right');
            if(!mobile)this.text('cm/s',x0-6,dY+speedH*.55,8,.45,'right');
            c.beginPath();m.history.forEach((p,i)=>{const x=tx(p.t),y=sy(p.speed*40);i?c.lineTo(x,y):c.moveTo(x,y);});c.strokeStyle='#b9eed0';c.lineWidth=1.3;c.stroke();
            // e · ΔF/F for ROI 1–8, matching the outlines in b.
            this.panelLabel('e','ΔF/F',R0,eY-6);
            const rowH=roiH/roiCount;
            for(let r=0;r<roiCount;r++){
                const base=eY+rowH*(r+1)-2;
                this.text(String(r+1),x0-6,base,8,.6,'right','#f3e3b0');
                c.beginPath();m.history.forEach((p,i)=>{const x=tx(p.t),y=base-Math.min(1,p.rois[r]/.5)*rowH*.78;i?c.lineTo(x,y):c.moveTo(x,y);});
                c.strokeStyle=r%2?'#e2ba77':'#efcf95';c.lineWidth=1;c.stroke();
            }
            const barTop=eY+rowH*.2;this.line(x1+8,barTop,x1+8,barTop+rowH*.9,.7,1.3);
            if(!mobile)this.text('50%',x1+12,barTop+rowH*.5,8,.6);
            // f · Event raster for the modelled cells.
            this.panelLabel('f','神经事件',R0,fY-6);
            const cellH=rasterH/cellCount;
            this.text('1',x0-6,fY+cellH,8,.5,'right');this.text(String(cellCount),x0-6,fY+rasterH,8,.5,'right');
            m.events.forEach(event=>{if(event.cell>=cellCount)return;const x=tx(event.t),y=fY+event.cell*cellH;this.line(x,y+cellH*.1,x,y+cellH*.9,.85,1.1,event.cell<roiCount?'#f3e3b0':null);});
            // Time axis and cursor at the present sample.
            const axisY=fY+rasterH+6;
            for(let t=0;t<=windowS;t+=2){const x=x1-t/windowS*(x1-x0);this.line(x,axisY,x,axisY+4,.5,.8);this.text(t?`−${t} s`:'0 s',x,axisY+15,9,.6,t===windowS?'left':t?'center':'right');}
            this.line(x1,cY-4,x1,fY+rasterH,.6,1);
        }
    }
    window.ResearchScenes=ResearchScenes;
})();
