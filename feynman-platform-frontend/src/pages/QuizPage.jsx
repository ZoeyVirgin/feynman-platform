// src/pages/QuizPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import QuizCard from '../components/QuizCard';

function QuizPage() {
  const { id } = useParams(); // 知识点ID
  const navigate = useNavigate();

  const [knowledgePoint, setKnowledgePoint] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [shortAnswer, setShortAnswer] = useState('');
  const [result, setResult] = useState(null); // { isCorrect, explanation }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 加载知识点信息
  useEffect(() => {
    const fetchKp = async () => {
      try {
        const response = await apiClient.get(`/knowledge-points/${id}`);
        setKnowledgePoint(response.data);
      } catch (err) {
        console.error(err);
        setError('加载知识点失败');
      }
    };
    fetchKp();
  }, [id]);

  const fetchQuestion = async (difficulty = '基础', type = 'single-choice') => {
    if (!knowledgePoint) return;
    setIsLoading(true);
    setError('');
    setQuestion(null);
    setResult(null);
    setSelectedOption('');
    setShortAnswer('');
    try {
      const resp = await apiClient.post('/ai/generate-question', {
        knowledgePointContent: knowledgePoint.content,
        difficulty,
        type,
      });
      setQuestion(resp.data);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.msg || (err?.response?.status === 404 ? '服务端未找到出题接口，请重启后端或检查 /api/ai 路由是否挂载。' : 'AI 出题失败，请稍后重试');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReviewStatus = async (needsReview) => {
    try {
      await apiClient.put(`/knowledge-points/${id}`, { reviewList: needsReview });
    } catch (err) {
      console.error('更新复习状态失败', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question) return;

    // 单选题：前端直接比较
    if (question.type === 'single-choice') {
      if (!selectedOption) {
        alert('请选择一个答案！');
        return;
      }
      const isCorrect = selectedOption === question.answer;
      setResult({ isCorrect, explanation: question.explanation || '' });
      if (!isCorrect) updateReviewStatus(true);
      return;
    }

    // 简答题：走后端 AI 阅卷
    if (question.type === 'short-answer') {
      if (!shortAnswer.trim()) {
        alert('请填写你的答案');
        return;
      }
      try {
        setIsLoading(true);
        const resp = await apiClient.post('/ai/grade-answer', {
          question: question.question,
          answerKeyPoints: question.answer_key_points,
          studentAnswer: shortAnswer,
        });
        setResult({
          isCorrect: !!resp.data?.isCorrect,
          explanation: resp.data?.explanation || '',
        });
        if (!resp.data?.isCorrect) updateReviewStatus(true);
      } catch (err) {
        console.error(err);
        setError('AI 阅卷失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!knowledgePoint) return <div style={{ padding: 16 }}>加载知识点信息...</div>;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', // 水平居中所有子元素
      gap: '1.5rem',
      width: '100%',
      padding: '0 1rem',
      boxSizing: 'border-box',
    }}>
      <h1 style={{ textAlign: 'center' }}>知识点测评: {knowledgePoint.title}</h1>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => fetchQuestion('基础', 'single-choice')} className="btn-basic" disabled={isLoading}>单选·基础</button>
        <button onClick={() => fetchQuestion('中等', 'single-choice')} className="btn-medium" disabled={isLoading}>单选·中等</button>
        <button onClick={() => fetchQuestion('困难', 'single-choice')} className="btn-hard" disabled={isLoading}>单选·困难</button>
        <span style={{ borderLeft: '1px solid var(--color-border)', alignSelf: 'stretch' }}></span>
        <button onClick={() => fetchQuestion('中等', 'short-answer')} className="btn-short" disabled={isLoading}>简答·中等</button>
        {!result && (
          <button onClick={() => navigate(-1)} className="back-btn">返回</button>
        )}
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <QuizCard 
        question={question}
        result={result}
        isLoading={isLoading}
        selectedOption={selectedOption}
        onOptionChange={setSelectedOption}
        shortAnswer={shortAnswer}
        onShortAnswerChange={setShortAnswer}
        onSubmit={handleSubmit}
        onNextQuestion={() => fetchQuestion(question.difficulty, question.type)}
        onBack={() => navigate(-1)}
      />

    </div>
  );
}

export default QuizPage;

