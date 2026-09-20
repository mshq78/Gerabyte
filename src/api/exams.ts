import { mockRequest } from './client';
import { Exam, Question } from '../types/domain';
import { MOCK_EXAMS } from '../mock/data';
import { getStoredUser, setStoredUser } from './auth';
import { certificatesApi } from './certificates';
import { RULES } from '../lib/rules';

export interface ExamSubmitResult {
  examId: string;
  totalQuestions: number;
  correctCount: number;
  scorePct: number;
  passed: boolean;
  xpEarned: number;
  certificateSerial?: string;
  questionReviews: {
    question: Question;
    userAnswerIds: string[];
    isCorrect: boolean;
  }[];
}

export const examsApi = {
  // TODO(backend): GET /api/v1/exams/:id
  async get(id: string): Promise<Exam> {
    return mockRequest(
      () => {
        const exam = MOCK_EXAMS[id] || MOCK_EXAMS['exam-cp-1'];
        return { ...exam, id };
      },
      { endpoint: `/api/v1/exams/${id}` }
    );
  },

  // TODO(backend): POST /api/v1/exams/:id/start
  async start(id: string): Promise<{ attemptId: string; exam: Exam }> {
    return mockRequest(
      () => {
        const exam = MOCK_EXAMS[id] || MOCK_EXAMS['exam-cp-1'];
        if (exam.attemptsUsed >= exam.maxAttempts) {
          throw new Error('تعداد دفعات مجاز شرکت در این ارزیابی به پایان رسیده است.');
        }
        return {
          attemptId: 'att_' + Date.now(),
          exam,
        };
      },
      { endpoint: `/api/v1/exams/${id}/start` }
    );
  },

  // TODO(backend): POST /api/v1/exams/attempts/:attemptId/submit
  async submit(examId: string, answers: Record<string, string[]>): Promise<ExamSubmitResult> {
    return mockRequest(
      async () => {
        const exam = MOCK_EXAMS[examId] || MOCK_EXAMS['exam-cp-1'];
        let totalWeightedScore = 0;
        let maxWeightedScore = 0;
        let correctCount = 0;

        const questionReviews = exam.questions.map((q) => {
          const userAnswers = answers[q.id] || [];
          const weight = q.weight || 1;
          maxWeightedScore += weight;

          const isCorrect =
            userAnswers.length === q.correctIds.length &&
            userAnswers.every((ans) => q.correctIds.includes(ans));

          if (isCorrect) {
            totalWeightedScore += weight;
            correctCount++;
          }

          return {
            question: q,
            userAnswerIds: userAnswers,
            isCorrect,
          };
        });

        const scorePct = Math.round((totalWeightedScore / maxWeightedScore) * 100);
        const passed = scorePct >= exam.passMarkPct;
        let xpEarned = 0;
        let certificateSerial: string | undefined;

        if (passed) {
          xpEarned = exam.isCertificate ? RULES.XP_CERTIFICATE_EXAM_PASS : RULES.XP_CHECKPOINT_PASS;
          const user = getStoredUser();
          const updatedUser = {
            ...user,
            xpTotal: user.xpTotal + xpEarned,
            coins: user.coins + (exam.isCertificate ? 5 : 2),
          };
          setStoredUser(updatedUser);

          if (exam.isCertificate) {
            const newCert = await certificatesApi.issueCertificate({
              title: exam.title,
              domainTitle: exam.targetDomainTitle,
              scorePct,
              holderName: user.fullName,
              examId,
            });
            certificateSerial = newCert.serial;
          }
        }

        return {
          examId,
          totalQuestions: exam.questions.length,
          correctCount,
          scorePct,
          passed,
          xpEarned,
          certificateSerial,
          questionReviews,
        };
      },
      { endpoint: `/api/v1/exams/${examId}/submit` }
    );
  },
};
