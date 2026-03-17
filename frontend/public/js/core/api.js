import { API_BASE_URL } from './config.js';

export const request = async (url, options = {}) => {
    // 1. 헤더 조립
    const headers = { ...options.headers };

    // 2. [핵심 수정] body가 FormData가 아닐 때만 JSON 헤더를 추가합니다. [cite: 2026-02-11]
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        credentials: 'include', // 세션 유지
        ...options,
        headers // 조건부로 설정된 헤더 적용 [cite: 2026-02-11]
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);
        
        // 서버 응답이 비어있을 경우를 대비한 처리 [cite: 2026-02-11]
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || result.message || '요청 처리 중 오류가 발생했습니다.');
        }
        return result;
    } catch (error) {
        console.error(`[API Error] ${url}:`, error.message);
        throw error;
    }
};