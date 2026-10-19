# Research visuals

Three homepage research visuals communicate the owner’s research directions. They explain research directions, not fitted experimental models, measured recordings, or clinical tools. Scope notes stay in these maintenance docs rather than decorative UI disclaimers.

## Brain network modeling

The default view uses MRI-derived pial, cerebellar and brainstem meshes from Anderson Winkler’s [Brain for Blender / Brainder](https://brainder.org/research/brain-for-blender/), licensed CC BY-SA 3.0. `assets/brain-mesh.js` renders simplified geometry with native WebGL: shaded cortical relief, surface wire edges, moving activation fronts, sparse points and a slowly changing three-quarter view. Geometry attribution, download links and derivative licensing are in `assets/brain/README.md`, linked from the public footer. `scripts/build-brain-mesh.py` reconstructs the display assets from MZ3 archives.

A 28-second automatic cycle holds the cortical network, crossfades into a transparent cortex with hippocampal and amygdala meshes, then returns to the surface. The view buttons were removed. A dedicated animation clock pauses with the main playback and does not progress while another topic is active. Leader lines locate cortical lobes, cerebellum and brainstem; the hypothalamus is explicitly labeled as an approximate region, not an isolated segmented mesh. Labels are orientation aids, not quantitative parcellation. The model’s true folded shape replaces the rejected hand-drawn anatomical outline. A static SVG projection from the same data supports loading, WebGL failure and JavaScript-disabled viewing.

Surface topology is not a measured neuronal connectome. Activity and local perturbation propagation are decorative procedural signals, not recorded neural data or validated functional predictions. Promotional circuit-brain imagery, including [Baylor College of Medicine’s cerebellar AI article](https://www.bcm.edu/news/neuroscientists-develop-ai-tool-to-unlock-cerebellums-secrets), informed the luminous wire treatment; no promotional stock image is copied into the site.

## Continuous conscious states

The state scene is laid out as a four-panel journal figure on the forest-green stage, with shared mint (arousal) and amber (attention) channels. `assets/state-experience.js` draws it; the hero text keeps the upper left and the figure measures around it (`scene.textBox`, set in `motion.js`).

- **a 多模态采集** — a reduced Apple Watch display (`assets/watch-display.js`, official Series 11 artwork, see `assets/devices/README.md`) beside a 4-second scrolling strip of Fz/Cz/Pz EEG, PPG with derived heart rate, and accelerometer magnitude, with 1 s and 50 µV scale bars and a 10–20 montage marking the three channels. Rhythms follow the current state (delta and spindles in NREM, theta in REM, alpha when drowsy, beta when attentive). These are synthetic traces, not recordings; the watch does not record EEG.
- **b 脑电时频图** — a 0–30 Hz spectrogram for the recorded segment, built once from per-state band weights (delta, theta, alpha, sigma, beta) on a 1/f background. The forecast region is hatched and carries no spectrum.
- **c 睡眠分期** — a standard W/REM/N1/N2/N3 hypnogram with REM bars in amber. Recorded stages come from the sample schedule (N3 mid-segment early in the night); forecast stages come from the forecast arousal level and the canonical night shifted to the chosen bedtime, drawn dashed.
- **d 觉醒 / 注意（潜变量）** — normalized latent trajectories, averaged over seven offsets to remove sub-sampling aliasing of the model’s fast fluctuations, with dashed scenario forecasts, a ±95% band and a dotted later-schedule reference.

One cursor crosses b–d with the clock and “记录 / 情景预测” labels, over a shared 00:00–次日 06:00 axis. Controls are one row: a time scrubber and three scenario selectors (last caffeine, dinner, bedtime). The textual state summary and plan note remain for screen readers. `forecastSignal` uses qualitative heuristic response shapes, not validated biological parameters, calibrated intervals or personalized forecasts; no dose recommendations, clinical scores or treatment claims are made. The former colloquial “脑雾” state is labelled “低注意清醒”.

Reference context: [Apple Watch sleep tracking](https://support.apple.com/en-ie/108906); [Apple’s sleep-stage estimation paper](https://www.apple.com/health/pdf/Estimating_Sleep_Stages_from_Apple_Watch_Oct_2025.pdf) distinguishes wearable estimates from EEG-based reference assessments; [NHLBI healthy sleep habits](https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits). These references do not validate the illustrative formula.

## Brain–behavior alignment

The behavior scene is a six-panel figure driven by one `BehaviorModel` clock (seeded stochastic exploration, sniffing, object investigation, grooming, pausing and short runs, fixed 1/60-second steps). The model is pre-rolled 9 s so every trace spans the full 8-second history on first view.

- **a 俯视相机 · 姿态估计** — a 40 cm open-field arena seen from above with a 10 cm scale bar, the three objects shared with collision handling, a fading 7-second trajectory, a top-view silhouette, an 8-keypoint skeleton (`BehaviorModel.pose()`: nose, ears, neck, body centre, tail base/mid/tip) and a detection box with confidence, in the style of pose-estimation output. The earlier oblique WebGL mouse (`mouse-renderer.js`) was removed.
- **b 宽场钙成像 · GCaMP** — the circular cranial window over a bilateral dorsal-cortex silhouette (shape from the user’s reference images), with ROI 1–8 outlined and numbered to match panel e, and a 1 mm scale bar. The texture is drawn, not captured microscopy. A readout beside it lists behavior state, speed (cm/s), head angular speed, active ROIs and the shared clock.
- **c 行为分期** ethogram with a six-state legend; **d 速度** (0–12 cm/s); **e ΔF/F** stacked traces for ROI 1–8 (6 on mobile) with a 50% scale bar; **f 神经事件** raster for 24 cells (12 on mobile). c–f share a −8 s → 0 s axis with 2-second grid lines and a cursor at the present sample.

Behavior-dependent tuning (speed, turning, sniffing, onset) modulates probabilistic event rates with independent baseline activity; calcium rises quickly and decays exponentially after each event. This demonstrates alignment, not one-to-one causal mapping or spike inference from fluorescence.

Scientific context: [Janelia GENIE publications](https://www.janelia.org/project-team/genie/publication-list); [Janelia’s GENIE proposal](https://www.janelia.org/sites/default/files/GENIE_proposal_April_30_2014.pdf); [Allen Institute for Neural Dynamics](https://alleninstitute.org/neural-dynamics).

## Validation

`node --test tests/research-models.test.cjs` checks stop/start variation, arena bounds, independent head motion, tail continuity, bounded histories, frame-rate independence, delayed calcium peaks and decay, state coverage, continuity at state transitions, feature separation and state-dependent variability. Additional multi-seed trajectories verify obstacle clearance, arena bounds, continuous movement and object investigation. The locomotor-tuning test disables approach targets to isolate sustained movement from investigation transitions.

UI: all animations stop when paused, offscreen or the page is hidden; reduced-motion starts paused. Scrubbing and topic changes still work while paused. The static SVG brain remains visible if JavaScript or Canvas is unavailable. No outside animation library is required. Unit checks additionally verify continuous automatic brain transitions and planning-curve continuity, boundedness and separation from the past.

## Product homepage

The opening is an edge-to-edge forest-green viewport focused on a large brain and slowly propagating network activity, with mission text on the left on desktop. Both the canvas and its flow field reach the viewport edges. The main page no longer has a fixed content-width cap; readable paragraph lengths remain locally constrained. Long fibers and a slowly changing three-quarter view frame the same reconstructed anatomy; no unrelated animation or repeated logo wall is used. The navigation and content sequence are Mission → Products → Strategy → Technology. Products preserve their Blux attribution and development status; affiliations and public research remain factual. The personal brand is not represented as a newly incorporated legal entity. No third-party AI product layout or brand artwork is copied.
