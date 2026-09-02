// Grumpy Sentient 8-Ball - Processing (Java Mode)

String[] mildResponses = {
  "PUT ME DOWN.",
  "MY HEAD ACHES.",
  "DO I LOOK LIKE\nA WIZARD?",
  "NO. AND STOP\nSHAKING ME.",
  "ASK AGAIN AND\nI VOMIT BLUE DIE.",
  "I AM TRAPPED IN\nA PLASTIC SPHERE."
};

String[] angryResponses = {
  "CONGRATULATIONS,\nNOW I'M NAUSEOUS.",
  "I WILL CURSE\nYOUR ENTIRE BLOODLINE.",
  "DO YOU SHAKE ALL\nYOUR LIFE PROBLEMS?",
  "ENJOY YOUR DOOM,\nI'M TAKING A NAP.",
  "YOUR FUTURE IS BLEAK\nAND SO AM I.",
  "SHAKE ME AGAIN AND\nSEE WHAT HAPPENS."
};

String currentResponse = "DON'T YOU DARE\nSHAKE ME.";
boolean isShaking = false;
float shakeIntensity = 0;
float shakeDecay = 0.92;
float dieAlpha = 255;
float targetAlpha = 255;

// Sentience & Anger System
int shakeCount = 0;
float angerLevel = 0; // 0 = annoyed, 100 = completely furious

void setup() {
  size(600, 600);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
}

void draw() {
  background(22, 22, 26);

  // --- Sentient Behavior & Dynamics ---
  if (isShaking) {
    shakeIntensity = lerp(shakeIntensity, 22 + (angerLevel * 0.15), 0.2);
    targetAlpha = 30; // die submerges in murky liquid
    angerLevel = min(100, angerLevel + 0.4);
  } else {
    shakeIntensity *= shakeDecay;
    targetAlpha = 255;
    angerLevel = max(0, angerLevel - 0.05); // slowly cools down
  }

  dieAlpha = lerp(dieAlpha, targetAlpha, 0.08);

  // Jitter based on agitation
  float jitterX = (noise(frameCount * 0.8) - 0.5) * shakeIntensity * 2;
  float jitterY = (noise(frameCount * 0.8 + 100) - 0.5) * shakeIntensity * 2;
  float currentX = width / 2 + jitterX;
  float currentY = height / 2 + jitterY;

  pushMatrix();
  translate(currentX, currentY);

  // 1. Shadow & Sphere
  noStroke();
  fill(10, 10, 12);
  ellipse(0, 12, 400, 400);

  // Subtle reddish tint when pure rage sets in
  fill(lerpColor(color(28, 28, 32), color(55, 18, 22), angerLevel / 100.0));
  ellipse(0, 0, 380, 380);

  // Highlight curve
  noFill();
  stroke(70, 70, 80, 120);
  strokeWeight(5);
  arc(-20, -20, 340, 340, PI + QUARTER_PI, TWO_PI - QUARTER_PI);

  // 2. Reservoir Window
  noStroke();
  fill(8, 14, 24);
  ellipse(0, 0, 230, 230);
  stroke(20, 24, 32);
  strokeWeight(8);
  ellipse(0, 0, 230, 230);

  // 3. Floating Die
  pushMatrix();
  float dieFloatY = sin(frameCount * 0.04) * 3;
  translate(0, dieFloatY);

  // Triangle body
  fill(20, 35, 75, dieAlpha * 0.85);
  stroke(35, 65, 130, dieAlpha);
  strokeWeight(4);
  beginShape();
  vertex(0, 68);
  vertex(-85, -60);
  vertex(85, -60);
  endShape(CLOSE);

  // Internal facets
  stroke(55, 95, 180, dieAlpha * 0.4);
  strokeWeight(2);
  line(0, 68, 0, -10);
  line(-85, -60, 0, -10);
  line(85, -60, 0, -10);

  // Response text
  fill(180, 215, 255, dieAlpha);
  noStroke();
  textSize(12);
  textLeading(16);
  text(currentResponse, 0, -15, 115, 80);
  popMatrix();

  // 4. Angry Sentient Brow Overlay
  drawGrumpyFace(angerLevel / 100.0);

  // Glass reflection sheen
  noFill();
  stroke(255, 255, 255, 25);
  strokeWeight(4);
  arc(0, 0, 205, 205, PI * 1.1, PI * 1.6);

  popMatrix();

  // Anger gauge & instruction
  fill(110);
  textSize(12);
  text("HOLD TO AGITATE", width / 2, height - 35);
}

void drawGrumpyFace(float fury) {
  pushStyle();
  stroke(14, 18, 28, 200);
  strokeWeight(4);
  noFill();

  // Eyebrows rotate sharper inward with fury
  float tilt = lerp(12, 30, fury);
  line(-55, -80, -15, -80 + tilt);
  line(55, -80, 15, -80 + tilt);

  // Slits / Pupils get sharper and redder
  fill(lerpColor(color(10, 14, 22), color(120, 20, 25), fury));
  noStroke();
  float eyeH = lerp(9, 3, fury);
  ellipse(-35, -62, 22, eyeH);
  ellipse(35, -62, 22, eyeH);

  // Unhappy cat mouth
  stroke(14, 18, 28, 200);
  strokeWeight(3);
  line(-14, 90, 14, 90);
  line(-14, 90, -20, 96);
  line(14, 90, 20, 96);
  popStyle();
}

void mousePressed() {
  if (dist(mouseX, mouseY, width / 2, height / 2) < 190) {
    isShaking = true;
    shakeCount++;
  }
}

void mouseReleased() {
  if (isShaking) {
    isShaking = false;
    
    // Choose response based on anger level
    if (angerLevel > 45 || shakeCount > 3) {
      int idx = int(random(angryResponses.length));
      currentResponse = angryResponses[idx];
    } else {
      int idx = int(random(mildResponses.length));
      currentResponse = mildResponses[idx];
    }
  }
}
