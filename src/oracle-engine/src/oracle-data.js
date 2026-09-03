/**
 * ORACLE-DATA.JS
 * 
 * Raw answer pools - mirrors GrumpyEightBall.pde's String[] pool pattern,
 * but extended with category buckets that auto-select at anger/shake thresholds.
 * 5 pools: gentle | curious | cryptic | bold | fierce
 * No external APIs - all static data. Compatible w/ collab's state model.
 */

const oracleData = {

  /* Answer pools (parallel to collab's mildResponses / angryResponses) */
  pools: {

    gentle: {
      description: "Soft truths. Like resting between shakes.",
      answers: [
        "The answer is closer than you think.",
        "What comes gently will stay longer.",
        "Yes - but only when you stop pushing.",
        "Wait patiently. The tide turns quietly.",
        "Peace is your answer right now.",
      ],
    },

    curious: {
      description: "Gently challenging questions in return.",
      answers: [
        "What if the answer changes what you seek?",
        "Are you ready for whatever shows up?",
        "Who says yes and who says no? Is that even your question?",
        "Perhaps, if your heart matches your voice.",
        "The right question will reveal the answer first.",
      ],
    },

    cryptic: {
      description: "Answers wrapped in riddles. Middle ground of agitation.",
      answers: [
        "A shadow nods yes where you cannot see it.",
        "What you name becomes the path backward.",
        "The veil parts - but not for everyone.",
        "Look sideways at what is directly ahead.",
        "Two paths exist; one bears your footsteps already.",
      ],
    },

    bold: {
      description: "Direct answers. High agitation, no filters.",
      answers: [
        "The answer is yes - stop waiting for permission.",
        "Your next step carries its own confirmation.",
        "It will happen because you refuse it not.",
        "The path clears when the mind agrees - and yours has.",
        "Say it aloud. Watch it move toward you.",
      ],
    },

    fierce: {
      description: "Unfiltered, intense reading. Your anger threshold met.",
      answers: [
        "Your future is bold - and so are you.",
        "Enough hesitation. This answer was certain from the start.",
        "You asked because you already knew - now move on it.",
        "The wall you hit only exists to prove you're at the right place.",
        "Do not mistake my rage for your doubt.",
      ],
    },

  },

  /* Threshold table (mirrors collab angerLevel > 45 || shakeCount > 3) */
  thresholds: {
    gentle:   { maxAnger: 25,  maxShake: 2 },
    curious:  { maxAnger: 50,  maxShake: 5 },
    cryptic:  { maxAnger: 70,  maxShake: 8 },
    bold:     { maxAnger: 100, maxShake: 10 },
    fierce:   { minAnger: 90 },
  },

  /* PRNG seed */
  _seed: Date.now() & 0xFFFFFFFF,

};

export { oracleData };
export default oracleData;
