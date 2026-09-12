// @classytic/labs/exam, assessment surfaces that ask a learner to PRODUCE an answer.
// Everything else in this library either teaches a concept or checks recognition with options
// on screen; this subpath is where a question is marked the way a paper marks it.
export {
  ExamQuestion,
  DEFAULT_EXAM_PARTS,
  DEFAULT_EXAM_STEM,
  earnedMarks,
  examQuestionProblems,
  gradePart,
  schemeMarks,
  totalMarks,
  type CommonError,
  type ExamPart,
  type ExamQuestionProps,
  type ExamQuestionSpec,
  type MarkPoint,
  type PartVerdict,
} from './exam-question/index.js';
