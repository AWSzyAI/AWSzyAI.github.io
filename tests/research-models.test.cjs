const test = require('node:test');
const assert = require('node:assert/strict');
const {BehaviorModel,stateAt,stateSignal,schedule} = require('../assets/research-models.js');

test('mouse has stop/start bouts, variable speeds, independent head motion, and stays in the arena', () => {
    const model=new BehaviorModel(824), actions=new Set(), speeds=[], heads=[];
    for(let i=0;i<60*90;i++) {
        model.advance(1/60);
        actions.add(model.action);speeds.push(model.speed);heads.push(model.head);
        assert.ok(model.x>=.06&&model.x<=.94&&model.y>=.06&&model.y<=.94);
        assert.ok(Number.isFinite(model.heading));
        for(let k=1;k<model.tail.length;k++) {
            assert.ok(Math.abs(Math.hypot(model.tail[k].x-model.tail[k-1].x,model.tail[k].y-model.tail[k-1].y)-.014)<1e-9);
        }
    }
    assert.equal(actions.size,5);
    assert.ok(Math.min(...speeds)<.003);
    assert.ok(Math.max(...speeds)>.18);
    assert.ok(Math.max(...heads)-Math.min(...heads)>1);
    assert.ok(model.history.length<=194 && model.history.length>=180);
    assert.ok(model.events.length>0);
    assert.ok(model.events.every(e=>e.t<=model.time&&e.t>model.time-8));
    assert.ok(model.history.every(e=>e.t<=model.time&&e.t>model.time-8));
});

test('behavior and neural activity do not depend on rendering frame rate', () => {
    const a=new BehaviorModel(7),b=new BehaviorModel(7);
    for(let i=0;i<600;i++)a.advance(1/60);
    for(let i=0;i<300;i++)b.advance(1/30);
    for(const key of ['x','y','heading','head','speed','time']) assert.ok(Math.abs(a[key]-b[key])<1e-9,key);
    assert.deepEqual(a.events,b.events);
    assert.deepEqual(a.cells,b.cells);
});

test('a neural event produces a delayed calcium peak followed by decay', () => {
    const model=new BehaviorModel(23);model.random=()=>1;
    const cell=model.cells[0];cell.calcium=cell.rise=1;cell.fluorescence=0;
    const trace=[];
    for(let i=0;i<360;i++){model.advance(1/60);trace.push(cell.fluorescence);}
    const peak=Math.max(...trace),peakIndex=trace.indexOf(peak);
    assert.ok(peakIndex>2&&peakIndex<60);
    assert.ok(trace[0]<peak*.5);
    assert.ok(trace.at(-1)<peak*.05);
});

test('one timeline covers sleep, arousal and attention states', () => {
    const keys=new Set(schedule.map(e=>e[1]));
    for(const name of ['nrem','rem','drowsy','awake','focused','distracted','fog','alert'])assert.ok(keys.has(name));
    assert.equal(stateAt(9).key,'focused');
    assert.equal(stateAt(12.5).key,'fog');
    assert.equal(stateAt(0).key,'nrem');
    assert.equal(stateAt(24).key,'nrem');
});

test('both continuous channels follow the state timeline and remain bounded through transitions', () => {
    for(const [hour] of schedule.slice(1)) {
        for(const offset of [0,.32]) {
            const before=stateSignal(hour+offset-1e-5),after=stateSignal(hour+offset+1e-5);
            for(const key of ['arousal','attention'])assert.ok(Math.abs(before[key]-after[key])<.001,key);
        }
    }
    for(let t=0;t<=24;t+=.01)for(const v of Object.values(stateSignal(t)))assert.ok(v>=0&&v<=1);
});

test('focus is stable, wandering attention varies, and brain fog separates attention from arousal', () => {
    const sample=(start,end,key)=>Array.from({length:200},(_,i)=>stateSignal(start+(end-start)*i/199)[key]);
    const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
    const variance=a=>{const m=mean(a);return mean(a.map(v=>(v-m)**2));};
    const focused=sample(9,10,'attention'),wandering=sample(11,11.7,'attention');
    assert.ok(mean(focused)>.85);
    assert.ok(variance(wandering)>variance(focused)*10);
    assert.ok(mean(sample(12.2,12.9,'arousal'))-mean(sample(12.2,12.9,'attention'))>.25);
    assert.ok(mean(sample(.4,1.5,'arousal'))<.2);
    assert.ok(mean(sample(17.4,18.4,'arousal'))>.9);
});

test('locomotion changes movement-tuned event rates instead of playing an unrelated neural animation', () => {
    const moving=new BehaviorModel(514),stationary=new BehaviorModel(514);
    // Isolate locomotor tuning from object-approach transitions in the enriched arena.
    moving.interest=null;stationary.interest=null;
    moving.action='explore';moving.targetSpeed=.25;moving.actionRemaining=1e6;
    stationary.action='pause';stationary.targetSpeed=0;stationary.actionRemaining=1e6;
    moving.advance(30);stationary.advance(30);
    const count=model=>model.events.filter(event=>event.cell%4===0).length;
    assert.ok(count(moving)>count(stationary)*3, `${count(moving)} versus ${count(stationary)}`);
});


test('obstacle footprints stay clear and objects elicit investigation across trajectories', () => {
    for(const seed of [1,7,824,923,7777]) {
        const model=new BehaviorModel(seed);let investigations=0;
        for(let frame=0;frame<120*60;frame++) {
            const before={x:model.x,y:model.y};model.advance(1/60);
            assert.ok(model.x>=.11-1e-9&&model.x<=.89+1e-9&&model.y>=.11-1e-9&&model.y<=.89+1e-9,'obstacle avoidance must respect arena walls');
            for(const object of model.obstacles)assert.ok(Math.hypot(model.x-object.x,model.y-object.y)>=object.r+model.bodyRadius-1e-9);
            assert.ok(Math.hypot(model.x-before.x,model.y-before.y)<.015,'collision must not teleport the mouse');
            if(model.investigating){investigations++;assert.equal(model.action,'sniff');assert.ok(model.targetSpeed===0);}
        }
        assert.ok(investigations>30,`seed ${seed} should investigate objects`);
    }
});

test('brain anatomy cycles continuously and returns to the surface without a jump',()=>{
    const {brainTransition}=require('../assets/research-models.js');
    assert.equal(brainTransition(0),0);assert.equal(brainTransition(14),1);assert.equal(brainTransition(28),0);
    for(let t=0;t<56;t+=.01){assert.ok(brainTransition(t)>=0&&brainTransition(t)<=1);assert.ok(Math.abs(brainTransition(t+.001)-brainTransition(t))<.001);}
});

test('planning changes future trajectories, preserves the past and has a continuous forecast boundary',()=>{
    const {forecastSignal}=require('../assets/research-models.js');
    const early={coffee:10,meal:18,sleep:22},late={coffee:17,meal:21,sleep:24};
    for(let t=0;t<14;t+=.1)assert.deepEqual(forecastSignal(t,14,early),forecastSignal(t,14,late));
    for(const plan of [early,late]){
        const a=forecastSignal(14,14,plan),b=forecastSignal(14.00001,14,plan);
        assert.ok(Math.abs(a.arousal-b.arousal)<.001&&Math.abs(a.attention-b.attention)<.001);
        for(let t=14;t<=30;t+=.05){const v=forecastSignal(t,14,plan);assert.ok(v.arousal>=0&&v.arousal<=1&&v.attention>=0&&v.attention<=1&&v.uncertainty>=0);}
    }
    assert.ok(forecastSignal(23,14,late).arousal>forecastSignal(23,14,early).arousal+.05);
    assert.ok(forecastSignal(19,14,late).arousal>forecastSignal(19,14,early).arousal);
    assert.notEqual(forecastSignal(20,14,early).attention,forecastSignal(20,14,{...early,meal:21}).attention);
});
