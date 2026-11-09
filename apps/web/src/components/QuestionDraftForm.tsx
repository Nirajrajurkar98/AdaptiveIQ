import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Difficulty, Question } from '../domain/types';
import './question-builder.css';

interface QuestionDraftFormProps {
  questionNumber: number;
  requiredPerDifficulty: number;
  difficultyCounts: Record<Difficulty, number>;
  topics: string[];
  onAdd: (question: Question) => void;
}

/** Collects one real MCQ rather than silently filling the quiz with dummy questions. */
export default function QuestionDraftForm({ questionNumber, requiredPerDifficulty, difficultyCounts, topics, onAdd }: QuestionDraftFormProps) {
  const [topic, setTopic] = useState(topics[0] ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');

  const add = () => {
    if (!topics.length) return setError('Add quiz topics before adding questions.');
    if (!prompt.trim() || options.some((option) => !option.trim()) || !explanation.trim()) {
      return setError('Complete the question, all four options, and the explanation.');
    }
    onAdd({
      id: `draft-${questionNumber}-${Date.now()}`,
      topic: topics.includes(topic) ? topic : topics[0],
      difficulty,
      prompt: prompt.trim(),
      options: options.map((option) => option.trim()) as [string, string, string, string],
      correctIndex,
      explanation: explanation.trim(),
    });
    setPrompt('');
    setOptions(['', '', '', '']);
    setExplanation('');
    setCorrectIndex(0);
    setError('');
    setTopic(topics[0] ?? '');
  };

  return <div className="question-composer">
    <div className="question-composer-head"><div><b>Question {questionNumber}</b><small>{questionNumber - 1} questions added to the pool</small></div><span>{difficultyCounts[difficulty]} / {requiredPerDifficulty} {difficulty}</span></div>
    <div className="form-two-cols">
      <label className="field-label">Topic<select value={topic} onChange={(event) => setTopic(event.target.value)}>{topics.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field-label">Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>{(['Easy', 'Medium', 'Hard'] as const).map((level) => <option key={level} value={level}>{level} ({difficultyCounts[level]} added; {requiredPerDifficulty} required)</option>)}</select></label>
    </div>
    <label className="field-label">Question<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Write the question..." rows={2}/></label>
    <div className="form-two-cols">{options.map((option, index) => <label className="field-label" key={index}>Option {String.fromCharCode(65 + index)}<input value={option} onChange={(event) => setOptions((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Enter option ${String.fromCharCode(65 + index)}`}/></label>)}</div>
    <div className="form-two-cols"><label className="field-label">Correct answer<select value={correctIndex} onChange={(event) => setCorrectIndex(Number(event.target.value))}>{options.map((_, index) => <option key={index} value={index}>Option {String.fromCharCode(65 + index)}</option>)}</select></label><label className="field-label">Explanation<input value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="Why is this answer correct?"/></label></div>
    <div className="question-composer-actions">{error && <span role="alert">{error}</span>}<button type="button" className="secondary-btn" onClick={add}><Plus size={14}/>Add question {questionNumber}</button></div>
  </div>;
}
