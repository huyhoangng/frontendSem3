
import React from 'react';

const FooterScreen = () => {
    const currentYear = new Date().getFullYear(); // Lấy năm hiện tại động

    return (
        <footer className="site-footer">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12 col-12">
                        <p className="copyright-text text-center"> {/* Thêm text-center cho đẹp hơn */}
                            Copyright © Mini Finance {currentYear}
                             - Design: <a
                                rel="sponsored" // rel="noopener noreferrer sponsored" an toàn hơn
                                href="https://www.tooplate.com"
                                target="_blank"
                                className="footer-link" // Thêm class để style nếu cần
                            >
                                Tooplate
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default FooterScreen;