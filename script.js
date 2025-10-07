/* Minimal, dependency-free gameplay */
const towerEl = document.getElementById('tower');
const meterEl = document.getElementById('meter');
const stabilityBar = document.getElementById('stabilityBar');
const stabilityLabel = document.getElementById('stabilityLabel');
const intro = document.getElementById('intro');
const questionPanel = document.getElementById('questionPanel');
const resultPanel = document.getElementById('resultPanel');
const startBtn = document.getElementById('startBtn');
const playAgain = document.getElementById('playAgain');
const viewBreakdown = document.getElementById('viewBreakdown');
const breakdown = document.getElementById('breakdown');
const summaryList = document.getElementById('summaryList');

const btnHelp = document.getElementById('btnHelp');
const helpModal = document.getElementById('helpModal');
const closeHelp = document.getElementById('closeHelp');

// Basic model for blocks
const COLORS = ['red','yellow','blue','green'];
let stability = 100;
let currentQ = 0;
let historyLog = [];

const QUESTIONS = [
  {
    topic: 'Integrity',
    color: 'red',
    text: 'You spot a small data mistake that benefits your team. Timeline is tight. What do you do?',
    options: [
      {label:'Flag it and correct before submission.', effect:{stability:+5, remove:null}, tone:'good'},
      {label:'Let it slide this time; fix later.', effect:{stability:-18, remove:'red'}, tone:'risky'},
      {label:'Say nothing and hope no one notices.', effect:{stability:-25, remove:'red'}, tone:'bad'}
    ]
  },
  {
    topic: 'Respect',
    color: 'yellow',
    text: 'A colleague is repeatedly talked over in a meeting.',
    options: [
      {label:'Pause the room and invite their view in.', effect:{stability:+5, remove:null}, tone:'good'},
      {label:'Share their point afterwards 1:1.', effect:{stability:-8, remove:'yellow'}, tone:'meh'},
      {label:'Keep quiet — it's not your role.', effect:{stability:-18, remove:'yellow'}, tone:'risky'}
    ]
  },
  {
    topic: 'Compliance',
    color: 'blue',
    text: 'A client asks you to use an unapproved tool for speed.',
    options: [
      {label:'Offer an approved alternative and explain why.', effect:{stability:+5, remove:null}, tone:'good'},
      {label:'Use it just this once, no records.', effect:{stability:-22, remove:'blue'}, tone:'bad'},
      {label:'Ask forgiveness later.', effect:{stability:-15, remove:'blue'}, tone:'risky'}
    ]
  },
  {
    topic: 'Teamwork',
    color: 'green',
    text: 'End-of-day crunch: you finish early while others are stuck.',
    options: [
      {label:'Jump in to help unblock the team.', effect:{stability:+5, remove:null}, tone:'good'},
      {label:'Share tips in chat but log off.', effect:{stability:-8, remove:'green'}, tone:'meh'},
      {label:'Clock out — tomorrow is another day.', effect:{stability:-14, remove:'green'}, tone:'risky'}
    ]
  },
  {
    topic: 'Integrity',
    color: 'red',
    text: 'You receive a gift from a supplier during a bid.',
    options: [
      {label:'Declare and follow the gift policy.', effect:{stability:+5, remove:null}, tone:'good'},
      {label:'Accept but don't tell anyone.', effect:{stability:-24, remove:'red'}, tone:'bad'},
      {label:'Politely decline and explain.', effect:{stability:+5, remove:null}, tone:'good'}
    ]
  }
];

function buildTower(rows=5){
  towerEl.innerHTML = '';
  const pattern = ['red','yellow','blue','green','red','yellow']; // distribute colours
  let p = 0;
  for(let r=0; r<rows; r++){
    const row = document.createElement('div');
    row.className = 'row';
    for(let c=0; c<3; c++){
      const block = document.createElement('div');
      const color = pattern[(p++) % pattern.length];
      block.className = 'block ' + color;
      block.dataset.color = color;
      row.appendChild(block);
    }
    towerEl.appendChild(row);
  }
}

function setStability(delta){
  stability = Math.max(0, Math.min(100, stability + delta));
  stabilityBar.style.width = stability + '%';
  stabilityLabel.textContent = 'Stability: ' + stability + '%';
}

function removeBlock(color){
  // remove the highest block of given colour
  const blocks = Array.from(towerEl.querySelectorAll('.block.'+color));
  if(blocks.length === 0){
    wobble();
    return false;
  }
  const block = blocks[0]; // appear 'topmost' as we build from top
  block.style.transition = 'transform .35s, opacity .35s';
  block.style.transform = 'translateY(60px) rotate(6deg)';
  block.style.opacity = '0';
  setTimeout(()=> block.remove(), 360);
  wobble();
  return true;
}

function wobble(){
  towerEl.classList.remove('wobble');
  void towerEl.offsetWidth; // reflow
  towerEl.classList.add('wobble');
}

function collapse(){
  towerEl.classList.add('collapse');
}

function showQuestion(i){
  const q = QUESTIONS[i];
  if(!q){ return endGame(); }

  const qPanel = document.getElementById('questionPanel');
  const answers = document.getElementById('answers');
  const qTitle = document.getElementById('qTitle');
  const qText = document.getElementById('qText');
  const qTopic = document.getElementById('qTopic');

  qTitle.textContent = 'Scenario ' + (i+1) + ' of ' + QUESTIONS.length;
  qText.textContent = q.text;
  qTopic.textContent = q.topic;
  qTopic.style.background = topicColor(q.color);

  answers.innerHTML = '';
  q.options.forEach((opt, idx)=>{
    const btn = document.createElement('button');
    btn.className = 'answer';
    btn.textContent = opt.label;
    btn.addEventListener('click', ()=>{
      // apply effect
      setStability(opt.effect.stability);
      if(opt.effect.remove){ removeBlock(opt.effect.remove); }
      historyLog.push({qIndex:i, choice:opt.label, topic:q.topic, tone:opt.tone, delta:opt.effect.stability, removed:opt.effect.remove});
      currentQ++;
      // check collapse
      if(stability <= 0){
        collapse();
        setTimeout(endGame, 900);
      } else {
        showQuestion(currentQ);
      }
    });
    answers.appendChild(btn);
  });

  intro.hidden = true;
  resultPanel.hidden = true;
  qPanel.hidden = false;
}

function topicColor(color){
  switch(color){
    case 'red': return '#e81e2a';
    case 'yellow': return '#ffd84d';
    case 'blue': return '#2ea8ff';
    case 'green': return '#20d07a';
  }
  return '#111';
}

function endGame(){
  document.getElementById('questionPanel').hidden = true;
  const title = document.getElementById('resultTitle');
  const text = document.getElementById('resultText');
  const negatives = historyLog.filter(h => h.delta < 0).length;
  const goods = historyLog.filter(h => h.delta > 0).length;

  if(stability > 0){
    title.textContent = 'Nice work — your tower stands!';
    text.textContent = `You made ${goods} principled calls and kept stability at ${stability}%.`;
  } else {
    title.textContent = 'Whoops — the tower collapsed!';
    text.textContent = `Risky choices stacked up (${negatives} hits). Try again and aim to remove fewer high-impact blocks.`;
  }

  // build breakdown
  summaryList.innerHTML = '';
  historyLog.forEach(h=>{
    const li = document.createElement('li');
    li.textContent = `${QUESTIONS[h.qIndex].topic}: "${h.choice}" (${h.delta >= 0 ? '+' : ''}${h.delta} stability${h.removed ? `, removed ${h.removed}`:''})`;
    summaryList.appendChild(li);
  });

  resultPanel.hidden = false;
}

function resetGame(){
  stability = 100;
  currentQ = 0;
  historyLog = [];
  towerEl.classList.remove('collapse');
  buildTower(5);
  setStability(0);
  intro.hidden = false;
  questionPanel.hidden = true;
  resultPanel.hidden = true;
}

// Events
startBtn.addEventListener('click', ()=>{
  resetGame();
  showQuestion(0);
});
playAgain.addEventListener('click', ()=>{
  resetGame();
  showQuestion(0);
});
viewBreakdown.addEventListener('click', ()=>{
  breakdown.hidden = !breakdown.hidden;
});

btnHelp.addEventListener('click', ()=> helpModal.hidden = false);
closeHelp.addEventListener('click', ()=> helpModal.hidden = true);
helpModal.addEventListener('click', (e)=>{
  if(e.target === helpModal){ helpModal.hidden = true; }
});

// Boot
resetGame();
