// Code of Conduct Jenga – clean, safe build (no smart quotes)
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    // ---- element refs
    var towerEl = document.getElementById("tower");
    var stabilityBar = document.getElementById("stabilityBar");
    var stabilityLabel = document.getElementById("stabilityLabel");
    var intro = document.getElementById("intro");
    var questionPanel = document.getElementById("questionPanel");
    var resultPanel = document.getElementById("resultPanel");
    var startBtn = document.getElementById("startBtn");
    var playAgain = document.getElementById("playAgain");
    var viewBreakdown = document.getElementById("viewBreakdown");
    var breakdown = document.getElementById("breakdown");
    var summaryList = document.getElementById("summaryList");
    var btnHelp = document.getElementById("btnHelp");
    var helpModal = document.getElementById("helpModal");
    var closeHelp = document.getElementById("closeHelp");

    // make sure buttons never act like "submit"
    if (startBtn) startBtn.type = "button";
    if (playAgain) playAgain.type = "button";
    if (viewBreakdown) viewBreakdown.type = "button";
    if (btnHelp) btnHelp.type = "button";

    // ---- game state
    var stability = 100;
    var currentQ = 0;
    var historyLog = [];

    // NOTE: all strings use straight quotes only
    var QUESTIONS = [
      {
        topic: "Integrity",
        color: "red",
        text: "You spot a small data mistake that benefits your team. Timeline is tight. What do you do?",
        options: [
          { label: "Flag it and correct before submission.", effect: { stability: 5, remove: null }, tone: "good" },
          { label: "Let it slide this time; fix later.", effect: { stability: -18, remove: "red" }, tone: "risky" },
          { label: "Say nothing and hope no one notices.", effect: { stability: -25, remove: "red" }, tone: "bad" }
        ]
      },
      {
        topic: "Respect",
        color: "yellow",
        text: "A colleague is repeatedly talked over in a meeting.",
        options: [
          { label: "Pause the room and invite their view in.", effect: { stability: 5, remove: null }, tone: "good" },
          { label: "Share their point afterwards 1:1.", effect: { stability: -8, remove: "yellow" }, tone: "meh" },
          { label: "Keep quiet — it's not your role.", effect: { stability: -18, remove: "yellow" }, tone: "risky" }
        ]
      },
      {
        topic: "Compliance",
        color: "blue",
        text: "A client asks you to use an unapproved tool for speed.",
        options: [
          { label: "Offer an approved alternative and explain why.", effect: { stability: 5, remove: null }, tone: "good" },
          { label: "Use it just this once, no records.", effect: { stability: -22, remove: "blue" }, tone: "bad" },
          { label: "Ask forgiveness later.", effect: { stability: -15, remove: "blue" }, tone: "risky" }
        ]
      },
      {
        topic: "Teamwork",
        color: "green",
        text: "End-of-day crunch: you finish early while others are stuck.",
        options: [
          { label: "Jump in to help unblock the team.", effect: { stability: 5, remove: null }, tone: "good" },
          { label: "Share tips in chat but log off.", effect: { stability: -8, remove: "green" }, tone: "meh" },
          { label: "Clock out — tomorrow is another day.", effect: { stability: -14, remove: "green" }, tone: "risky" }
        ]
      },
      {
        topic: "Integrity",
        color: "red",
        text: "You receive a gift from a supplier during a bid.",
        options: [
          { label: "Declare and follow the gift policy.", effect: { stability: 5, remove: null }, tone: "good" },
          { label: "Accept but don't tell anyone.", effect: { stability: -24, remove: "red" }, tone: "bad" },
          { label: "Politely decline and explain.", effect: { stability: 5, remove: null }, tone: "good" }
        ]
      }
    ];

    // ---- tower build
    function buildTower(rows) {
      if (rows === void 0) rows = 5;
      towerEl.innerHTML = "";
      var pattern = ["red", "yellow", "blue", "green", "red", "yellow"];
      var p = 0;
      for (var r = 0; r < rows; r++) {
        var row = document.createElement("div");
        row.className = "row";
        for (var c = 0; c < 3; c++) {
          var block = document.createElement("div");
          var color = pattern[p % pattern.length];
          p++;
          block.className = "block " + color;
          block.dataset.color = color;
          row.appendChild(block);
        }
        // top-most rows are appended first so removal prefers "visible top"
        towerEl.appendChild(row);
      }
    }

    function setStability(delta) {
      stability = Math.max(0, Math.min(100, stability + delta));
      stabilityBar.style.width = stability + "%";
      stabilityLabel.textContent = "Stability: " + stability + "%";
    }

    function wobble() {
      towerEl.classList.remove("wobble");
      // reflow to restart animation
      void towerEl.offsetWidth;
      towerEl.classList.add("wobble");
    }

    function removeBlock(color) {
      var blocks = Array.prototype.slice.call(towerEl.querySelectorAll(".block." + color));
      if (blocks.length === 0) {
        wobble();
        return false;
      }
      var block = blocks[0];
      block.style.transition = "transform .35s, opacity .35s";
      block.style.transform = "translateY(60px) rotate(6deg)";
      block.style.opacity = "0";
      setTimeout(function () { if (block && block.parentNode) block.parentNode.removeChild(block); }, 360);
      wobble();
      return true;
    }

    function collapse() {
      towerEl.classList.add("collapse");
    }

    function topicColor(color) {
      if (color === "red") return "#e81e2a";
      if (color === "yellow") return "#ffd84d";
      if (color === "blue") return "#2ea8ff";
      if (color === "green") return "#20d07a";
      return "#111";
    }

    function showQuestion(i) {
      var q = QUESTIONS[i];
      if (!q) { endGame(); return; }

      var qTitle = document.getElementById("qTitle");
      var qText = document.getElementById("qText");
      var qTopic = document.getElementById("qTopic");
      var answers = document.getElementById("answers");

      qTitle.textContent = "Scenario " + (i + 1) + " of " + QUESTIONS.length;
      qText.textContent = q.text;
      qTopic.textContent = q.topic;
      qTopic.style.background = topicColor(q.color);

      answers.innerHTML = "";
      q.options.forEach(function (opt) {
        var btn = document.createElement("button");
        btn.className = "answer";
        btn.type = "button";
        btn.textContent = opt.label;
        btn.addEventListener("click", function () {
          setStability(opt.effect.stability);
          if (opt.effect.remove) removeBlock(opt.effect.remove);
          historyLog.push({
            qIndex: i,
            choice: opt.label,
            topic: q.topic,
            tone: opt.tone,
            delta: opt.effect.stability,
            removed: opt.effect.remove
          });
          currentQ++;
          if (stability <= 0) {
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
      questionPanel.hidden = false;
    }

    function endGame() {
      questionPanel.hidden = true;
      var title = document.getElementById("resultTitle");
      var text = document.getElementById("resultText");
      var negatives = historyLog.filter(function (h) { return h.delta < 0; }).length;
      var goods = historyLog.filter(function (h) { return h.delta > 0; }).length;

      if (stability > 0) {
        title.textContent = "Nice work — your tower stands!";
        text.textContent = "You made " + goods + " principled calls and kept stability at " + stability + "%.";
      } else {
        title.textContent = "Whoops — the tower collapsed!";
        text.textContent = "Risky choices stacked up (" + negatives + " hits). Try again and aim to remove fewer high-impact blocks.";
      }

      // breakdown
      summaryList.innerHTML = "";
      historyLog.forEach(function (h) {
        var li = document.createElement("li");
        var sign = h.delta >= 0 ? "+" : "";
        li.textContent = QUESTIONS[h.qIndex].topic + ": \"" + h.choice + "\" (" + sign + h.delta + " stability" + (h.removed ? ", removed " + h.removed : "") + ")";
        summaryList.appendChild(li);
      });

      resultPanel.hidden = false;
    }

    function resetGame() {
      stability = 100;
      currentQ = 0;
      historyLog = [];
      towerEl.classList.remove("collapse");
      buildTower(5);
      setStability(0);
      intro.hidden = false;
      questionPanel.hidden = true;
      resultPanel.hidden = true;
    }

    // ---- events
    if (startBtn) startBtn.addEventListener("click", function () { resetGame(); showQuestion(0); });
    if (playAgain) playAgain.addEventListener("click", function () { resetGame(); showQuestion(0); });
    if (viewBreakdown) viewBreakdown.addEventListener("click", function () { breakdown.hidden = !breakdown.hidden; });
    if (btnHelp) btnHelp.addEventListener("click", function () { if (helpModal) helpModal.hidden = false; });
    if (closeHelp) closeHelp.addEventListener("click", function () { if (helpModal) helpModal.hidden = true; });
    if (helpModal) helpModal.addEventListener("click", function (e) { if (e.target === helpModal) helpModal.hidden = true; });

    // ---- initial boot
    resetGame();

    var jsStatus = document.getElementById("jsStatus");
    if (jsStatus) jsStatus.classList.add("hidden");
    console.log("Jenga demo ready");
  });
})();
