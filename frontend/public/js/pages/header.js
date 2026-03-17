/**
 * 헤더 공통 로직: 프로필 이미지 설정 및 드롭다운 제어
 */

import { request } from '../core/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const profileIcon = document.getElementById('profileIcon');
    const userDropdown = document.getElementById('userDropdown');
    const headerProfileIcon = document.querySelector('.user-avatar');
    const logoutBtn = document.getElementById('logoutBtn');

    // 1. LocalStorage에서 사용자 정보 불러와서 프로필 이미지 설정
    const storedUser = localStorage.getItem('user');
    if (storedUser && headerProfileIcon) {
        try {
            const currentUser = JSON.parse(storedUser);
            // 전체 URL이 저장되어 있으므로 그대로 사용
            const imageUrl = currentUser.profileImage;

            if (imageUrl) {
                headerProfileIcon.style.backgroundImage = `url('${imageUrl}')`;
                headerProfileIcon.style.backgroundSize = 'cover';
                headerProfileIcon.style.backgroundPosition = 'center';
                headerProfileIcon.style.display = 'block'; // 요소가 숨겨져 있지 않도록 강제
            }
        } catch (e) {
            console.error("데이터 파싱 에러:", e);
        }
    }

    // 2. 드롭다운 토글 제어
    if (profileIcon && userDropdown) {
        profileIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        // 외부 클릭 시 닫기
        document.addEventListener('click', (e) => {
            if (!profileIcon.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                // [신규 추가] 공통 request 모듈 사용: 주소와 세션 설정이 자동으로 처리됩니다.
                await request('/auth/logout', { method: 'POST' });
                alert("로그아웃 되었습니다.");
            } catch (error) {
                // [개선] 서버에서 내려주는 구체적인 에러 메시지를 활용할 수 있습니다.
                console.error("로그아웃 처리 중 오류:", error.message);
            } finally {
                // 서버 성공 여부와 관계없이 클라이언트 데이터는 반드시 삭제 (보안 및 상태 초기화)
                localStorage.clear();
                location.href = "login.html";
            }
        });
    }
});
