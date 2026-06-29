import { z } from "zod";

//#region src/schemas/index.d.ts
declare const posSchema: z.ZodEnum<{
  noun: "noun";
  verb: "verb";
  article: "article";
  adjective: "adjective";
  preposition: "preposition";
  pronoun: "pronoun";
  conjunction: "conjunction";
  adverb: "adverb";
  other: "other";
}>;
declare const relationSchema: z.ZodEnum<{
  in: "in";
  on: "on";
  over: "over";
  above: "above";
  under: "under";
  below: "below";
  beside: "beside";
  between: "between";
  behind: "behind";
  infront: "infront";
  at: "at";
}>;
declare const articleAnswerSchema: z.ZodEnum<{
  a: "a";
  an: "an";
  the: "the";
  ", ": ", ";
}>;
declare const vec2Schema: z.ZodObject<{
  x: z.ZodNumber;
  y: z.ZodNumber;
}, z.core.$strip>;
/** A durable visual-asset reference (emoji / registered SVG id / image URL). */
declare const iconRefSchema: z.ZodObject<{
  kind: z.ZodEnum<{
    emoji: "emoji";
    svg: "svg";
    image: "image";
  }>;
  id: z.ZodOptional<z.ZodString>;
  src: z.ZodOptional<z.ZodString>;
  alt: z.ZodString;
}, z.core.$strip>;
/** Back-compat union: a plain string (emoji, or a scene backdrop key) OR an IconRef. */
declare const iconValueSchema: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
  kind: z.ZodEnum<{
    emoji: "emoji";
    svg: "svg";
    image: "image";
  }>;
  id: z.ZodOptional<z.ZodString>;
  src: z.ZodOptional<z.ZodString>;
  alt: z.ZodString;
}, z.core.$strip>]>;
declare const deckItemSchema: z.ZodObject<{
  term: z.ZodString;
  translation: z.ZodString;
  transliteration: z.ZodOptional<z.ZodString>;
  audioUrl: z.ZodOptional<z.ZodString>;
  icon: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    kind: z.ZodEnum<{
      emoji: "emoji";
      svg: "svg";
      image: "image";
    }>;
    id: z.ZodOptional<z.ZodString>;
    src: z.ZodOptional<z.ZodString>;
    alt: z.ZodString;
  }, z.core.$strip>]>>;
  example: z.ZodOptional<z.ZodString>;
  tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
declare const deckSchema: z.ZodObject<{
  title: z.ZodOptional<z.ZodString>;
  termLang: z.ZodString;
  transLang: z.ZodString;
  items: z.ZodArray<z.ZodObject<{
    term: z.ZodString;
    translation: z.ZodString;
    transliteration: z.ZodOptional<z.ZodString>;
    audioUrl: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
      kind: z.ZodEnum<{
        emoji: "emoji";
        svg: "svg";
        image: "image";
      }>;
      id: z.ZodOptional<z.ZodString>;
      src: z.ZodOptional<z.ZodString>;
      alt: z.ZodString;
    }, z.core.$strip>]>>;
    example: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
  }, z.core.$strip>>;
}, z.core.$strip>;
declare const sentenceTileSchema: z.ZodObject<{
  text: z.ZodString;
  pos: z.ZodOptional<z.ZodEnum<{
    noun: "noun";
    verb: "verb";
    article: "article";
    adjective: "adjective";
    preposition: "preposition";
    pronoun: "pronoun";
    conjunction: "conjunction";
    adverb: "adverb";
    other: "other";
  }>>;
  gloss: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const transformTileSchema: z.ZodObject<{
  text: z.ZodString;
  pos: z.ZodOptional<z.ZodEnum<{
    noun: "noun";
    verb: "verb";
    article: "article";
    adjective: "adjective";
    preposition: "preposition";
    pronoun: "pronoun";
    conjunction: "conjunction";
    adverb: "adverb";
    other: "other";
  }>>;
  gloss: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const articleItemSchema: z.ZodObject<{
  before: z.ZodString;
  noun: z.ZodString;
  after: z.ZodOptional<z.ZodString>;
  answer: z.ZodEnum<{
    a: "a";
    an: "an";
    the: "the";
    ", ": ", ";
  }>;
  why: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const agreementItemSchema: z.ZodObject<{
  subject: z.ZodString;
  options: z.ZodArray<z.ZodString>;
  correct: z.ZodString;
  tail: z.ZodOptional<z.ZodString>;
  note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const prepItemSchema: z.ZodObject<{
  before: z.ZodString;
  noun: z.ZodString;
  answer: z.ZodString;
  options: z.ZodArray<z.ZodString>;
  scene: z.ZodEnum<{
    in: "in";
    on: "on";
    over: "over";
    above: "above";
    under: "under";
    below: "below";
    beside: "beside";
    between: "between";
    behind: "behind";
    infront: "infront";
    at: "at";
  }>;
  figure: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    kind: z.ZodEnum<{
      emoji: "emoji";
      svg: "svg";
      image: "image";
    }>;
    id: z.ZodOptional<z.ZodString>;
    src: z.ZodOptional<z.ZodString>;
    alt: z.ZodString;
  }, z.core.$strip>]>>;
  landmark: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    kind: z.ZodEnum<{
      emoji: "emoji";
      svg: "svg";
      image: "image";
    }>;
    id: z.ZodOptional<z.ZodString>;
    src: z.ZodOptional<z.ZodString>;
    alt: z.ZodString;
  }, z.core.$strip>]>>;
  note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const boardVectorSchema: z.ZodObject<{
  id: z.ZodOptional<z.ZodString>;
  tail: z.ZodOptional<z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>>;
  comp: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
  }, z.core.$strip>;
  color: z.ZodOptional<z.ZodString>;
  label: z.ZodOptional<z.ZodString>;
  drag: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
/** Block-authoring shape (flat dx/dy; the view maps to {comp:{x,y}}). */
declare const flatVecSchema: z.ZodObject<{
  label: z.ZodOptional<z.ZodString>;
  dx: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
  dy: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
  color: z.ZodOptional<z.ZodString>;
  drag: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
declare const typePanelSchema: z.ZodObject<{
  name: z.ZodString;
  caption: z.ZodString;
  vectors: z.ZodOptional<z.ZodArray<z.ZodObject<{
    tail: z.ZodOptional<z.ZodObject<{
      x: z.ZodNumber;
      y: z.ZodNumber;
    }, z.core.$strip>>;
    comp: z.ZodObject<{
      x: z.ZodNumber;
      y: z.ZodNumber;
    }, z.core.$strip>;
    color: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>>;
  origin: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
/** Per-knob hide/lock policy a creator authors on any lab block. */
declare const controlConfigSchema: z.ZodObject<{
  hide: z.ZodOptional<z.ZodArray<z.ZodString>>;
  lock: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
//#endregion
export { agreementItemSchema, articleAnswerSchema, articleItemSchema, boardVectorSchema, controlConfigSchema, deckItemSchema, deckSchema, flatVecSchema, iconRefSchema, iconValueSchema, posSchema, prepItemSchema, relationSchema, sentenceTileSchema, transformTileSchema, typePanelSchema, vec2Schema };