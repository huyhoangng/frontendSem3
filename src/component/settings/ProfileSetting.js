// src/components/settings/ProfileSettings.js
import React, { useState } from 'react';

const ProfileSettings = () => {
    const [profileData, setProfileData] = useState({
        name: 'John Doe', // Lấy từ API hoặc state cha
        email: 'johndoe@example.com', // Lấy từ API hoặc state cha
        avatar: '/images/profile/senior-man-white-sweater-eyeglasses.jpg', // Ảnh mặc định hoặc từ API
    });
    const [avatarPreview, setAvatarPreview] = useState(profileData.avatar);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Xử lý logic cập nhật profile, bao gồm cả selectedFile nếu có
        console.log("Profile data to submit:", profileData);
        if (selectedFile) {
            console.log("New avatar file:", selectedFile.name);
            // Ví dụ: upload file lên server
        }
        // Gọi API cập nhật
    };

    const handleReset = () => {
        // Lấy lại dữ liệu gốc từ API hoặc state ban đầu
        setProfileData({
            name: 'John Doe',
            email: 'johndoe@example.com',
            avatar: '/images/profile/senior-man-white-sweater-eyeglasses.jpg',
        });
        setAvatarPreview('/images/profile/senior-man-white-sweater-eyeglasses.jpg');
        setSelectedFile(null);
        document.getElementById('profile-avatar-file').value = null; // Reset input file
    };


    return (
        <div className="pt-4"> {/* Thêm padding top cho nội dung tab */}
            <h5 className="mb-4">User Profile</h5>
            <form className="custom-form profile-form" onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="profile-name" className="form-label">Full Name</label>
                    <input
                        className="form-control"
                        type="text"
                        name="name"
                        id="profile-name"
                        placeholder="John Doe"
                        value={profileData.name}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="profile-email" className="form-label">Email Address</label>
                    <input
                        className="form-control"
                        type="email"
                        name="email"
                        id="profile-email"
                        placeholder="johndoe@example.com"
                        value={profileData.email}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="profile-avatar-file" className="form-label">Profile Picture</label>
                    <div className="input-group">
                        {avatarPreview && (
                            <img
                                src={avatarPreview}
                                className="profile-image img-fluid me-2" // Thêm me-2
                                alt="Avatar Preview"
                                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        )}
                        <input
                            type="file"
                            className="form-control"
                            id="profile-avatar-file"
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                    </div>
                     <small className="form-text text-muted">Chọn ảnh mới để thay đổi avatar.</small>
                </div>

                <div className="d-flex mt-4">
                    <button type="button" className="btn btn-outline-secondary me-3" onClick={handleReset}>
                        Reset
                    </button>
                    <button type="submit" className="btn btn-primary">
                        Update Profile
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileSettings;