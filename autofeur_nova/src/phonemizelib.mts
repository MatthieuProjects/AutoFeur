import { request } from "undici";

export const PHONEMIZER = process.env.PHONEMIZER || "http://localhost:5000";
export const phonemize = (grapheme: string) =>
  request(`${PHONEMIZER}?grapheme=${encodeURIComponent(grapheme)}`).then((x) =>
    x.body.text()
  );
