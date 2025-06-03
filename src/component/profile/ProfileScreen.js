// src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Cho các link nội bộ

// Component TitleGroup (có thể đặt ở file riêng hoặc chung)
const TitleGroup = ({ title, subtitle }) => (
    <div className="title-group mb-4">
        <h1 className="h2 mb-0">{title}</h1>
        {subtitle && <small className="text-muted">{subtitle}</small>}
    </div>
);

// Component cho một mục thông tin trong Profile
const ProfileDetailItem = ({ label, value, isLink, href }) => (
    <p className="d-flex flex-wrap mb-2">
        <strong className="me-2">{label}:</strong>
        {isLink ? (
            <a href={href || '#'}>{value}</a>
        ) : (
            <span>{value}</span>
        )}
    </p>
);

// Component cho khối General Profile Information
const GeneralProfileInfo = ({ userData }) => (
    <div className="custom-block custom-block-profile mb-4 shadow-sm"> {/* Thêm mb-4 và shadow */}
        <div className="row">
            <div className="col-lg-12 col-12 mb-3">
                <h5 className="mb-0">General Information</h5> {/* Thay h6 thành h5 */}
            </div>
            <div className="col-lg-4 col-md-4 col-12 mb-4 mb-lg-0 text-center text-lg-start"> {/* Căn chỉnh cho ảnh */}
                <div className="custom-block-profile-image-wrap mx-auto mx-lg-0" style={{ width: '120px', height: '120px', position: 'relative' }}> {/* Kích thước cố định cho wrap */}
                    <img
                        src={userData.avatar || '/images/default-avatar.png'} // Ảnh mặc định nếu không có
                        className="custom-block-profile-image img-fluid rounded-circle" // Thêm rounded-circle
                        alt="Profile Avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Thay "setting.html" bằng route đến trang Settings */}
                    <Link to="/settings" className="bi-pencil-square custom-block-edit-icon"
                          style={{position: 'absolute', bottom: '5px', right: '5px', backgroundColor: '#0d6efd', color: 'white', padding: '0.5rem', borderRadius: '50%', lineHeight: '1', fontSize: '0.9rem' }}>
                    </Link>
                </div>
            </div>
            <div className="col-lg-8 col-md-8 col-12">
                <ProfileDetailItem label="Name" value={userData.name || 'N/A'} />
                <ProfileDetailItem label="Email" value={userData.email || 'N/A'} isLink href={`mailto:${userData.email}`} />
                <ProfileDetailItem label="Phone" value={userData.phone || 'N/A'} isLink href={`tel:${(userData.phone || '').replace(/\s+/g, '')}`} />
                <ProfileDetailItem label="Birthday" value={userData.birthday || 'N/A'} />
                <ProfileDetailItem label="Address" value={userData.address || 'N/A'} />
            </div>
        </div>
    </div>
);

// Component cho khối Card Information
const CardInformation = ({ cardData }) => (
    <div className="custom-block custom-block-profile bg-white mb-4 shadow-sm"> {/* Thêm mb-4 và shadow */}
        <h5 className="mb-4">Card Information</h5> {/* Thay h6 thành h5 */}
        <ProfileDetailItem label="User ID" value={cardData.userId || 'N/A'} />
        <ProfileDetailItem label="Type" value={cardData.type || 'N/A'} />
        <ProfileDetailItem label="Created" value={cardData.createdDate || 'N/A'} />
        <ProfileDetailItem label="Valid Date" value={cardData.validDate || 'N/A'} />
    </div>
);

// Component cho khối Contact Us
const ContactUsBlock = () => (
    <div className="custom-block custom-block-contact bg-light p-4 shadow-sm rounded"> {/* Thêm style */}
        <h5 className="mb-3">Still can’t find what you looking for?</h5>
        <p className="mb-2"> {/* Giảm mb */}
            <strong>Call us:</strong>
            <a href="tel:305-240-9671" className="ms-2 text-decoration-none">
                (60) 305-240-9671
            </a>
        </p>
        {/* Thay "#" bằng link hoặc hành động thực tế */}
        <a href="#" className="btn btn-outline-primary mt-3 w-100">
            Chat with us
        </a>
    </div>
);


const ProfileScreen = () => {
    const [userData, setUserData] = useState(null);
    const [cardData, setCardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // --- Giả lập API call cho User Data ---
                const userApiResponse = await new Promise(resolve => setTimeout(() => resolve({
                    name: "Thomas Edison",
                    email: "thomas@site.com",
                    phone: "(60) 12 345 6789",
                    birthday: "March 5, 1992",
                    address: "551 Swanston Street, Melbourne VIC 3000, Australia",
                    avatar: "/images/medium-shot-happy-man-smiling.jpg"
                }), 500));
                setUserData(userApiResponse);

                // --- Giả lập API call cho Card Data ---
                const cardApiResponse = await new Promise(resolve => setTimeout(() => resolve({
                    userId: "012 395 8647",
                    type: "Personal",
                    createdDate: "July 19, 2020",
                    validDate: "July 18, 2032"
                }), 700));
                setCardData(cardApiResponse);

            } catch (err) {
                setError(err.message || "Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []); // Chạy một lần khi component mount

    if (loading) {
        return (
            <div className="profile-page-content text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-page-content alert alert-danger m-4">
                Error: {error}
            </div>
        );
    }

    return (
        // Bỏ các class col-md-9, col-lg-9 để nó chiếm toàn bộ không gian được cấp bởi layout cha
        <div className="profile-page-content"> {/* Class riêng cho trang profile */}
            <TitleGroup title="Profile" subtitle="View and manage your personal information." />

            <div className="row my-4 g-4"> {/* Thêm g-4 cho gutter */}
                <div className="col-lg-8 col-12"> {/* Tăng chiều rộng cột chính */}
                    {userData && <GeneralProfileInfo userData={userData} />}
                    {cardData && <CardInformation cardData={cardData} />}
                </div>

                <div className="col-lg-4 col-12"> {/* Giảm chiều rộng cột phụ */}
                    <ContactUsBlock />
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;