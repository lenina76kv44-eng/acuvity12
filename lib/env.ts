export const env = (k: string, d = "") => {
  const v = process.env[k];
  return typeof v === "string" ? v.trim() : d;
};

export const asArray = (v: unknown) => (Array.isArray(v) ? v : []);

export const okJson = (data: any, init: number | ResponseInit = 200) =>
  Response.json(data, typeof init === "number" ? { status: init } : init);

export const badJson = (msg: string, code = 400) =>
  okJson({ ok: false, error: msg }, code);