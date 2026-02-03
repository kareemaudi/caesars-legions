/**
 * Image Generator for Caesar's Legions
 * Uses OpenAI DALL-E 3 to generate brand visuals
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const PROMPTS = {
  hero: {
    prompt: "Modern abstract illustration: a majestic golden Roman eagle (aquila) standard emerging from flowing digital data streams and email icons, dark navy background (#0f0f0f to #1a1a1a gradient), gold accents (#eab308), clean minimalist style, professional tech aesthetic, subtle glow effects, no text",
    filename: "hero-eagle.png"
  },
  research: {
    prompt: "Minimalist icon illustration: a magnifying glass merged with a Roman centurion helmet, examining data points and profiles, gold (#eab308) on dark background, clean vector style, professional SaaS aesthetic, subtle glow",
    filename: "icon-research.png"
  },
  write: {
    prompt: "Minimalist icon illustration: a quill pen morphing into a digital stylus writing on a glowing tablet, Roman scroll unfurling into email drafts, gold (#eab308) on dark background, clean vector style",
    filename: "icon-write.png"
  },
  send: {
    prompt: "Minimalist icon illustration: a Roman messenger on horseback transforming into digital packets and email envelopes flying forward, gold (#eab308) on dark background, clean vector style, motion lines",
    filename: "icon-send.png"
  },
  followup: {
    prompt: "Minimalist icon illustration: Roman legion formation with shields showing email notification badges, persistent and relentless aesthetic, gold (#eab308) on dark background, clean vector style",
    filename: "icon-followup.png"
  },
  problem1: {
    prompt: "Illustration: overwhelmed entrepreneur drowning in spreadsheets and sticky notes, cluttered desk, stressed expression, muted colors with gold accent highlights, professional editorial style, no text",
    filename: "problem-lists.png"
  },
  problem2: {
    prompt: "Illustration: writer's block represented by a person staring at blank screen with crumpled papers, clock showing late hour, muted colors with gold accents, professional editorial style",
    filename: "problem-writing.png"
  },
  problem3: {
    prompt: "Illustration: person juggling multiple dashboards and analytics screens chaotically, overwhelmed expression, muted colors with gold accents, professional style",
    filename: "problem-managing.png"
  },
  caesar: {
    prompt: "Professional portrait: modern AI entity styled as Roman Caesar, digital/holographic aesthetic with gold laurel wreath, confident expression, dark background with subtle matrix/data patterns, professional and trustworthy, cinematic lighting",
    filename: "caesar-avatar.png"
  },
  pattern: {
    prompt: "Seamless tileable pattern: subtle Roman architectural elements (columns, arches) combined with circuit board traces, very dark navy (#0f0f0f) with slightly lighter lines (#1a1a1a), minimalist, for website background",
    filename: "bg-pattern.png"
  }
};

async function generateImage(prompt, filename) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1792x1024",
      quality: "hd",
      style: "vivid"
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.error) {
            reject(new Error(result.error.message));
          } else {
            resolve(result.data[0].url);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  const outputDir = path.join(__dirname, '..', 'images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const key = process.argv[2];
  
  if (key && PROMPTS[key]) {
    // Generate single image
    const item = PROMPTS[key];
    console.log(`Generating: ${key}...`);
    try {
      const url = await generateImage(item.prompt, item.filename);
      const filepath = path.join(outputDir, item.filename);
      await downloadImage(url, filepath);
      console.log(`✅ Saved: ${filepath}`);
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
    }
  } else if (!key) {
    // Generate all
    console.log('Generating all images...');
    for (const [name, item] of Object.entries(PROMPTS)) {
      console.log(`\nGenerating: ${name}...`);
      try {
        const url = await generateImage(item.prompt, item.filename);
        const filepath = path.join(outputDir, item.filename);
        await downloadImage(url, filepath);
        console.log(`✅ Saved: ${filepath}`);
      } catch (err) {
        console.error(`❌ Error generating ${name}: ${err.message}`);
      }
      // Rate limit delay
      await new Promise(r => setTimeout(r, 2000));
    }
  } else {
    console.log('Available keys:', Object.keys(PROMPTS).join(', '));
  }
}

main().catch(console.error);
