// 유효성 검사 패턴
export const VALIDATION_PATTERNS = {
    email: /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-Za-z0-9\-]+/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/
};

// 숫자 포맷팅 (1000 -> 1k)
export const formatNumber = (num) => {
    if (num >= 1000) return Math.floor(num / 1000) + 'k';
    return num;
};

// 날짜 포맷팅
export const formatDate = (isoString) => {
    if (!isoString) return "";
    return isoString.replace('T', ' ').split('.')[0];
};

export const toggleBodyScroll = (lock) => {
    document.body.classList.toggle('no-scroll', lock);
};