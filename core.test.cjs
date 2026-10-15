const a = require("node:assert/strict"),
  t = require("./core.js");
a.equal(
  t.prompt(3, () => 0),
  "about about about",
);
a.equal(t.prompt(3, () => 0.999).split(" ").length, 3);
a.equal(t.metrics("hello world", "hello world", 30).wpm, 4);
a.equal(t.metrics("hello", "hxllo", 60).accuracy, 80);
a.equal(t.metrics("hello", "hxllo", 60).errors, 1);
a.equal(t.metrics("hello", "hello", 0).wpm, 0);
a.equal(t.metrics("hello", "", 5).accuracy, 100);
a.equal(t.metrics("hello", "helloextra", 60).typed, 5);
a.equal(t.remaining(1000, 16000, 30), 15);
a.equal(t.remaining(0, 40000, 30), 0);
a.deepEqual(t.cleanHistory(null), []);
a.deepEqual(
  t.cleanHistory([{ mode: 30, wpm: -2, accuracy: 100, seconds: 30, time: 0 }]),
  [],
);
a.equal(
  t.cleanHistory(
    Array.from({ length: 60 }, () => ({
      mode: 30,
      wpm: 40,
      accuracy: 100,
      seconds: 30,
      time: 0,
    })),
  ).length,
  50,
);
console.log("13 core assertions passed");
