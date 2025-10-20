// === Torn Racing Skill Overlay ===
// Shows each racer's Racing Skill on the leaderboard at https://www.torn.com/page.php?sid=racing

const API_KEY = "yLp4OoENbjRy30GZ"; // <-- replace with your own Torn API key
const API_BASE = "https://api.torn.com/v2/user";

const CACHE_KEY = "racingSkillCache";
const CACHE_TTL_MS = 1 * 60 * 60 * 1000; // 🕐 1 hour

// --- Cache helpers ---

function getCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCache(cache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function getCachedSkill(userId) {
  const cache = getCache();
  const entry = cache[userId];
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    console.log(`[RacingSkill] Cache expired for ${userId} (${(age / 1000 / 60).toFixed(1)} min old)`);
    delete cache[userId];
    saveCache(cache);
    return null;
  }

  return entry.value;
}

function setCachedSkill(userId, value) {
  const cache = getCache();
  cache[userId] = { value, timestamp: Date.now() };
  saveCache(cache);
}

// --- API fetch ---

async function fetchRacingSkill(userId) {
  try {
    const res = await fetch(`${API_BASE}/${userId}/hof?key=${API_KEY}`);
    const data = await res.json();

    if (data.error) {
      console.warn(`[RacingSkill] API error for ${userId}: ${data.error.error}`);
      return null;
    }

    const skill =
      data?.hof?.racing_skill?.value ??
      data?.user?.hof?.racing_skill?.value ??
      null;

    return typeof skill === "number" ? skill : parseFloat(skill) || null;
  } catch (err) {
    console.error(`[RacingSkill] Fetch failed for ${userId}:`, err);
    return null;
  }
}

async function getRacingSkill(userId) {
  // Try cache first
  const cached = getCachedSkill(userId);
  if (cached != null) {
    console.log(`[RacingSkill] Using cached value for ${userId}: ${cached}`);
    return cached;
  }

  // Otherwise fetch and store
  const skill = await fetchRacingSkill(userId);
  if (skill != null) {
    setCachedSkill(userId, skill);
  }
  return skill;
}

// --- Utilities ---
const delay = ms => new Promise(res => setTimeout(res, ms));

// --- Main logic ---
async function annotateRacers() {
  const racers = document.querySelectorAll("#leaderBoard > li[id^='lbr-']");
  if (!racers.length) return;

  console.log(`[RacingSkill] Found ${racers.length} racers`);

  for (const li of racers) {
    const userId = li.id.replace("lbr-", "");
    const nameWrapper = li.querySelector(".name");
    const nameElem = nameWrapper?.querySelector("span");
    const playerName = nameElem?.textContent?.trim() ?? "Unknown";

    // Skip if already injected
    if (nameWrapper.querySelector(".racing-skill-badge")) continue;

    const skill = await getRacingSkill(userId);
    console.log(`[RacingSkill] ${playerName} (ID: ${userId}) → Skill: ${skill}`);

    if (skill == null) continue;

    // Create badge
    const badge = document.createElement("span");
    badge.className = "racing-skill-badge";
    badge.textContent = ` 🏁 ${skill.toFixed(2)}`;
    badge.title = `Racing Skill: ${skill.toFixed(2)}`;
    badge.style.marginLeft = "6px";
    badge.style.fontWeight = "bold";
    badge.style.whiteSpace = "nowrap";
    badge.style.display = "inline-block";
    badge.style.color =
      skill >= 20 ? "#27ae60" : skill >= 10 ? "#f39c12" : "#e74c3c";

    nameWrapper.appendChild(badge);

    await delay(400); // tweak if rate-limited
  }
}

// --- Wait for leaderboard to load ---
function waitForLeaderboard() {
  const check = setInterval(() => {
    const board = document.querySelector("#leaderBoard li");
    if (board) {
      clearInterval(check);
      annotateRacers();
    }
  }, 500);
}

// --- React re-renders: watch for changes ---
function observeLeaderboard() {
  const leaderboard = document.querySelector("#leaderBoard");
  if (!leaderboard) return;

  const observer = new MutationObserver(() => annotateRacers());
  observer.observe(leaderboard, { childList: true, subtree: true });
}

// --- Start ---
waitForLeaderboard();
observeLeaderboard();
