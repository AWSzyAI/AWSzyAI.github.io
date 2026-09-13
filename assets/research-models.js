/* Illustrative models for the homepage, not fitted experimental or clinical models. */
(function (root) {
    'use strict';
    const TAU = Math.PI * 2;
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    const blend = (a, b, t) => a + (b - a) * t;
    const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
    function randomSource(seed) {
        return () => {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    // Relative model features, not measured EEG or diagnostic thresholds.
    const states = {
        nrem: { label: 'NREM 睡眠', short: '睡眠', arousal: .13, attention: .08, aVariation: .025, tVariation: .018, detail: '觉醒与注意都处于低位' },
        rem: { label: 'REM 睡眠', short: '睡眠', arousal: .30, attention: .12, aVariation: .055, tVariation: .025, detail: '睡眠阶段转换，觉醒出现起伏' },
        drowsy: { label: '困倦', short: '困倦', arousal: .42, attention: .30, aVariation: .095, tVariation: .11, detail: '觉醒回落，注意间歇波动' },
        awake: { label: '清醒', short: '清醒', arousal: .75, attention: .62, aVariation: .04, tVariation: .065, detail: '维持清醒，注意随时间变化' },
        focused: { label: '高度专注', short: '专注', arousal: .84, attention: .93, aVariation: .022, tVariation: .025, detail: '注意保持高位，波动收敛' },
        distracted: { label: '注意游移', short: '游移', arousal: .73, attention: .43, aVariation: .04, tVariation: .19, detail: '保持清醒，注意反复起伏' },
        fog: { label: '脑雾', short: '脑雾', arousal: .60, attention: .25, aVariation: .055, tVariation: .085, detail: '仍有觉醒，注意低位徘徊' },
        alert: { label: '高度清醒', short: '清醒', arousal: .94, attention: .74, aVariation: .025, tVariation: .075, detail: '觉醒升至高位，注意独立变化' }
    };
    const schedule = [[0,'nrem'],[1.7,'rem'],[2.3,'nrem'],[3.7,'rem'],[4.3,'nrem'],[5.7,'drowsy'],[7,'awake'],[8.5,'focused'],[10.5,'distracted'],[11.8,'fog'],[13,'drowsy'],[14,'awake'],[15.5,'focused'],[17,'alert'],[18.5,'awake'],[20.5,'drowsy'],[22,'nrem']];
    function stateAt(hour) {
        hour = clamp(hour, 0, 24);
        let index = 0;
        schedule.forEach((entry, i) => { if (hour >= entry[0]) index = i; });
        const key = schedule[index][1], current = states[key];
        const previous = states[schedule[(index + schedule.length - 1) % schedule.length][1]];
        const mix = smooth((hour - schedule[index][0]) / .32);
        const result = { key, label: current.label, detail: current.detail, index };
        for (const property of ['arousal','attention','aVariation','tVariation']) result[property] = blend(previous[property], current[property], mix);
        return result;
    }
    function stateSignal(hour) {
        const s = stateAt(hour);
        // Independent multiscale fluctuations; state transitions shape both level and variability.
        const a = .52*Math.sin(hour*11.3) + .28*Math.sin(hour*27.1+.8) + .20*Math.sin(hour*61.7);
        const t = .50*Math.sin(hour*17.9+1.4) + .32*Math.sin(hour*39.3) + .18*Math.sin(hour*83.1+.3);
        return {
            arousal: clamp(s.arousal + a*s.aVariation, 0, 1),
            attention: clamp(s.attention + t*s.tVariation, 0, 1)
        };
    }
    // Artistic transition timing and qualitative planning curves, not fitted health predictions.
    function brainTransition(seconds) {
        const phase=((seconds%28)+28)%28;
        return smooth((phase-7)/3)*(1-smooth((phase-19)/3));
    }
    function forecastSignal(hour,origin,plan={coffee:14,sleep:23,meal:19}) {
        const current=stateSignal(((hour%24)+24)%24);
        if(hour<=origin)return {...current,uncertainty:0};
        const horizon=hour-origin,weight=smooth(horizon/1.3);
        const bedtime=clamp(Number(plan.sleep),21,25),coffee=clamp(Number(plan.coffee),8,18),meal=clamp(Number(plan.meal),17,22);
        const sinceCoffee=hour-coffee;
        const stimulation=sinceCoffee>0?.14*smooth(sinceCoffee/.6)*Math.exp(-sinceCoffee/4):0;
        const lateMeal=.07*Math.exp(-Math.pow((hour-meal-1.2)/1.8,2));
        const night=smooth((hour-bedtime+.2)/1.4);
        const shifted=stateSignal(((hour+(22-bedtime)*smooth((hour-19)/3))%24+24)%24);
        const arousal=blend(shifted.arousal,.12,night)+stimulation-lateMeal*.5;
        const attention=blend(shifted.attention,.07,night)+stimulation*.6-lateMeal;
        return {arousal:clamp(blend(current.arousal,arousal,weight),0,1),attention:clamp(blend(current.attention,attention,weight),0,1),uncertainty:Math.min(.15,horizon*.012)};
    }
    class BehaviorModel {
        constructor(seed = 7123) {
            this.random = randomSource(seed);
            this.time = 0; this.accumulator = 0; this.sampleClock = 0;
            this.x = .5; this.y = .55; this.heading = -.4; this.targetHeading = -.4;
            this.speed = 0; this.targetSpeed = .12; this.angularSpeed = 0;
            this.bodyRadius = .105;
            this.obstacles = [
                {id:'pillar',x:.30,y:.30,r:.075,height:.13,shape:'round'},
                {id:'block',x:.68,y:.40,r:.10,height:.105,shape:'block'},
                {id:'platform',x:.36,y:.70,r:.085,height:.065,shape:'round'}
            ];
            this.interest = null; this.investigating = null; this.visits = 0;
            this.action = 'explore'; this.actionRemaining = 1; this.head = 0; this.headTarget = 0; this.headClock = 0;
            this.gait = 0; this.tailNoise = 0; this.onset = 0;
            this.trail = []; this.history = []; this.events = [];
            this.tail = Array.from({length: 9}, (_, i) => ({x:this.x - .055 - i * .014, y:this.y}));
            const positions=[];
            this.cells = Array.from({length: 24}, (_, i) => {
                let x,y;
                for(let attempt=0;attempt<100;attempt++) {
                    x=.09+this.random()*.82;y=.12+this.random()*.74;
                    if(positions.every(p=>Math.hypot(p.x-x,p.y-y)>.095))break;
                }
                positions.push({x,y});
                return {x,y,
                tune: i % 4, preference: this.random() * TAU,
                calcium: 0, rise: 0, fluorescence: 0, decay: .7 + this.random() * .9,
                radius: 3 + this.random() * 2, phase: this.random() * TAU
            }; });
            this.chooseAction();
        }
        chooseAction() {
            const r = this.random();
            const previous = this.action;
            this.action = r < .22 ? 'pause' : r < .43 ? 'sniff' : r < .57 ? 'groom' : r < .73 ? 'dart' : 'explore';
            this.actionRemaining = this.action === 'dart' ? .35 + this.random() * .65 : .7 + this.random() * 2;
            this.targetSpeed = this.action === 'dart' ? .22 + this.random() * .14 : this.action === 'explore' ? .07 + this.random() * .1 : this.action === 'sniff' ? .004 + this.random() * .024 : 0;
            this.targetHeading += (this.random() - .5) * (this.action === 'dart' ? 2 : 3.5);
            this.investigating = null;
            if ((this.action === 'explore' || this.action === 'dart') && (!this.interest || this.random()<.3)) {
                const object=this.obstacles[Math.min(this.obstacles.length-1,Math.floor(this.random()*this.obstacles.length))];
                const approach=Math.atan2(this.y-object.y,this.x-object.x)+(this.random()-.5)*1.0;
                const distance=object.r+this.bodyRadius+.04;
                this.interest={object,x:clamp(object.x+Math.cos(approach)*distance,.13,.87),y:clamp(object.y+Math.sin(approach)*distance,.13,.87)};
            }
            if (this.action !== previous) this.onset = 1;
        }
        step(dt) {
            this.time += dt; this.actionRemaining -= dt; this.headClock -= dt;
            if (this.actionRemaining <= 0) this.chooseAction();
            if(this.interest && ['explore','dart','sniff'].includes(this.action) && (Math.hypot(this.x-this.interest.x,this.y-this.interest.y)<.085 || Math.hypot(this.x-this.interest.object.x,this.y-this.interest.object.y)<this.interest.object.r+this.bodyRadius+.055)){
                this.investigating=this.interest.object;this.interest=null;this.visits++;
                this.action='sniff';this.actionRemaining=1.2+this.random()*1.8;this.targetSpeed=0;this.onset=1;
                this.targetHeading=Math.atan2(this.investigating.y-this.y,this.investigating.x-this.x);
            }
            if (this.headClock <= 0) {
                this.headTarget = (this.random() - .5) * (this.action === 'sniff' || this.action === 'pause' ? 1.6 : .65);
                this.headClock = .13 + this.random() * .5;
            }
            this.head += (this.headTarget - this.head) * (1 - Math.exp(-dt * 10));
            this.tailNoise += (this.random() - .5) * Math.sqrt(dt) * 1.5;
            const clearance = .19;
            let repelX = 0, repelY = 0;
            if (this.x < clearance) repelX += (clearance - this.x) / clearance;
            if (this.x > 1-clearance) repelX -= (this.x - 1+clearance) / clearance;
            if (this.y < clearance) repelY += (clearance - this.y) / clearance;
            if (this.y > 1-clearance) repelY -= (this.y - 1+clearance) / clearance;
            let desired = this.targetHeading;
            if(this.interest&&(this.action==='explore'||this.action==='dart'))desired=Math.atan2(this.interest.y-this.y,this.interest.x-this.x);
            let steerX=Math.cos(desired),steerY=Math.sin(desired);
            for(const object of this.obstacles){
                const dx=this.x-object.x,dy=this.y-object.y,distance=Math.hypot(dx,dy)||.001;
                const safe=object.r+this.bodyRadius;
                const approach=Math.max(0,-(steerX*dx+steerY*dy)/distance);
                if(distance<safe+.16){
                    const force=clamp((safe+.16-distance)/.16,0,1)*(1+approach*3);
                    steerX+=dx/distance*force;steerY+=dy/distance*force;
                    // Tangential steering avoids settling directly in front of a barrier.
                    if(approach>.4){const side=Math.sin(desired-Math.atan2(-dy,-dx))>=0?1:-1;steerX+=-dy/distance*side*force*.8;steerY+=dx/distance*side*force*.8;}
                }
            }
            steerX+=repelX*3;steerY+=repelY*3;
            if(!this.investigating)desired=Math.atan2(steerY,steerX);
            const angleError = Math.atan2(Math.sin(desired-this.heading),Math.cos(desired-this.heading));
            this.angularSpeed += (clamp(angleError * 4, -5, 5) - this.angularSpeed) * (1-Math.exp(-dt*7));
            this.heading += this.angularSpeed * dt;
            const target = this.targetSpeed * (1 - Math.min(.7, Math.abs(angleError) / Math.PI));
            this.speed += (target - this.speed) * (1 - Math.exp(-dt * (target > this.speed ? 4 : 9)));
            this.x = clamp(this.x + Math.cos(this.heading) * this.speed * dt, .11, .89);
            this.y = clamp(this.y + Math.sin(this.heading) * this.speed * dt, .11, .89);
            // Resolve the animal footprint after every fixed step; render and physics share obstacles.
            for(const object of this.obstacles){
                const dx=this.x-object.x,dy=this.y-object.y,distance=Math.hypot(dx,dy),safe=object.r+this.bodyRadius;
                if(distance<safe){
                    const direction=distance>.0001?Math.atan2(dy,dx):this.heading+Math.PI;
                    this.x=object.x+Math.cos(direction)*safe;this.y=object.y+Math.sin(direction)*safe;
                    this.speed*=.65;
                }
            }
            this.gait += this.speed * dt * 95;
            this.onset *= Math.exp(-dt * 4);
            // Tail follows the rump through a constrained, flexible chain rather than a rigid rotation.
            this.tail[0].x = this.x - Math.cos(this.heading)*.05;
            this.tail[0].y = this.y - Math.sin(this.heading)*.05;
            for (let i=1;i<this.tail.length;i++) {
                const p = this.tail[i-1], q = this.tail[i];
                const sway = Math.sin(this.time*3.2-i*.7+this.tailNoise) * .0025 * (i/8);
                q.x += (p.x - Math.cos(this.heading)*.014 - q.x - Math.sin(this.heading)*sway) * (1-Math.exp(-dt*(13-i)));
                q.y += (p.y - Math.sin(this.heading)*.014 - q.y + Math.cos(this.heading)*sway) * (1-Math.exp(-dt*(13-i)));
                const dx=q.x-p.x, dy=q.y-p.y, distance=Math.hypot(dx,dy)||1;
                q.x=p.x+dx/distance*.014; q.y=p.y+dy/distance*.014;
            }
            // Shared latent behavior modulates probabilistic events; cells also have independent activity.
            this.cells.forEach((cell, i) => {
                const tuning = cell.tune === 0 ? this.speed*14 : cell.tune === 1 ? Math.abs(this.angularSpeed)*.4 : cell.tune === 2 ? (this.action==='sniff'?1.5:.1) : this.onset*2;
                const direction = .5 + .5*Math.cos(this.heading-cell.preference);
                const rate = .12 + tuning*(.3+direction*.7);
                if (this.random() < 1-Math.exp(-rate*dt)) {
                    const amplitude=.3+this.random()*.5;
                    cell.calcium += amplitude; cell.rise += amplitude;
                    this.events.push({t:this.time,cell:i});
                }
                cell.calcium *= Math.exp(-dt/cell.decay);
                cell.rise *= Math.exp(-dt/.075);
                cell.fluorescence = Math.max(0,cell.calcium-cell.rise);
            });
            this.events = this.events.filter(e=>e.t>this.time-8);
            this.sampleClock += dt;
            if (this.sampleClock >= 1/24) {
                this.sampleClock %= 1/24;
                this.trail.push({x:this.x,y:this.y,t:this.time});
                this.history.push({t:this.time,speed:this.speed,calcium:this.cells.reduce((s,c)=>s+c.fluorescence,0)/this.cells.length,action:this.action});
                this.trail=this.trail.filter(p=>p.t>this.time-7);
                this.history=this.history.filter(p=>p.t>this.time-8);
            }
        }
        advance(delta) {
            this.accumulator += Math.max(0,delta);
            while (this.accumulator >= 1/60-1e-10) { this.step(1/60); this.accumulator -= 1/60; }
        }
    }
    const api = { brainTransition, forecastSignal, BehaviorModel, stateAt, stateSignal, states, schedule, randomSource, clamp };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.ResearchModels = api;
})(typeof window !== 'undefined' ? window : globalThis);
