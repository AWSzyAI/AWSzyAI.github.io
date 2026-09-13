(() => {
    'use strict';
    const stage = document.querySelector('.neural-stage');
    if (!stage) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const body = document.body;
    let paused = reduced.matches;

    // Content stays visible without JavaScript or IntersectionObserver support.
    const revealElements = document.querySelectorAll('.section-heading, .mission-copy, .strategy-row, .architecture, .project, .citation-list li, .about-layout, .english-bio, .resource-groups, .contact-layout');
    let revealObserver;
    if ('IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        }), { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
        revealElements.forEach(element => {
            element.dataset.reveal = '';
            revealObserver.observe(element);
        });
        body.classList.add('motion-ready');
    }

    const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
    const sections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
    let scrollFrame = 0;
    const updateScroll = () => {
        scrollFrame = 0;
        const max = document.documentElement.scrollHeight - innerHeight;
        body.classList.toggle('immersive-header', scrollY < document.querySelector('.hero').offsetHeight - 70);
        document.documentElement.style.setProperty('--reading-progress', String(max > 0 ? Math.min(1, scrollY / max) : 0));
        let current = -1;
        sections.forEach((section, index) => { if (section && section.getBoundingClientRect().top < innerHeight * .4) current = index; });
        navLinks.forEach((link, index) => {
            if (index === current) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    };
    const onScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    updateScroll();

    const canvas = stage.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // Keep the SVG and caption as the static fallback.
    const viewport = stage.querySelector('.field-viewport');
    const controls = stage.querySelector('.field-controls');
    const toggle = stage.querySelector('.motion-toggle');
    const description = stage.querySelector('.field-caption');
    const indexLabel = stage.querySelector('.field-index');
    const modes = [...stage.querySelectorAll('[data-field]')];
    const captions = {
        network: ['以脑网络建模意识与记忆。', '编码心智过程，通过模型预测与假设检验，探索意识和记忆的机制。', '01'],
        waves: ['刻画持续变化的意识状态。', '沿同一时间轴追踪觉醒与注意，刻画睡眠、清醒、专注与脑雾之间的连续变化。', '02'],
        behavior: ['对齐行为与光学神经活动。', '将运动、姿态与钙成像放在同一时间轴上，研究神经活动与行为之间的关系。', '03']
    };
    if (!window.ResearchScenes || !window.ResearchModels) return;
    const scene = new window.ResearchScenes(ctx);
    stage.dataset.mode = 'network';
    scene.hour=14;
    const slider = stage.querySelector('#state-time');
    const clock = stage.querySelector('#state-clock');
    const behaviorStatus = stage.querySelector('#behavior-state');
    const tools = { network: stage.querySelector('#network-tools'), waves: stage.querySelector('#waves-tools'), behavior: stage.querySelector('#behavior-tools') };
    let mode = 'network', width = 1, height = 1, frame = 0, last = 0, visible = true, scrubbing = false;
    let pointerX = 0, pointerY = 0, rotationX = 0, rotationY = 0;
    function draw() {
        scene.draw(mode, width, height, rotationX, rotationY);
        if (mode === 'network') {
            const hint = scene.stimulusAge < 4 ? '局部输入已改变，观察响应传播' : '改变局部输入，观察网络响应';
            const target = tools.network.querySelector('small');
            if (target.textContent !== hint) target.textContent = hint;
            const phase=scene.brainMix>.9?'脑区结构':scene.brainMix>.1?'结构与活动之间':'网络活动';
            const phaseLabel=stage.querySelector('#brain-phase');if(phaseLabel.textContent!==phase)phaseLabel.textContent=phase;
        }
        if (mode === 'waves') {
            const value = Math.floor(scene.hour * 60);
            if (!scrubbing) slider.value = String(value);
            const current = window.ResearchModels.stateAt(scene.hour).label;
            const timeLabel = `${String(Math.floor(value / 60)).padStart(2,'0')}:${String(value % 60).padStart(2,'0')}`;
            if (clock.textContent !== timeLabel) clock.textContent = timeLabel;
            const signal = window.ResearchModels.stateSignal(scene.hour);
            const levels = {};
            for (const [key, label] of [['arousal', '觉醒'], ['attention', '注意']]) {
                levels[key] = signal[key] > .8 ? '高' : signal[key] > .55 ? '较高' : signal[key] > .3 ? '中' : '低';
                const output = stage.querySelector(`#${key}-value`);
                if (output.textContent !== levels[key]) output.textContent = levels[key];
            }
            const stateOutput = stage.querySelector('#state-current');
            if (stateOutput.textContent !== current) stateOutput.textContent = current;
            slider.setAttribute('aria-valuetext', `${timeLabel}，${current}，觉醒${levels.arousal}，注意${levels.attention}`);
        }
        if (mode === 'behavior') {
            const action = scene.mouse.investigating ? '物体嗅探' : { pause: '停留', sniff: '嗅探', groom: '梳理', dart: '短跑', explore: '探索' }[scene.mouse.action];
            const text = `同步 t = ${scene.mouse.time.toFixed(1)} s · ${action}`;
            if (behaviorStatus.textContent !== text) behaviorStatus.textContent = text;
        }
    }
    function tick(stamp) {
        frame = 0;
        if (paused || !visible || document.hidden) { last = 0; return; }
        const dt = last ? Math.min((stamp - last) / 1000, .05) : 0;
        if (!(mode === 'waves' && scrubbing)) scene.advance(dt, mode);
        last = stamp;
        rotationX += (pointerX - rotationX) * .045;
        rotationY += (pointerY - rotationY) * .045;
        draw(); frame = requestAnimationFrame(tick);
    }
    function syncAnimation() {
        cancelAnimationFrame(frame); frame = 0; last = 0;
        body.classList.toggle('motion-paused', paused);
        toggle.setAttribute('aria-pressed', String(paused));
        toggle.setAttribute('aria-label', paused ? '播放动态效果' : '暂停动态效果');
        toggle.querySelector('.motion-label').textContent = paused ? '播放' : '暂停';
        draw();
        if (!paused && visible && !document.hidden) frame = requestAnimationFrame(tick);
    }
    const resize = () => {
        const box = viewport.getBoundingClientRect();
        width = box.width; height = box.height;
        const ratio = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0); draw();
    };
    const sizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
    if (sizeObserver) sizeObserver.observe(viewport); else addEventListener('resize', resize);
    let visibilityObserver;
    if ('IntersectionObserver' in window) {
        visibilityObserver = new IntersectionObserver(entries => {
            visible = entries[0].isIntersecting; syncAnimation();
        }, { threshold: 0 });
        visibilityObserver.observe(stage);
    }
    viewport.addEventListener('pointermove', event => {
        if (!finePointer.matches || reduced.matches || paused) return;
        const box = viewport.getBoundingClientRect();
        pointerX = ((event.clientX - box.left) / box.width - .5) * .45;
        pointerY = ((event.clientY - box.top) / box.height - .5) * .25;
    }, { passive: true });
    viewport.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
    modes.forEach(button => button.addEventListener('click', () => {
        mode = button.dataset.field;
        stage.dataset.mode = mode;
        stage.closest('.hero').dataset.scene = mode;
        updateScroll();
        const manifesto=document.querySelector('.hero-manifesto'),deck=document.querySelector('.hero-deck');
        const copy=mode==='waves'?['记录当下。','预见下一段状态。','连接 Apple Watch 与 EEG，','探索意识状态的记录、预测与干预。']:['建模心智。','探索意识与记忆。','以神经网络编码心智过程，','通过模型与实验检验假设。'];
        manifesto.replaceChildren(document.createTextNode(copy[0]),document.createElement('br'),document.createTextNode(copy[1]));
        deck.replaceChildren(document.createTextNode(copy[2]),document.createElement('br'),document.createTextNode(copy[3]));
        modes.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        const [title, detail, number] = captions[mode];
        description.replaceChildren(document.createTextNode(title));
        const subtitle = document.createElement('span'); subtitle.textContent = detail; description.append(subtitle);
        indexLabel.textContent = `${number} / 03`;
        Object.entries(tools).forEach(([name, element]) => { element.hidden = name !== mode; });
        draw();
    }));
    for(const key of ['coffee','meal','sleep'])stage.querySelector(`#plan-${key}`).addEventListener('change',event=>{
        scene.plan[key]=Number(event.target.value);draw();
        stage.querySelector('#plan-effect').textContent='已更新日程 · 虚线与阴影：未来情景与不确定范围 · 灰线：较晚安排';
    });
    stage.querySelector('#perturb-model').addEventListener('click', () => { scene.stimulusAge = 0; draw(); });
    slider.addEventListener('input', () => { scene.hour = Number(slider.value) / 60; draw(); });
    slider.addEventListener('pointerdown', () => { scrubbing = true; });
    addEventListener('pointerup', () => { scrubbing = false; });
    slider.addEventListener('focus', () => { scrubbing = true; });
    slider.addEventListener('blur', () => { scrubbing = false; });
    toggle.addEventListener('click', () => { paused = !paused; syncAnimation(); });
    reduced.addEventListener('change', () => { paused = reduced.matches; pointerX = pointerY = rotationX = rotationY = 0; syncAnimation(); });
    document.addEventListener('visibilitychange', syncAnimation);
    // Release animation work when navigating away; support back/forward cache restoration.
    addEventListener('pagehide', () => { cancelAnimationFrame(frame); cancelAnimationFrame(scrollFrame); frame = scrollFrame = 0; last = 0; });
    addEventListener('pageshow', () => { updateScroll(); syncAnimation(); });
    scene.brainMesh = new window.BrainMesh(() => draw());
    controls.hidden = false; tools.network.hidden = false; stage.classList.add('field-ready'); resize(); syncAnimation();
})();
