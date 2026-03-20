// src/components/KnowledgePointCardSkeleton.jsx

function KnowledgePointCardSkeleton() {
    return (
        <div className="kp-card-skeleton">
            <div className="skeleton-line title"></div>
            <div className="skeleton-line content"></div>
            <div className="skeleton-line content short"></div>
            <div className="skeleton-line content shorter"></div>
            <div className="skeleton-actions">
                <div className="skeleton-button"></div>
                <div className="skeleton-button"></div>
                <div className="skeleton-button"></div>
            </div>
        </div>
    );
}

export default KnowledgePointCardSkeleton;

