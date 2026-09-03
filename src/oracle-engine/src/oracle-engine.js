/**
 * ORACLE-ENGINE.JS
 *
 * Question -> tag analysis, angerLevel/shakeCount thresholding, answer pool selection.
 * Mirrors GrumpyEightBall.pde state model for easy fusion with collab's Processing code.
 *
 * State parallels to collab .pde variables:
 *   angerLevel    -> same 0-100 range as PApplet field in draw()
 *   shakeCount    -> int, increments on each mousePressed event
 *   isShaking     -> boolean event flag (identical lifecycle to collab)
 *   clutchDelta   -> parallel to collab's shakeIntensity
 *   maxAngerReach -> peak anger across cycle for display hints
 *
 * Integration API:
 *   engine.analyze(question, angerLevel?, shakeCount?)
 *     -> { question, tags, threshold, poolLabel, answer }
 *   engine.simulateShakeStep(increment?) -> returns current angerLevel
 *   engine.getState()
 *     -> { angerLevel, shakeCount, furyLabel, ... }
 *
 * Zero dependencies. Zero API calls. All static data driven.
 */

import oracleData from './oracle-data.js';


// Seeded PRNG (mulberry32) - replaces Math.random() / collab's random()
let _seed = oracleData._seed;

function _advance() {
  let s = _seed | 0;
  s = (s + 0x6D2B79F5) | 0;
  let t   = Math.imul(s ^ (s >>> 15), 1 | s);
  t       = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  _seed   = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return _seed; // float in [0, 1) like collab's random()
}


// Factory function - mirrors PApplet-style setup of collab .pde
export function createOracleEngine(initialState) {

  // State tracking (1:1 parallels to collab variables)
  const state = {
    angerLevel:    initialState.angerLevel     != null ? initialState.angerLevel : 0,
    shakeCount:    initialState.shakeCount      != null ? initialState.shakeCount : 0,
    isShaking:     initialState.isShaking       != null ? initialState.isShaking : false,
    clutchDelta:   initialState.clutchDelta     != null ? initialState.clutchDelta : 0,
    maxAngerReach: 0,
  };

  // -- Internal helpers (non-public) --

  /** Tag a question with detected themes. Similar concept to collab's implicit theme
   * detection via String[] matching - but explicit and extensible here. */
  function tagQuestion(question) {
    const lower = question.toLowerCase().trim();
    return {
      love:     /love|heart|romance/i.test(lower),
      work:     /career|job|boss|money|profit|business/i.test(lower),
      decision: /should|choose|whether|which|what.*to|path/i.test(lower),
      danger:   /scared|risk|harm|danger|fear/i.test(lower),
      future:   /will.*happen|tomorrow|soon/i.test(lower),
      identity: /who am i|why|meaning|purpose|worth/i.test(lower),
    };
  }

  /** Determine answer pool from anger/shake thresholds.
   * Mirrors GRUMPY EIGHTBALL logic exactly:
   *   if (angerLevel > 45 || shakeCount > 3) -> angryResponses[]
   *   else                                     -> mildResponses[] */
  function determinePool(anger, shakes) {

    // Override threshold (exact parallel to angerLevel > 45 in collab):
    var tFierce = oracleData.thresholds.fierce;
    if (tFierce && tFierce.minAnger != null && anger >= tFierce.minAnger) return 'fierce';

    // Walk thresholds from most -> least agitated:
    var poolOrder = ['bold', 'cryptic', 'curious', 'gentle'];
    for (var i = 0; i < poolOrder.length; i++) {
      var poolName = poolOrder[i];
      var t = oracleData.thresholds[poolName];
      if (!t || (t.maxAnger == null && t.maxShake == null)) continue;

      var met = true;
      if (t.maxAnger != null)  met = met && anger >= t.maxAnger;
      if (t.maxShake != null)  met = met && shakes >= t.maxShake;
      if (met) return poolName;
    }

    // default = gentle (parallel to mildResponses fallback in collab)
    return 'gentle';
  }

  /** Pick one answer from a given pool. Parallel to:
   * int idx = int(random(responses.length)); currentResponse = responses[idx]; */
  function pickFromPool(poolName) {
    var answers = oracleData.pools[poolName] && oracleData.pools[poolName].answers;
    if (!answers || !answers.length) return 'The oracle speaks in silence.';
    var idx = Math.floor(_advance() * answers.length);
    return answers[idx % answers.length];
  }

  /** Fury label for UI overlay. Parallel to drawGrumpyFace(fury) parameter */
  function getFuryLabel(furyPct) {
    if (furyPct >= 0.85) return '\u26A1 FURIOUS';
    if (furyPct >= 0.60) return '\uD83D\uDD25 ANGRY';
    if (furyPct >= 0.40) return '\uD83C\uDF0A CRYPTIC';
    if (furyPct >= 0.20) return '\u2753 CURIOUS';
    return '\u2728 GENTLE';
  }

  /** Mutate answer text for high-fury visual effect.
   * Parallel to dieAlpha -> murky liquid submergence in collab's rendering path. */
  function applyMutation(answer) {
    if (state.angerLevel < 70) return answer;
    var n = _advance();
    if (n > 0.4) return answer + '\u2026';
    return answer;
  }

  // -- Public API surface --

  /** Simulate a shake step - called by tracking.js on every gesture event.
   * Mirrors collab's draw() body: angerLevel += increment during shaking phase. */
  function simulateShakeStep(increment) {
    var val = (increment == null) ? 1 : increment;
    state.angerLevel = Math.min(100, state.angerLevel + (val || 0.5));

    // Decay when not shaking (same formula as collab: shakeDecay *= 0.92 each frame)
    if (!state.isShaking) {
      state.angerLevel *= 0.92;
    }

    return state.angerLevel;
  }

  /** Called on shake/press start (mousePressed on sphere / key held down).
   * Mirrors: void mousePressed() { isShaking = true; shakeCount++; } */
  function onStart() {
    state.isShaking     = true;
    state.shakeCount   += 1;
    state.clutchDelta   = Math.max(state.clutchDelta, 5);
  }

  /** Called on release. Triggers full analysis -> answer selection path.
   * Mirrors: void mouseReleased() { isShaking = false; ... select pool -> currentResponse } */
  function onEnd(question) {
    state.isShaking = false;

    if (state.angerLevel > state.maxAngerReach) {
      state.maxAngerReach = state.angerLevel;
    }

    var threshold   = determinePool(state.angerLevel, state.shakeCount);
    var poolLabel   = threshold + ' oracle';
    var rawAnswer   = pickFromPool(threshold);
    var answer      = applyMutation(rawAnswer);

    // Reset seed for next cycle (parallel to no reset in collab - fresh random each frame)
    _seed = oracleData._seed;

    return {
      question:   String(question || '').trim(),
      tags:       tagQuestion(String(question)),
      threshold:  threshold,
      poolLabel:  poolLabel,
      answer:     answer,
      angerLevel: state.angerLevel,
    };
  }

  /** Full analytical call - used by app.js at the submit / release event.
   * Optionally override anger/shake levels for testing or alternate input paths. */
  function analyze(question, optionalAnger, optionalShake) {
    var anger = (optionalAnger != null) ? optionalAnger : state.angerLevel;
    var shakes = (optionalShake != null)  ? optionalShake  : state.shakeCount;

    var savedAnger  = state.angerLevel;
    var savedShakes = state.shakeCount;
    state.angerLevel   = anger;
    state.shakeCount   = shakes;

    var result = onEnd(question);

    state.angerLevel   = savedAnger;
    state.shakeCount   = savedShakes;

    return result;
  }

  /** Return tracking state in exact format collab's PApplet expects for UI rendering */
  function getState() {
    return Object.freeze({
      angerLevel:   state.angerLevel,
      shakeCount:   state.shakeCount,
      isShaking:    state.isShaking,
      clutchDelta:  state.clutchDelta,
      furyLabel:    getFuryLabel(state.angerLevel / 100),
    });
  }

  /** Accept state from collaborator's Processing code (bridge for branch merging). */
  function setStateFromCollab(fromCollab) {
    if (fromCollab.angerLevel != null) state.angerLevel     = fromCollab.angerLevel;
    if (fromCollab.shakeCount   != null) state.shakeCount    = fromCollab.shakeCount;
    if (fromCollab.isShaking    != null) state.isShaking     = fromCollab.isShaking;
    return this;
  }

  /** Reset all tracking - parallel to collab's void setup() reinitialization. */
  function reset() {
    state.angerLevel   = 0;
    state.shakeCount   = 0;
    state.isShaking    = false;
    state.clutchDelta  = 0;
    return this;
  }

  // -- Return public object --
  // Pattern matches PApplet static member pattern (like collab's PGraphics)

  return {
    get state() { return Object.freeze(Object.assign({}, state)); },
    analyze:      analyze,
    onStart:      onStart,
    simulateShakeStep:     simulateShakeStep,
    getState:     getState,
    setStateFromCollab: setStateFromCollab,
    reset:        reset,
    thresholds:   oracleData.thresholds,
  };
}


// Module-level singleton - pattern matches collab's static member style

var engine = createOracleEngine();
export var oracleEngine = engine;
export default engine;
