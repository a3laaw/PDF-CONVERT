/* اختبار اصطناعي لمنطق watchStageFailure — نفس الكود المنسوخ من cad-viewer.tsx */
(() => {
  const fmtErrArg = (a) => {
    const m = a;
    const base = `${m?.name || ""} ${m?.message || a}`;
    return m?.code ? `${base} code:${m.code}` : base;
  };
  const FATAL_WASM_RE =
    /memory access out of bounds|worker_oom|out of memory|abort\(|runtime abort/i;
  const BENIGN_ENTITY_STAGE_RE = /conversion stage ['"]?ENTITY['"]?/i;
  const classify = (args) => {
    const s = args.map(fmtErrArg).join(" ");
    if (!/conversion stage/i.test(s)) return "pass-through";
    if (BENIGN_ENTITY_STAGE_RE.test(s) && !FATAL_WASM_RE.test(s))
      return "benign-rerouted";
    const m = /code:\s*"?([A-Za-z_]+)"?/.exec(s);
    return "REJECT:" + (m ? m[1] : "worker_error");
  };
  const oomErr = Object.assign(new Error("Aborted(worker_oom)"), {
    code: "worker_oom",
  });
  const cases = {
    user1_illegal_params_entity: [
      "Error occurred in conversion stage 'ENTITY': ",
      new ReferenceError("Illegal Parameters"),
    ],
    user2_oom_parse: [
      "Error occurred in conversion stage 'PARSE': ",
      oomErr,
    ],
    fatal_wasm_in_entity: [
      "Error occurred in conversion stage 'ENTITY': ",
      new Error("memory access out of bounds"),
    ],
    header_stage_fail: [
      "Error occurred in conversion stage 'HEADER': ",
      new Error("bad header"),
    ],
    non_stage_log: ["some random error", new Error("whatever")],
  };
  const out = {};
  for (const [k, v] of Object.entries(cases)) out[k] = classify(v);
  const expect = {
    user1_illegal_params_entity: "benign-rerouted",
    user2_oom_parse: "REJECT:worker_oom",
    fatal_wasm_in_entity: "REJECT:worker_error",
    header_stage_fail: "REJECT:worker_error",
    non_stage_log: "pass-through",
  };
  let pass = 0;
  const rows = [];
  for (const k of Object.keys(expect)) {
    const ok = out[k] === expect[k];
    if (ok) pass++;
    rows.push(`${ok ? "PASS" : "FAIL"} ${k}: got=${out[k]} want=${expect[k]}`);
  }
  return `${pass}/5 ✓ | ${rows.join(" | ")}`;
})()
