let chartMetric="wpm";
const $ = (s) => document.querySelector(s),
  KEY = "typespeed.v1";
let history = [],
  mode = 30,
  target = "",
  started = null,
  active = false,
  finished = false,
  interval = null,
  lastInput = "",
  saved = true;
try {
  history = TS.cleanHistory(JSON.parse(localStorage.getItem(KEY)));
} catch {
  saved = false;
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(history));
    saved = true;
  } catch {
    saved = false;
  }
  $("#storageNote").textContent = saved
    ? "History stays in this browser. No account, no leaderboard, no data uploads."
    : "Storage unavailable. Results will be lost when this page closes.";
}
function drawPrompt() {
  const input = $("#typing").value;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < target.length; i++) {
    const s = document.createElement("span");
    s.textContent = target[i];
    s.className =
      i < input.length
        ? input[i] === target[i]
          ? "correct"
          : "wrong"
        : i === input.length
          ? "caret"
          : "";
    frag.append(s);
  }
  $("#prompt").replaceChildren(frag);
  const caret = $("#prompt .caret");
  if (caret) {
    const box = $("#prompt");
    box.scrollTop = caret.offsetTop - 36;
  }
}
function refresh() {
  if (!active) return;
  const left = TS.remaining(started, performance.now(), mode);
  const elapsed = Math.min(mode, (performance.now() - started) / 1000);
  const m = TS.metrics(target, $("#typing").value, Math.max(1, elapsed));
  $("#time").textContent = Math.ceil(left);
  $("#wpm").textContent = m.wpm;
  $("#accuracy").textContent = m.accuracy;
  $("#progress").style.width = (left / mode) * 100 + "%";
  if (left <= 0) finish(mode);
}
function finish(seconds) {
  if (!active) return;
  active = false;
  finished = true;
  clearInterval(interval);
  const m = TS.metrics(target, $("#typing").value, seconds);
  const record = {
    mode,
    wpm: m.wpm,
    accuracy: m.accuracy,
    seconds,
    time: Date.now(),
  };
  history.push(record);
  history = history.slice(-50);
  persist();
  $("#typing").disabled = true;
  document.querySelectorAll("[data-mode]").forEach((b) => (b.disabled = false));
  $("#wpm").textContent = m.wpm;
  $("#accuracy").textContent = m.accuracy;
  $("#time").textContent = Math.max(0, Math.ceil(mode - seconds));
  $("#progress").style.width = Math.max(0, (mode - seconds) / mode * 100) + "%";
  $("#status").textContent = "RUN COMPLETE";
  $("#result").hidden = false;
  $("#resultTitle").textContent = `${m.wpm} wpm. Your rhythm, recorded.`;
  $("#resultDetail").textContent =
    `${m.accuracy}% accuracy · ${m.correct} correct characters · ${m.errors} uncorrected errors · ${seconds.toFixed(1)} seconds`;
  renderHistory();
}
function reset(focus = true) {
  clearInterval(interval);
  active = false;
  finished = false;
  started = null;
  lastInput = "";
  $("#hint").textContent = "Keep spaces between words. Backspace to fix mistakes.";
  target = TS.prompt();
  $("#typing").disabled = false;
  $("#typing").value = "";
  $("#typing").maxLength = target.length;
  $("#time").textContent = mode;
  $("#wpm").textContent = 0;
  $("#accuracy").textContent = 100;
  $("#progress").style.width = "100%";
  $("#status").textContent = "READY WHEN YOU ARE";
  $("#result").hidden = true;
  document.querySelectorAll("[data-mode]").forEach((b) => {
    b.disabled = false;
    b.classList.toggle("selected", +b.dataset.mode === mode);
    b.setAttribute("aria-pressed", String(+b.dataset.mode === mode));
  });
  drawPrompt();
  $("#prompt").scrollTop = 0;
  renderHistory();
  if (focus) $("#typing").focus();
}
$("#typing").addEventListener("input", (e) => {
  if (finished) return;
  const now = performance.now();
  if (active && TS.remaining(started, now, mode) <= 0) {
    $("#typing").value = lastInput;
    finish(mode);
    return;
  }
  if (!active && !e.target.value.length) return;
  if (!active) {
    started = now;
    active = true;
    interval = setInterval(refresh, 100);
    $("#status").textContent = "FIND YOUR FLOW";
    document
      .querySelectorAll("[data-mode]")
      .forEach((b) => (b.disabled = true));
  }
  lastInput = e.target.value;
  drawPrompt();
  refresh();
  if (active && lastInput.length === target.length)
    finish(Math.max(0.1, (performance.now() - started) / 1000));
});
["paste", "drop"].forEach((type) =>
  $("#typing").addEventListener(type, (e) => {
    e.preventDefault();
    $("#hint").textContent =
      "One character at a time. Pasting is disabled for this test.";
  }),
);
document.querySelectorAll("[data-mode]").forEach(
  (b) =>
    (b.onclick = () => {
      mode = +b.dataset.mode;
      reset(false);
    }),
);
$("#restart").onclick = () => reset();
$("#again").onclick = () => reset();
document.addEventListener("keydown", (e) => {
  if (e.altKey && e.key.toLowerCase() === "r") {
    e.preventDefault();
    reset();
  }
});
document.addEventListener("visibilitychange", () => {
  if (active) refresh();
});
$("#clear").onclick = () => {
  if (!history.length) return;
  if (confirm("Delete all saved typing results in this browser?")) {
    history = [];
    persist();
    renderHistory();
  }
};
function renderHistory() {
  const records = history.filter((r) => r.mode === mode),
    last = records.slice(-12);
  $("#chartMode").textContent = `${mode}-SECOND RUNS · ${chartMetric === "wpm" ? "WPM" : "ACCURACY %"}`;
  $("#bestMode").textContent = `/ ${mode} SEC`;
  $("#best").textContent = records.length
    ? Math.max(...records.map((r) => r.wpm))
    : "-";
  $("#count").textContent = records.length;
  $("#bestNote").textContent = records.length
    ? "Your best pace in this mode. Keep the rhythm going."
    : "Your first finish is a fresh benchmark.";
  $("#clear").disabled = !history.length;
  const chart = $("#chart");
  chart.replaceChildren();
  if (!last.length) {
    const empty = document.createElement("div");
    empty.className = "chart-empty";
    const b = document.createElement("b");
    b.textContent = "↗";
    empty.append(
      b,
      document.createTextNode("Your progress starts with one run."),
    );
    chart.append(empty);
  } else {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 560 165");
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      `Last ${last.length} ${mode}-second results: ${last.map((r) => r[chartMetric]).join(", ")} ${chartMetric === "wpm" ? "words per minute" : "percent accuracy"}`,
    );
    const max = chartMetric === "accuracy" ? 100 : Math.max(
      20,
      Math.ceil(Math.max(...last.map((r) => r[chartMetric])) / 20) * 20,
    );
    function shape(tag, attrs) {
      const n = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      svg.append(n);
      return n;
    }
    for (let i = 0; i < 3; i++) {
      const y = 20 + i * 55;
      shape("line", {
        x1: 38,
        y1: y,
        x2: 548,
        y2: y,
        stroke: "#363046",
        "stroke-dasharray": "3 5",
      });
      const label = shape("text", {
        x: 0,
        y: y + 4,
        fill: "#a49bb6",
        "font-size": 9,
        "font-family": "monospace",
      });
      label.textContent = Math.round(max * (1 - i / 2));
    }
    const points = last.map((r, i) => [
      last.length === 1 ? 290 : 45 + (i / (last.length - 1)) * 495,
      130 - (r[chartMetric] / max) * 110,
    ]);
    shape("polyline", {
      points: points.map((p) => p.join(",")).join(" "),
      fill: "none",
      stroke: "#bba4ff",
      "stroke-width": 2.5,
    });
    points.forEach(([x, y], i) => {
      shape("circle", { cx: x, cy: y, r: 4, fill: "#d5c5ff" });
      const value = shape("text", {
        x,
        y: y - 10,
        "text-anchor": "middle",
        fill: "#e3d9ff",
        "font-size": 9,
        "font-family": "monospace",
      });
      value.textContent = last[i][chartMetric];
    });
    const axis = shape("text", {
      x: 45,
      y: 155,
      fill: "#a49bb6",
      "font-size": 8,
      "font-family": "monospace",
    });
    axis.textContent = "OLDER";
    const end = shape("text", {
      x: 540,
      y: 155,
      "text-anchor": "end",
      fill: "#a49bb6",
      "font-size": 8,
      "font-family": "monospace",
    });
    end.textContent = "LATEST";
    chart.append(svg);
  }
  const runs = $("#runs");
  runs.replaceChildren();
  records
    .slice(-5)
    .reverse()
    .forEach((r) => {
      const row = document.createElement("div");
      row.className = "run";
      const date = document.createElement("span");
      date.textContent = new Date(r.time).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const wpm = document.createElement("strong");
      wpm.textContent = `${r.wpm} wpm`;
      const duration = document.createElement("span");
      duration.textContent = `${r.mode}s mode · ${r.seconds.toFixed(1)}s typed`;
      const accuracy = document.createElement("span");
      accuracy.textContent = `${r.accuracy}% accuracy`;
      row.append(date, duration, wpm, accuracy);
      runs.append(row);
    });
}
document.querySelectorAll("[data-chart]").forEach(b=>b.onclick=()=>{chartMetric=b.dataset.chart;document.querySelectorAll("[data-chart]").forEach(n=>n.setAttribute("aria-pressed",String(n===b)));renderHistory()});
reset(false);
if (!saved)
  $("#storageNote").textContent =
    "Storage unavailable. Results will be lost when this page closes.";
