import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Same MCQ component as before, plus:
 *  - a mode toggle (easy shows translation, hard hides it) — this is a
 *    teaching-format feature, unrelated to the wallet.
 *  - a session_log write on answer. This is now ONLY a signal for the
 *    weekly interest job ("did this student do at least one exercise in
 *    the past 7 days?") — it no longer triggers any automatic deposit.
 *    All non-interest money is added by you manually, in Supabase.
 *
 * `question.translation` comes straight from the DB column. If it's
 * null, the toggle is disabled and mode is forced to 'hard' — there's
 * nothing to show even if they wanted easy.
 */
export default function MCQQuestion({ question, user, onAnswered }) {
  const hasTranslation = Boolean(question.translation);
  const [mode, setMode] = useState(hasTranslation ? 'easy' : 'hard');
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (selected === null) return;

    const isCorrect = selected === question.correct_index;
    setSubmitted(true);

    await supabase.from('session_log').insert({
      student_id: user.id,
      question_id: question.id,
      mode_used: mode,
      is_correct: isCorrect,
    });

    onAnswered({ isCorrect, mode });
  }

  return (
    <div className="mcq-question">
      {hasTranslation && (
        <div className="mode-toggle">
          <button
            className={mode === 'easy' ? 'active' : ''}
            onClick={() => setMode('easy')}
            disabled={submitted}
          >
            Easy (with translation)
          </button>
          <button
            className={mode === 'hard' ? 'active' : ''}
            onClick={() => setMode('hard')}
            disabled={submitted}
          >
            Hard (no translation)
          </button>
        </div>
      )}

      <p className="question-prompt">{question.prompt}</p>

      {mode === 'easy' && hasTranslation && (
        <p className="question-translation">{question.translation}</p>
      )}

      <div className="mcq-options">
        {question.options.map((opt, i) => (
          <button
            key={i}
            className={selected === i ? 'mcq-option selected' : 'mcq-option'}
            onClick={() => setSelected(i)}
            disabled={submitted}
          >
            {opt}
          </button>
        ))}
      </div>

      <button className="submit-btn" onClick={handleSubmit} disabled={submitted || selected === null}>
        Submit
      </button>
    </div>
  );
}
