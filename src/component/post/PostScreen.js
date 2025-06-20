// src/pages/FinancialPostsPage.js
import React from 'react';

// --- DỮ LIỆU BÀI POST (Hardcoded) ---
// Mỗi bài viết bây giờ có một `externalLink` để mở ra trang web khác.
const postsData = [
    {
        id: 1,
        title: "The 50/30/20 Budget Rule Explained",
        author: "NerdWallet",
        publishDate: "2024-05-20",
        imageUrl: "https://picsum.photos/seed/budgetrule/800/400",
        summary: "A popular rule of thumb for budgeting, the 50/30/20 rule can help you manage your money effectively. Learn how to allocate 50% to needs, 30% to wants, and 20% to savings.",
        tags: ["Budgeting", "Saving", "Beginner"],
        externalLink: "https://www.nerdwallet.com/article/finance/what-is-the-50-30-20-budget-rule",
    },
    {
        id: 2,
        title: "How to Build an Emergency Fund",
        author: "Forbes Advisor",
        publishDate: "2024-05-18",
        imageUrl: "https://picsum.photos/seed/emergencyfund/800/400",
        summary: "An emergency fund is your financial safety net. This guide covers how much you should save, where to keep your money, and smart strategies to build your fund faster without stress.",
        tags: ["Saving", "Financial Security", "Planning"],
        externalLink: "https://www.forbes.com/advisor/banking/how-to-build-emergency-fund/",
    },
    {
        id: 3,
        title: "Debt Avalanche vs. Debt Snowball: Which Is Better?",
        author: "Investopedia",
        publishDate: "2024-05-12",
        imageUrl: "https://picsum.photos/seed/debtsnowball/800/400",
        summary: "Trying to pay off debt? The avalanche and snowball methods are two of the most popular strategies. We break down the pros and cons of each to help you decide which is right for you.",
        tags: ["Debt", "Strategy", "Financial Health"],
        externalLink: "https://www.investopedia.com/articles/personal-finance/081015/debt-avalanche-vs-debt-snowball-which-best-you.asp",
    },
    {
        id: 4,
        title: "Beginner's Guide to Investing in Stocks",
        author: "NerdWallet",
        publishDate: "2024-05-09",
        imageUrl: "https://picsum.photos/seed/investing/800/400",
        summary: "Ready to start investing but don't know where to begin? This comprehensive guide covers the basics of the stock market, how to open a brokerage account, and different ways to invest.",
        tags: ["Investing", "Stocks", "Beginner"],
        externalLink: "https://www.nerdwallet.com/article/investing/how-to-invest-in-stocks",
    },
];

// --- Component chính của trang Posts ---
const FinancialPostsPage = () => {
    return (
        <div className="container my-4">
            {/* Tiêu đề trang */}
            <div className="text-center border-bottom pb-4 mb-5">
                <h1 className="display-5 fw-bold">Financial Wellness Hub</h1>
                <p className="lead text-muted">Curated articles to help you master your money and achieve your financial goals.</p>
            </div>

            {/* Vòng lặp để hiển thị danh sách các bài post */}
            <div className="row">
                <div className="col-lg-10 mx-auto">
                    {postsData.map((post) => (
                        <div key={post.id} className="card mb-4 shadow-sm post-card">
                            <div className="row g-0">
                                <div className="col-md-5">
                                    <img src={post.imageUrl} className="img-fluid rounded-start h-100" alt={post.title} style={{ objectFit: 'cover' }} />
                                </div>
                                <div className="col-md-7 d-flex flex-column">
                                    <div className="card-body p-4">
                                        <div className="mb-2">
                                            {post.tags.map(tag => (
                                                <span key={tag} className="badge bg-primary bg-opacity-10 text-primary-emphasis fw-semibold me-2">{tag}</span>
                                            ))}
                                        </div>
                                        
                                        <h2 className="card-title h4">
                                            {/* SỬ DỤNG THẺ <a> ĐỂ MỞ LINK BÊN NGOÀI */}
                                            <a 
                                                href={post.externalLink}      // Link đến trang web ngoài
                                                target="_blank"               // Mở trong tab mới
                                                rel="noopener noreferrer"     // Bảo mật cho target="_blank"
                                                className="text-decoration-none text-dark stretched-link"
                                            >
                                                {post.title}
                                            </a>
                                        </h2>

                                        <p className="card-text text-muted small">{post.summary}</p>
                                    </div>
                                    <div className="card-footer bg-transparent border-0 p-4 pt-0">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <small className="text-muted">
                                                <i className="bi bi-person-fill me-1"></i> By {post.author}
                                            </small>
                                            <small className="text-muted">
                                                <i className="bi bi-calendar-event me-1"></i> {new Date(post.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FinancialPostsPage;