const gachaList = [
    { id: 1, rarity: 'SSR', title: 'Interactive LP System', desc: 'Complex JavaScript game engines integrated into web pages.' },
    { id: 2, rarity: 'SSR', title: '3D WebGL Gallery', desc: 'Immersive 3D environments using Three.js.' },
    { id: 3, rarity: 'SR', title: 'React Application', desc: 'Scalable frontend architecture.' },
    { id: 4, rarity: 'SR', title: 'Animation Library', desc: 'Custom GSAP & CSS animation implementation.' },
    { id: 5, rarity: 'R', title: 'HTML5 Canvas', desc: 'Drawing dynamic graphics via code.' },
    { id: 6, rarity: 'R', title: 'Responsive Design', desc: 'Perfect layout on any device.' },
    { id: 7, rarity: 'R', title: 'Dark Mode', desc: 'User-friendly theme switching.' },
    { id: 8, rarity: 'R', title: 'SEO Optimization', desc: 'Ranking high on search engines.' },
    { id: 9, rarity: 'SR', title: 'Node.js Backend', desc: 'Robust server-side logic.' },
    { id: 10, rarity: 'SSR', title: 'Full Stack Dev', desc: 'Handling both frontend and backend mastery.' }
];

// Weighted Random
const weights = {
    'SSR': 0.1, // 10%
    'SR': 0.3,  // 30%
    'R': 0.6    // 60%
};

// State
let collectedIds = JSON.parse(localStorage.getItem('gacha_collection')) || [];
let isAnimating = false;

// Elements
const playBtn = document.getElementById('play-btn');
const handle = document.getElementById('handle');
const resultModal = document.getElementById('result-modal');
const collectionModal = document.getElementById('collection-modal');
const collectionBtn = document.getElementById('collection-btn');
const closeResultBtn = document.getElementById('close-result');
const closeCollectionBtn = document.getElementById('close-collection');
const resultCard = document.getElementById('result-card');

// Update UI
updateCollectionCount();

function updateCollectionCount() {
    const count = collectedIds.length;
    const total = gachaList.length;
    document.getElementById('collected-count').innerText = count;
    document.getElementById('total-count').innerText = total;
}

function saveCollection() {
    localStorage.setItem('gacha_collection', JSON.stringify(collectedIds));
}

function rollGacha() {
    if (isAnimating) return;
    isAnimating = true;
    playBtn.disabled = true;

    // 1. Determine Result
    const rand = Math.random();
    let selectedRarity = 'R';
    if (rand < weights.SSR) selectedRarity = 'SSR';
    else if (rand < weights.SSR + weights.SR) selectedRarity = 'SR';

    const pool = gachaList.filter(item => item.rarity === selectedRarity);
    const item = pool[Math.floor(Math.random() * pool.length)];

    // 2. Animation
    handle.classList.add('spin');

    // Sound placeholder
    // playSound('turn');

    setTimeout(() => {
        handle.classList.remove('spin');

        // Show capsule appearing?
        // For now, just jump to result after delay

        showResult(item);

        isAnimating = false;
        playBtn.disabled = false;
    }, 1500);
}

function showResult(item) {
    // Check if new
    const isNew = !collectedIds.includes(item.id);
    if (isNew) {
        collectedIds.push(item.id);
        saveCollection();
        updateCollectionCount();
    }

    // Populate Modal
    const rEl = document.getElementById('result-rarity');
    rEl.className = item.rarity.toLowerCase();
    rEl.innerText = isNew ? `NEW! ${item.rarity}` : item.rarity;

    document.getElementById('result-title').innerText = item.title;
    document.getElementById('result-desc').innerText = item.desc;

    resultModal.classList.remove('hidden');
    document.getElementById('capsule-open-anim').classList.remove('hidden'); // Optional anim hook
    resultCard.classList.remove('hidden');
}

function showCollection() {
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';

    gachaList.forEach(item => {
        const div = document.createElement('div');
        const unlocked = collectedIds.includes(item.id);
        div.className = `collection-item ${item.rarity.toLowerCase()} ${unlocked ? 'unlocked' : ''}`;

        if (unlocked) {
            div.innerHTML = `
                <div>${item.title}</div>
            `;
            div.onclick = () => {
                // Show detail logic reuse? 
                // For simplicity, just alert description or nothing
                alert(`${item.title}\n\n${item.desc}`);
            };
        } else {
            div.innerText = "?";
        }
        grid.appendChild(div);
    });

    collectionModal.classList.remove('hidden');
}

// Events
playBtn.addEventListener('click', rollGacha);
collectionBtn.addEventListener('click', showCollection);
closeResultBtn.addEventListener('click', () => resultModal.classList.add('hidden'));
closeCollectionBtn.addEventListener('click', () => collectionModal.classList.add('hidden'));
