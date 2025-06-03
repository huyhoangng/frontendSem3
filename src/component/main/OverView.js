
import React from 'react';
const TitleGroup = ({ title, subtitle }) => (
    <div className="title-group mb-3"> 
        <h1 className="h2 mb-0">{title}</h1>
        {subtitle && <small className="text-muted">{subtitle}</small>}
    </div>
);

const BalanceCard = ({ data }) => (
    <div className="custom-block custom-block-balance mb-4"> {/* Thêm mb-4 */}
        <small>Your Balance</small>
        <h2 className="mt-2 mb-3">{data.balance}</h2>
        <div className="custom-block-numbers d-flex align-items-center">
            <span>****</span>
            <span>****</span>
            <span>****</span>
            <p className="mb-0 ms-1">{data.lastFourDigits}</p> {/* mb-0 ms-1 */}
        </div>
        <div className="d-flex mt-3"> {/* Thêm mt-3 */}
            <div>
                <small>Valid Date</small>
                <p className="mb-0">{data.validDate}</p> {/* mb-0 */}
            </div>
            <div className="ms-auto text-end"> {/* Thêm text-end */}
                <small>Card Holder</small>
                <p className="mb-0">{data.cardHolder}</p> {/* mb-0 */}
            </div>
        </div>
    </div>
);

const ChartPlaceholder = ({ id, title }) => (
    <div className="custom-block bg-white mb-4"> {/* Thêm mb-4 */}
        {title && <h5 className="mb-4">{title}</h5>}
        <div id={id} style={{minHeight: '200px', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Chart for {id}</div> {/* Placeholder style */}
    </div>
);

const ExchangeRateItem = ({ data, isLastItem }) => (
    <div className={`d-flex align-items-center ${!isLastItem ? 'border-bottom pb-3 mb-3' : ''}`}>
        <div className="d-flex align-items-center">
            <img src={data.flag} className="exchange-image img-fluid" alt={data.code} />
            <div>
                <p className="mb-0">{data.code}</p> {/* mb-0 */}
                <h6 className="mb-0">{data.name}</h6> {/* mb-0 */}
            </div>
        </div>
        <div className="ms-auto me-4 text-end"> {/* Thêm text-end */}
            <small>Sell</small>
            <h6 className="mb-0">{data.sell}</h6> {/* mb-0 */}
        </div>
        <div className="text-end"> {/* Thêm text-end */}
            <small>Buy</small>
            <h6 className="mb-0">{data.buy}</h6> {/* mb-0 */}
        </div>
    </div>
);

const ExchangeRateBlock = ({ rates }) => (
    <div className="custom-block custom-block-exchange mb-4"> {/* Thêm mb-4 */}
        <h5 className="mb-4">Exchange Rate</h5>
        {rates.map((rate, index) => (
            <ExchangeRateItem
                key={rate.id}
                data={rate}
                isLastItem={index === rates.length - 1}
            />
        ))}
    </div>
);

const ProfileCard = ({ data }) => (
    <div className="custom-block custom-block-profile-front custom-block-profile text-center bg-white mb-4"> {/* Thêm mb-4 */}
        <div className="custom-block-profile-image-wrap mb-4">
            <img src={data.avatar} className="custom-block-profile-image img-fluid" alt="Profile" style={{width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover'}} />
            <a href="setting.html" className="bi-pencil-square custom-block-edit-icon" style={{position: 'absolute', bottom: 0, right: 0, backgroundColor: '#dc3545', color: 'white', padding: '0.3rem', borderRadius: '50%'}}></a>
        </div>
        <p className="d-flex flex-wrap mb-2 justify-content-center">
            <strong className="me-2">Name:</strong>
            <span>{data.name}</span>
        </p>
        <p className="d-flex flex-wrap mb-2 justify-content-center">
            <strong className="me-2">Email:</strong>
            <a href={`mailto:${data.email}`}>{data.email}</a>
        </p>
        <p className="d-flex flex-wrap mb-0 justify-content-center">
            <strong className="me-2">Phone:</strong>
            <a href={`tel:${data.phone.replace(/\s+/g, '')}`}>{data.phone}</a>
        </p>
    </div>
);

const ActionButtonItem = ({ data }) => (
    <div className="custom-block-bottom-item text-center p-2"> {/* Thêm text-center và padding */}
        <a href={data.href} className="d-flex flex-column align-items-center text-decoration-none"> {/* Thêm align-items-center */}
            <i className={`custom-block-icon ${data.iconClass} mb-1`} style={{fontSize: '1.5rem'}}></i> {/* Thêm mb-1 */}
            <small>{data.text}</small>
        </a>
    </div>
);

const ActionButtonsGroup = ({ buttons }) => (
    <div className="custom-block custom-block-bottom d-flex flex-wrap justify-content-around mb-4"> {/* Thêm justify-content-around và mb-4 */}
        {buttons.map(button => (
            <ActionButtonItem key={button.id} data={button} />
        ))}
    </div>
);

const TransactionItem = ({ data }) => (
    <div className="d-flex flex-wrap align-items-center mb-4">
        <div className="d-flex align-items-center">
            <img src={data.avatar} className="profile-image img-fluid" alt={data.name} />
            <div>
                <p className="mb-0">
                    <a href={data.link}>{data.name}</a>
                </p>
                <small className="text-muted">{data.type}</small>
            </div>
        </div>
        <div className="ms-auto text-end"> {/* Thêm text-end */}
            <small>{data.date}</small>
            <strong className={`d-block ${data.isDebit ? 'text-danger' : 'text-success'}`}>
                {data.isDebit ? <span className="me-1">-</span> : <span className="me-1">+</span>}
                {data.amount.replace(/[+-]/g, '')}
            </strong>
        </div>
    </div>
);

const RecentTransactionsBlock = ({ transactions }) => (
    <div className="custom-block custom-block-transations mb-4"> {/* Thêm mb-4 */}
        <h5 className="mb-4">Recent Transactions</h5> {/* Sửa lỗi chính tả Transations */}
        {transactions.map(transaction => (
            <TransactionItem key={transaction.id} data={transaction} />
        ))}
        <div className="border-top pt-4 mt-4 text-center">
            <a className="btn btn-outline-primary" href="wallet.html"> {/* Thay đổi style button */}
                View all transactions
                <i className="bi-arrow-up-right-circle-fill ms-2"></i>
            </a>
        </div>
    </div>
);

const SendMoneyBlock = ({ profiles }) => (
    <div className="custom-block primary-bg mb-4" style={{backgroundColor: '#0d6efd'}}> {/* Thêm mb-4 và style màu nền */}
        <h5 className="text-white mb-4">Send Money</h5>
        <div className="d-flex align-items-center"> {/* Bọc profiles trong div */}
            {profiles.map(profile => (
                <a href="#" key={profile.id} className="me-2"> {/* Thêm me-2 */}
                    <img src={profile.src} className="profile-image img-fluid" alt={profile.alt} />
                </a>
            ))}
            <div className="profile-rounded ms-2" style={{width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems:'center', justifyContent:'center'}}>
                <a href="#" className="text-white">
                    <i className="profile-rounded-icon bi-plus" style={{fontSize: '1.5rem'}}></i>
                </a>
            </div>
        </div>
    </div>
);


// --- Dữ liệu mẫu ---
const balanceData = { balance: "$254,800", lastFourDigits: "2560", validDate: "12/2028", cardHolder: "Thomas" };
const exchangeRatesData = [
    { id: 1, flag: "/images/flag/united-states.png", code: "USD", name: "1 US Dollar", sell: "1.0931", buy: "1.0821" },
    { id: 2, flag: "/images/flag/singapore.png", code: "SGD", name: "1 Singapore Dollar", sell: "0.6901", buy: "0.6201" },
    { id: 3, flag: "/images/flag/united-kingdom.png", code: "GBP", name: "1 British Pound", sell: "1.1520", buy: "1.1412" },
    { id: 4, flag: "/images/flag/australia.png", code: "AUD", name: "1 Australian Dollar", sell: "0.6110", buy: "0.5110" },
    { id: 5, flag: "/images/flag/european-union.png", code: "EUR", name: "1 Euro", sell: "1.1020", buy: "1.1010" },
];
const profileData = { name: "Thomas Edison", email: "thomas@site.com", phone: "(60) 12 345 6789", avatar: "/images/medium-shot-happy-man-smiling.jpg" };
const actionButtonsData = [
    { id: 1, href: "#", iconClass: "bi-wallet", text: "Top up" },
    { id: 2, href: "#", iconClass: "bi-upc-scan", text: "Scan & Pay" },
    { id: 3, href: "#", iconClass: "bi-send", text: "Send" },
    { id: 4, href: "#", iconClass: "bi-arrow-down", text: "Request" },
];
const transactionsData = [
    { id: 1, avatar: "/images/profile/senior-man-white-sweater-eyeglasses.jpg", name: "Daniel Jones", link: "transation-detail.html", type: "C2C Transfer", date: "05/12/2023", amount: "-$250", isDebit: true },
    { id: 2, avatar: "/images/profile/young-beautiful-woman-pink-warm-sweater.jpg", name: "Public Bank", link: "transation-detail.html", type: "Mobile Reload", date: "22/8/2023", amount: "+$280", isDebit: false },
    { id: 3, avatar: "/images/profile/young-woman-with-round-glasses-yellow-sweater.jpg", name: "Store", link: "transation-detail.html", type: "Payment Received", date: "22/8/2023", amount: "+$280", isDebit: false },
];
const sendMoneyProfiles = [
    { id: 1, src: "/images/profile/young-woman-with-round-glasses-yellow-sweater.jpg", alt: "Profile 1" },
    { id: 2, src: "/images/profile/young-beautiful-woman-pink-warm-sweater.jpg", alt: "Profile 2" },
    { id: 3, src: "/images/profile/senior-man-white-sweater-eyeglasses.jpg", alt: "Profile 3" },
];


const OverviewPage = () => {
    return (
        <div className="overview-page-content">
            <TitleGroup title="Overview" subtitle="Hello Thomas, welcome back!" />

            <div className="row g-4 my-4">
                <div className="col-lg-7 col-12 d-flex flex-column">
                    <BalanceCard data={balanceData} />
                    <ChartPlaceholder id="history-chart" title="History" /> {/* Đổi id để tránh trùng */}
                    <ChartPlaceholder id="main-chart" /> {/* Đổi id */}
                    <ExchangeRateBlock rates={exchangeRatesData} />
                </div>

                <div className="col-lg-5 col-12 d-flex flex-column">
                    <ProfileCard data={profileData} />
                    <ActionButtonsGroup buttons={actionButtonsData} />
                    <RecentTransactionsBlock transactions={transactionsData} />
                    <SendMoneyBlock profiles={sendMoneyProfiles} />
                </div>
            </div>
        </div>
    );
};

export default OverviewPage;