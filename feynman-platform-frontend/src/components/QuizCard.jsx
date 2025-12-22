// src/components/QuizCard.jsx

// 这是一个可复用的 UI 组件，用于展示问题、选项和结果。
// 它不包含任何数据获取逻辑，只负责根据传入的 props 来渲染界面。
function QuizCard({ 
    question, 
    result, 
    isLoading, 
    selectedOption, 
    onOptionChange, 
    shortAnswer, 
    onShortAnswerChange, 
    onSubmit, 
    onNextQuestion, 
    onBack 
}) {

    // 正在加载或等待出题
    if (isLoading) {
        return <p>AI 正在出题/阅卷中...</p>;
    }

    // 显示结果
    if (result) {
        return (
            <div style={{ width: '100%', maxWidth: '720px', background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}>
                <h2>测评结果</h2>
                <p style={{ color: result.isCorrect ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 'bold' }}>
                    {result.isCorrect ? '回答正确！' : '回答错误！'}
                </p>
                {question.type === 'single-choice' && (
                    <p><strong>正确答案是: {question.answer}</strong></p>
                )}
                <p><strong>解释:</strong> {result.explanation}</p>
                {!result.isCorrect && <p style={{ color: 'orange' }}>该知识点已加入你的复习列表。</p>}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={onNextQuestion}>再来一题</button>
                    <button onClick={onBack} className="back-btn">返回</button>
                </div>
            </div>
        );
    }

    // 显示问题
    if (question) {
        return (
            <form onSubmit={onSubmit} style={{ width: '100%', maxWidth: '720px' }}>
                <h3 style={{ marginBottom: '1rem' }}>
                    [{question.type === 'single-choice' ? '单选' : '简答'} · {question.difficulty}] {question.question}
                </h3>

                {question.type === 'single-choice' && (
                    <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.entries(question.options || {}).map(([key, value]) => (
                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="radio"
                                    name="option"
                                    value={key}
                                    checked={selectedOption === key}
                                    onChange={(e) => onOptionChange(e.target.value)}
                                />
                                {key}. {value}
                            </label>
                        ))}
                    </div>
                )}

                {question.type === 'short-answer' && (
                    <div style={{ marginBottom: '1rem' }}>
                        <textarea
                            placeholder="请在此作答..."
                            rows={6}
                            style={{ width: '100%', padding: '0.5rem' }}
                            value={shortAnswer}
                            onChange={(e) => onShortAnswerChange(e.target.value)}
                        />
                    </div>
                )}

                <button type="submit" style={{ width: '100%' }}>提交答案</button>
            </form>
        );
    }

    // 初始状态，什么都不显示
    return null;
}

export default QuizCard;

