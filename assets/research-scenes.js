/* Research visual rendering; MRI-derived brain attribution: brain/README.md. */
(() => {
    'use strict';
    const M = window.ResearchModels, TAU=Math.PI*2;

    class ResearchScenes {
        constructor(ctx) {
            this.ctx=ctx; this.time=0; this.hour=9.25; this.stimulusAge=100; this.networkTime=0;this.brainMix=0;this.plan={coffee:14,sleep:23,meal:19};
            this.mouse=new M.BehaviorModel(Math.floor(Math.random()*0xFFFFFFFF));
            this.mouse.advance(2.5);
            this.mouseRenderer=new window.MouseRenderer();
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
        mouseArena(x,y,width,height) {
            const c=this.ctx,m=this.mouse;
            const wide=width/height>1.45,yaw=wide?-.17:-.28,cy=Math.cos(yaw),sy=Math.sin(yaw),tilt=wide?.48:.70,lift=Math.sqrt(1-tilt*tilt);
            const unit=Math.min((width-12)/(cy+Math.abs(sy)+.04),(height-24)/((cy+Math.abs(sy))*tilt+.15));
            const cx=x+width/2,cyScreen=y+height*.54;
            const project=p=>{
                const u=(p.x-.5)*cy-(p.y-.5)*sy,v=(p.x-.5)*sy+(p.y-.5)*cy;
                return {x:cx+u*unit,y:cyScreen+(v*tilt-p.z*lift)*unit,depth:v*lift+p.z*tilt};
            };
            const polygon=(points,fill,stroke)=>{
                c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();
                c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.7;c.stroke();}
            };
            const floor=[{x:0,y:0,z:0},{x:1,y:0,z:0},{x:1,y:1,z:0},{x:0,y:1,z:0}];
            const floorPoints=floor.map(project);
            c.save();c.beginPath();c.rect(x,y,width,height);c.clip();
            // An oblique floor, raised back rim and front thickness anchor the animal in space.
            polygon([floorPoints[3],floorPoints[2],project({...floor[2],z:-.045}),project({...floor[3],z:-.045})],'#102e23');
            polygon([floorPoints[0],floorPoints[3],project({...floor[3],z:-.045}),project({...floor[0],z:-.045})],'#0c291e');
            const ground=c.createLinearGradient(cx,y,cx,y+height);ground.addColorStop(0,'#285b42');ground.addColorStop(1,'#103b2a');
            polygon(floorPoints,ground,this.ink(.24));
            for(let i=1;i<8;i++){
                for(const pair of [[{x:i/8,y:0,z:.001},{x:i/8,y:1,z:.001}],[{x:0,y:i/8,z:.001},{x:1,y:i/8,z:.001}]]){
                    const [a,b]=pair.map(project);this.line(a.x,a.y,b.x,b.y,.09,.65);
                }
            }
            for(const [i,j] of [[0,1],[1,2]])polygon([floorPoints[i],floorPoints[j],project({...floor[j],z:.065}),project({...floor[i],z:.065})],'rgba(152,215,163,.08)',this.ink(.2));
            m.trail.forEach((p,i)=>{if(!i)return;const a=project({...m.trail[i-1],z:.002}),b=project({...p,z:.002});this.line(a.x,a.y,b.x,b.y,.025+i/m.trail.length*.17,.8);});
            // Sparse light packets follow the actual recent trajectory.
            m.trail.forEach((p,i)=>{if(i%17)return;const q=project({...p,z:.007});this.circle(q.x,q.y,1.8,.15+i/m.trail.length*.50);});
            this.mouseAnchor=project({x:m.x,y:m.y,z:.10});
            const size=M.clamp(12/unit,.067,.095);
            const moving=Math.min(1,m.speed/.045),bob=Math.abs(Math.sin(m.gait))*.045*moving+Math.sin(m.time*4.3)*.015;
            const bodyAngle=m.heading,headAngle=m.heading+m.head;
            const local=(a,b,z,angle=bodyAngle,origin=m)=>({x:origin.x+(a*Math.cos(angle)-b*Math.sin(angle))*size,y:origin.y+(a*Math.sin(angle)+b*Math.cos(angle))*size,z:z*size});
            // Contact shadow follows the same ground transform as the animal and its path.
            const silhouette=[];
            for(let i=0;i<40;i++)silhouette.push(project(local(-.12+Math.cos(i/40*TAU)*1.43,Math.sin(i/40*TAU)*.66,.012)));
            c.save();c.shadowColor='rgba(36,48,31,.18)';c.shadowBlur=unit*size*.3;
            polygon(silhouette,'rgba(5,19,13,.24)');c.restore();
            const contact=[];for(let i=0;i<32;i++)contact.push(project(local(-.2+Math.cos(i/32*TAU)*1.0,Math.sin(i/32*TAU)*.43,.018)));
            polygon(contact,'rgba(5,19,13,.28)');
            if(this.mouseRenderer.ready){
                for(const o of m.obstacles){
                    const shadow=[];for(let i=0;i<48;i++){const a=i/48*TAU;shadow.push(project({x:o.x+Math.cos(a)*o.r*1.04+.014,y:o.y+Math.sin(a)*o.r*1.03+.02,z:.001}));}
                    c.save();c.shadowColor='#081c17aa';c.shadowBlur=unit*.016;polygon(shadow,'rgba(4,20,14,.24)');c.restore();
                }
                const drawn=this.mouseRenderer.draw(c,{width:this.w,height:this.h,unit,cx,cy:cyScreen,yaw,tilt},m,size);
                if(drawn){this.line(floorPoints[3].x,floorPoints[3].y,floorPoints[2].x,floorPoints[2].y,.24,1);c.restore();return;}
            }
            const faces=[];
            // Objects share the mouse's projection, lighting, depth ordering and collision coordinates.
            for(const object of m.obstacles){
                const count=object.shape==='block'?4:24;
                const radius=object.r,top=[],base=[];
                for(let i=0;i<count;i++){
                    const a=i/count*TAU+(object.shape==='block'?Math.PI/4:0);
                    const p={x:object.x+Math.cos(a)*radius,y:object.y+Math.sin(a)*radius,z:0};
                    base.push(project(p));top.push(project({...p,z:object.height}));
                }
                c.save();c.shadowColor='rgba(35,58,37,.2)';c.shadowBlur=unit*.018;c.shadowOffsetY=unit*.012;
                polygon(base,'rgba(36,58,35,.12)');c.restore();
                const center=project({x:object.x,y:object.y,z:object.height});
                for(let i=0;i<count;i++){
                    const j=(i+1)%count,angle=(i+.5)/count*TAU;
                    const shade=.67+.20*Math.cos(angle+1.8);
                    const color=object.shape==='block'?[162,170,139]:object.id==='pillar'?[133,158,126]:[192,185,154];
                    const side=[base[i],base[j],top[j],top[i]];
                    faces.push({points:side,depth:side.reduce((v,p)=>v+p.depth,0)/4,color:`rgb(${color.map(v=>Math.round(v*shade)).join(',')})`});
                    const cap=[top[i],top[j],center];
                    faces.push({points:cap,depth:cap.reduce((v,p)=>v+p.depth,0)/3,color:object.shape==='block'?'#b4bc9b':object.id==='pillar'?'#9ab38e':'#c3bea4'});
                }
            }

            const mesh=(center,radii,angle,palette,segments=18,rings=10)=>{
                if(width<230){segments=Math.max(8,Math.round(segments*.72));rings=Math.max(6,Math.round(rings*.72));}
                const ca=Math.cos(angle),sa=Math.sin(angle),vertices=[];
                for(let j=0;j<=rings;j++){
                    const latitude=-Math.PI/2+j/rings*Math.PI;
                    for(let i=0;i<=segments;i++){
                        const longitude=i/segments*TAU;
                        const nx=Math.cos(latitude)*Math.cos(longitude),ny=Math.cos(latitude)*Math.sin(longitude),nz=Math.sin(latitude);
                        const dx=nx*radii[0]*size,dy=ny*radii[1]*size;
                        const p={x:center.x+dx*ca-dy*sa,y:center.y+dx*sa+dy*ca,z:center.z+nz*radii[2]*size};
                        // Ellipsoid normals produce fixed world lighting as the mouse turns.
                        let normalX=nx/radii[0],normalY=ny/radii[1],normalZ=nz/radii[2];
                        const length=Math.hypot(normalX,normalY,normalZ);normalX/=length;normalY/=length;normalZ/=length;
                        const wx=normalX*ca-normalY*sa,wy=normalX*sa+normalY*ca;
                        const nu=wx*cy-wy*sy,nv=wx*sy+wy*cy;
                        vertices.push({...project(p),light:Math.max(0,-nu*.42-nv*.32+normalZ*.85),visible:nv*lift+normalZ*tilt});
                    }
                }
                for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
                    const a=j*(segments+1)+i,b=a+1,d=a+segments+1,e=d+1;
                    for(const ids of [[a,b,e],[a,e,d]]){
                        const points=ids.map(k=>vertices[k]);if(points.reduce((v,p)=>v+p.visible,0)<=0)continue;
                        const light=points.reduce((v,p)=>v+p.light,0)/3,shade=.59+light*.41;
                        faces.push({depth:points.reduce((v,p)=>v+p.depth,0)/3,points,color:`rgb(${palette.map(v=>Math.round(v*shade)).join(',')})`});
                    }
                }
            };
            const segment=(a,b,color,weight)=>{
                const p=project(a),q=project(b);faces.push({depth:(p.depth+q.depth)/2,line:[p,q],color,weight});
            };
            // Flexible tail retains the physical chain, with a raised root and a tapered tip.
            const tail=m.tail.map((p,i)=>({x:m.x+(p.x-m.x)*size/.055,y:m.y+(p.y-m.y)*size/.055,z:size*(.35*Math.exp(-i*.52)+.04+Math.sin(m.time*3-i*.7)*.022*i/8)}));
            tail.slice(1).forEach((p,i)=>{
                const thickness=Math.max(.65,(1-i/9)*unit*size*.16);
                segment(tail[i],p,'#978c78',thickness+1);segment({...tail[i],z:tail[i].z+.002},{...p,z:p.z+.002},'#c6b49b',thickness);
            });
            // Feet alternate in depth and lift; grooming brings the forepaws toward the snout.
            for(const side of [-1,1])for(const front of [false,true]){
                const phase=m.gait+(front?0:Math.PI)+side*Math.PI/2;
                const stride=Math.sin(phase)*.24*moving;
                let fx=(front?.48:-.8)+stride,fy=side*.48,fz=.09+Math.max(0,Math.cos(phase))*.17*moving;
                if(front&&m.action==='groom'){fx=1.0;fy=side*.2;fz=.52+Math.sin(m.time*13)*.09;}
                mesh(local(fx,fy,fz),[.26,.14,.09],bodyAngle,[188,172,149],12,6);
                if(!front)mesh(local(fx-.1,fy*.75,.29+bob),[.38,.26,.31],bodyAngle,[206,206,187],14,8);
            }
            mesh(local(-.28,0,.57+bob),[1.0,.57,.56],bodyAngle,[225,223,205],24,14);
            const neck=local(.43,0,0);
            const head=(a,b,z)=>local(a,b,z,headAngle,neck);
            mesh(head(.31,0,.68+bob),[.55,.40,.40],headAngle,[233,229,211],20,12);
            mesh(head(.66,0,.51+bob),[.43,.255,.24],headAngle,[228,220,200],18,10);
            for(const side of [-1,1]){
                mesh(head(.06,side*.34,1.03+bob),[.25,.11,.32],headAngle,[205,201,182],18,12);
                mesh(head(.07,side*.40,1.04+bob),[.175,.046,.225],headAngle,[211,172,156],16,10);
                mesh(head(.54,side*.303,.78+bob),[.069,.053,.076],headAngle,[43,47,36],12,8);
                mesh(head(.54,side*.318,.81+bob),[.021,.017,.025],headAngle,[250,250,233],8,6);
                for(let k=0;k<3;k++){
                    segment(head(.88,side*.13,.53+bob),head(1.03+(k-1)*.14,side*(.52+k*.075),.54+bob+Math.sin(m.time*8+k)*.025),'rgba(82,91,70,.65)',.55);
                }
            }
            mesh(head(1.06,0,.51+bob),[.09,.10,.08],headAngle,[154,116,99],12,8);
            // Painter sorting handles every heading: near paws, ears and snout occlude naturally.
            faces.sort((a,b)=>a.depth-b.depth);
            c.lineJoin='round';c.lineCap='round';
            for(const face of faces){
                if(face.line){const [a,b]=face.line;this.line(a.x,a.y,b.x,b.y,1,face.weight,face.color);}
                else{polygon(face.points,face.color);c.strokeStyle=face.color;c.lineWidth=.35;c.stroke();}
            }
            // A low front rim supplies a foreground depth cue without hiding the animal.
            this.line(floorPoints[3].x,floorPoints[3].y,floorPoints[2].x,floorPoints[2].y,.24,1);
            c.restore();
        }
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
            c.restore();
            this.text('Ca²⁺',cx+r*.65,cy+r*.82,9,.8,'center','#c9dbb7');
        }
        behavior() {
            const c=this.ctx,w=this.w,h=this.h,m=this.mouse,mobile=w<721;
            const pad=mobile?18:Math.max(28,w*.035);
            const label=m.investigating?'物体嗅探':{pause:'停留',sniff:'嗅探',groom:'梳理',dart:'短跑',explore:'探索'}[m.action];
            // The arena is the scene. Measurements float around it without splitting it into columns.
            this.mouseArena(mobile?-12:-w*.01,mobile?h*.11:0,mobile?w+24:w*1.02,mobile?h*.78:h*.99);
            if(!mobile&&this.mouseAnchor){
                const a=this.mouseAnchor;
                c.beginPath();c.ellipse(a.x,a.y+16,Math.min(66,w*.055),Math.min(27,w*.023),-.18,0,TAU);c.setLineDash([3,6]);c.strokeStyle='#b3e8c148';c.lineWidth=.8;c.stroke();c.setLineDash([]);
            }
            this.text('行为追踪',pad,28,mobile?16:20,.95);
            this.circle(pad+4,49,2.5,.65);
            this.text(label,pad+14,53,mobile?10:12,.7);
            const diameter=mobile?Math.min(166,w*.43):Math.min(356,w*.36,h*.49);
            const ix=w-pad-diameter,iy=mobile?12:18;
            if(!mobile&&this.mouseAnchor){
                const a=this.mouseAnchor,b={x:ix+diameter*.14,y:iy+diameter*.72};
                const p={x:a.x+(b.x-a.x)*.28,y:a.y-100},q={x:b.x-95,y:b.y+60};
                c.beginPath();c.moveTo(a.x,a.y);c.bezierCurveTo(p.x,p.y,q.x,q.y,b.x,b.y);c.strokeStyle='#b9eed038';c.lineWidth=.85;c.stroke();
                for(let i=0;i<3;i++){const t=(m.time*.16+i/3)%1,u=1-t,px=u*u*u*a.x+3*u*u*t*p.x+3*u*t*t*q.x+t*t*t*b.x,py=u*u*u*a.y+3*u*u*t*p.y+3*u*t*t*q.y+t*t*t*b.y;this.circle(px,py,2,.75);}
            }
            c.save();c.shadowColor='rgba(39,63,44,.15)';c.shadowBlur=22;c.shadowOffsetY=8;
            this.cranialWindow(ix,iy+20,diameter,diameter);c.restore();
            this.text('光学颅窗',ix+diameter/2,iy+12,mobile?12:15,.9,'center');
            // Subtle translucent instruments sit beyond the animal's main activity area.
            const panel=(x,y,width,height)=>{
                c.save();c.shadowColor='rgba(30,52,34,.08)';c.shadowBlur=20;c.shadowOffsetY=5;
                c.beginPath();c.roundRect(x,y,width,height,12);c.fillStyle='rgba(10,40,29,.88)';c.fill();c.restore();
                c.strokeStyle='rgba(158,212,170,.30)';c.lineWidth=.7;c.stroke();
            };
            const rw=mobile?Math.min(176,w*.44):Math.min(350,w*.34),rh=mobile?120:172,rx=pad,ry=mobile?82:101;
            panel(rx,ry,rw,rh);this.text('神经事件',rx+16,ry+25,mobile?12:15,.9);
            const rasterX=rx+16,rasterW=rw-32,rasterY=ry+46,rasterH=rh-65;
            for(let i=0;i<6;i++)this.line(rasterX,rasterY+i*rasterH/5,rasterX+rasterW,rasterY+i*rasterH/5,.10,.6);
            m.events.forEach(event=>{
                if(event.cell>=6)return;
                const px=rasterX+rasterW*(1-(m.time-event.t)/8),py=rasterY+event.cell*rasterH/5;
                this.line(px,py-3,px,py+3,.8,1.1);
            });
            const tw=mobile?w-pad*2:Math.min(610,w*.61),th=mobile?136:186,tx=w-pad-tw,ty=h-th-12;
            panel(tx,ty,tw,th);this.text('同步时间轴',tx+17,ty+28,mobile?12:15,.9);
            this.text(`t = ${m.time.toFixed(1)} s`,tx+tw-17,ty+28,mobile?10:12,.75,'right');
            const x0=tx+(mobile?52:65),x1=tx+tw-18;
            const rows=[{key:'speed',label:'速度',max:.38,color:'#b9eed0'},{key:'calcium',label:'Ca²⁺',max:.65,color:'#e2ba77'}];
            rows.forEach((row,i)=>{
                const base=ty+(mobile?66:83)+i*(mobile?35:53);
                this.text(row.label,tx+17,base+2,mobile?10:12,.8);this.line(x0,base,x1,base,.12,.7);
                c.beginPath();c.strokeStyle=row.color;c.lineWidth=1.65;
                m.history.forEach((p,k)=>{
                    const px=x0+(x1-x0)*(1-(m.time-p.t)/8),py=base-Math.min(1,p[row.key]/row.max)*(mobile?25:36);
                    if(!k)c.moveTo(px,py);else c.lineTo(px,py);
                });c.stroke();
            });
            this.text('−8 s',x0,ty+th-12,mobile?9:11,.65);this.text('现在',x1,ty+th-12,mobile?9:11,.65,'right');
        }

    }
    window.ResearchScenes=ResearchScenes;
})();
