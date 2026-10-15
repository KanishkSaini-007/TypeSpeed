(function (root) {
  const WORDS =
    "about above across after again air all almost along also always among an and animal another answer any around as ask at away back be because become been before began begin behind being below best better between big bird black blue boat book both box boy bring build but by call came can car care carry change children city close cold come common could country course cut day did different do does dog done door down draw dream drive during each early earth east easy eat end enough even ever every example eye face fact fall family far fast father feel few field find fire first fish five floor fly follow food foot for form found four free friend from full game garden gave get girl give go good got great green ground group grow had hand hard has have he head hear heart help her here high hill him his home hope hot hour house how hundred idea if important in inside into is it its job join jump just keep kind know land large last late later learn leave left less let letter life light like line list little live long look love low made make man many mark may me mean men might mile mind miss money more morning most mother move much must my name near need never new next night no north not note now number of off often old on once one only open or order other our out outside over own page paper part pass past path people place plan play point put question quick quiet quite rain ran read real red rest right river road room round rule run said same saw say school sea second see seem sentence set she short should show side simple since sit six sleep slow small so some something song soon sound south space start stay step still stop story street strong study such sun sure table take talk tell ten than thank that the their them then there these they thing think this those though thought three through time to today together too took top town tree true try turn two under until up upon us use usually very voice walk want warm was watch water way we week well went were west what when where which while white who why will wind with without woman word work world would write year yes yet you young your".split(
      " ",
    );
  function prompt(count = 240, rng = Math.random) {
    return Array.from(
      { length: count },
      () =>
        WORDS[
          Math.min(
            WORDS.length - 1,
            Math.max(0, Math.floor(rng() * WORDS.length)),
          )
        ],
    ).join(" ");
  }
  function metrics(target, input, seconds) {
    const text = String(input || "").slice(0, target.length);
    let correct = 0;
    for (let i = 0; i < text.length; i++) if (text[i] === target[i]) correct++;
    const time = Math.max(0, Number(seconds) || 0);
    return {
      wpm: time ? Math.round(correct / 5 / (time / 60)) : 0,
      rawWpm: time ? Math.round(text.length / 5 / (time / 60)) : 0,
      accuracy: text.length ? Math.round((correct / text.length) * 100) : 100,
      correct,
      errors: text.length - correct,
      typed: text.length,
    };
  }
  function remaining(start, now, duration) {
    return Math.max(0, duration - (now - start) / 1000);
  }
  function cleanHistory(value) {
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (r) =>
          r &&
          [30, 60].includes(r.mode) &&
          Number.isFinite(r.wpm) &&
          r.wpm >= 0 &&
          r.wpm <= 2000 &&
          Number.isFinite(r.accuracy) &&
          r.accuracy >= 0 &&
          r.accuracy <= 100 &&
          Number.isFinite(r.seconds) &&
          r.seconds > 0 &&
          r.seconds <= r.mode &&
          Number.isFinite(r.time),
      )
      .slice(-50);
  }
  const api = { WORDS, prompt, metrics, remaining, cleanHistory };
  if (typeof module !== "undefined") module.exports = api;
  root.TS = api;
})(typeof window !== "undefined" ? window : globalThis);
