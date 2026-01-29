const dialogueText = document.getElementById('dialogue-text');
const speakerName = document.getElementById('speaker-name');
const nextIndicator = document.getElementById('next-indicator');
const choicesContainer = document.getElementById('choices-container');
const dialogueBox = document.getElementById('dialogue-box');

// Dialogue Data
// Use a simple ID-based system
const script = {
    'start': {
        text: "こんにちは！私のポートフォリオへようこそ。来てくれて嬉しいです！",
        next: 'intro_2'
    },
    'intro_2': {
        text: "私はインタラクティブなWeb体験を作るのが大好きなエンジニアです。何について知りたいですか？",
        choices: [
            { text: "スキルについて", target: 'skills' },
            { text: "作った作品を見る", target: 'works' },
            { text: "連絡先を教える", target: 'contact' }
        ]
    },
    // Skills Branch
    'skills': {
        text: "フロントエンド開発が得意です。JavaScript, React, そしてクリエイティブコーディングが大好きです！",
        next: 'skills_2'
    },
    'skills_2': {
        text: "ただ動くだけでなく、使っていて「楽しい」と感じられるもの作りを心がけています。",
        next: 'loop'
    },
    // Works Branch
    'works': {
        text: "もちろんです！ECサイトやコーポレートサイト、そして今遊んでいるようなミニゲームも作れます。",
        next: 'works_2'
    },
    'works_2': {
        text: "詳しい実績リストは、このサイトの「ミュージアム」セクションで見ることができますよ！後で行ってみてくださいね。",
        next: 'loop'
    },
    // Contact Branch
    'contact': {
        text: "メールでのご連絡はこちらまで: hello@example.com",
        next: 'contact_2'
    },
    'contact_2': {
        text: "新しいプロジェクトや面白いコラボレーションのご相談、いつでもお待ちしています！",
        next: 'loop'
    },
    // Loop back
    'loop': {
        text: "他に知りたいことはありますか？",
        choices: [
            { text: "スキルについて", target: 'skills' },
            { text: "作品について", target: 'works' },
            { text: "連絡先", target: 'contact' },
            { text: "もう大丈夫！", target: 'end' }
        ]
    },
    'end': {
        text: "お話できて楽しかったです！他のゲームもぜひ遊んでみてくださいね。",
        next: null // End state
    }
};

let currentId = 'start';
let isTyping = false;
let typeInterval;

function showDialogue(id) {
    const node = script[id];
    if (!node) return;

    currentId = id;
    dialogueText.innerHTML = "";
    nextIndicator.classList.add('hidden');
    choicesContainer.classList.add('hidden');
    choicesContainer.innerHTML = ""; // Clear old buttons

    // Typing Effect
    let i = 0;
    const text = node.text;
    isTyping = true;

    typeInterval = setInterval(() => {
        dialogueText.textContent += text.charAt(i);
        i++;
        if (i >= text.length) {
            clearInterval(typeInterval);
            isTyping = false;
            onTypingComplete(node);
        }
    }, 30); // Typing speed
}

function onTypingComplete(node) {
    if (node.choices) {
        // Show choices
        node.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = choice.text;
            btn.onclick = () => showDialogue(choice.target);
            choicesContainer.appendChild(btn);
        });
        choicesContainer.classList.remove('hidden');
    } else if (node.next) {
        // Show next arrow
        nextIndicator.classList.remove('hidden');
    }
}

function next() {
    if (isTyping) {
        // Skip typing
        clearInterval(typeInterval);
        dialogueText.textContent = script[currentId].text;
        isTyping = false;
        onTypingComplete(script[currentId]);
        return;
    }

    const node = script[currentId];
    if (node.next) {
        showDialogue(node.next);
    }
}

// Input
dialogueBox.addEventListener('click', next);
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') next();
});

// Init
showDialogue('start');
