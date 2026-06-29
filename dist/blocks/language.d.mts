import { SentenceBuilderLab } from "../language/sentence-builder/preset.mjs";
import { WordMatchLab } from "../language/word-match/preset.mjs";
import { ArticleLensLab } from "../language/article-lens/preset.mjs";
import { AgreementLab } from "../language/agreement/preset.mjs";
import { TransformLab } from "../language/transform/preset.mjs";
import { PrepositionSceneLab } from "../language/preposition-scene/preset.mjs";
import { z } from "zod";

//#region src/blocks/language.d.ts
declare const SentenceBuilderBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  tiles: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
  }, z.core.$strip>>>;
  prompt: z.ZodOptional<z.ZodString>;
  promptDir: z.ZodDefault<z.ZodEnum<{
    ltr: "ltr";
    rtl: "rtl";
  }>>;
  targetDir: z.ZodDefault<z.ZodEnum<{
    ltr: "ltr";
    rtl: "rtl";
  }>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const WordMatchBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  deck: z.ZodDefault<z.ZodObject<{
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
  }, z.core.$strip>>;
  count: z.ZodOptional<z.ZodNumber>;
  show: z.ZodDefault<z.ZodEnum<{
    translation: "translation";
    icon: "icon";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const ArticleLensBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
  }, z.core.$strip>>>;
  objectives: z.ZodOptional<z.ZodArray<z.ZodString>>;
  hints: z.ZodOptional<z.ZodArray<z.ZodString>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const AgreementBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  items: z.ZodDefault<z.ZodArray<z.ZodObject<{
    subject: z.ZodString;
    options: z.ZodArray<z.ZodString>;
    correct: z.ZodString;
    tail: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const TransformBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  from: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
  }, z.core.$strip>>>;
  to: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
  }, z.core.$strip>>>;
  instruction: z.ZodOptional<z.ZodString>;
  note: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const PrepositionBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
  }, z.core.$strip>>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
/** This domain's block specs (slash-menu order) + tag→component render map. */
declare const languageBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  tiles: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
  }, z.core.$strip>>>;
  prompt: z.ZodOptional<z.ZodString>;
  promptDir: z.ZodDefault<z.ZodEnum<{
    ltr: "ltr";
    rtl: "rtl";
  }>>;
  targetDir: z.ZodDefault<z.ZodEnum<{
    ltr: "ltr";
    rtl: "rtl";
  }>>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  deck: z.ZodDefault<z.ZodObject<{
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
  }, z.core.$strip>>;
  count: z.ZodOptional<z.ZodNumber>;
  show: z.ZodDefault<z.ZodEnum<{
    translation: "translation";
    icon: "icon";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
  }, z.core.$strip>>>;
  objectives: z.ZodOptional<z.ZodArray<z.ZodString>>;
  hints: z.ZodOptional<z.ZodArray<z.ZodString>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  items: z.ZodDefault<z.ZodArray<z.ZodObject<{
    subject: z.ZodString;
    options: z.ZodArray<z.ZodString>;
    correct: z.ZodString;
    tail: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  from: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
  }, z.core.$strip>>>;
  to: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
  }, z.core.$strip>>>;
  instruction: z.ZodOptional<z.ZodString>;
  note: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  items: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
  }, z.core.$strip>>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>];
declare const languageComponents: {
  readonly SentenceBuilder: typeof SentenceBuilderLab;
  readonly WordMatch: typeof WordMatchLab;
  readonly ArticleLens: typeof ArticleLensLab;
  readonly Agreement: typeof AgreementLab;
  readonly Transform: typeof TransformLab;
  readonly Preposition: typeof PrepositionSceneLab;
};
//#endregion
export { AgreementBlock, ArticleLensBlock, PrepositionBlock, SentenceBuilderBlock, TransformBlock, WordMatchBlock, languageBlocks, languageComponents };