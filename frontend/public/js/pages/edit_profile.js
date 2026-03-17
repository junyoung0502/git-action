// pages/edit_profile.js
import { request } from '../core/api.js';
import { API_BASE_URL } from '../core/config.js';
import { toggleBodyScroll } from '../core/utils.js';

// 1. 요소 가져오기
const profileInput = document.getElementById('profileImg');
const profilePreview = document.querySelector('.preview-circle img');
const previewContainer = document.querySelector('.preview-circle');

const emailInput = document.getElementById('email');
const nicknameInput = document.getElementById('nickname');
const nicknameHelper = document.querySelector('#nickname + .helper-text');
const editBtn = document.getElementById('editBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const toast = document.getElementById('toast');

const userId = localStorage.getItem('userId');

const SERVER_URL = API_BASE_URL.replace('/api/v1', '');
let serverSavedImagePath = "";

// [추가] 버튼 활성화 상태 제어 함수
function checkButtonState() {
    const val = nicknameInput.value.trim();
    // 닉네임이 2자 이상이고 비어있지 않을 때만 버튼 활성화
    if (val.length >= 2) {
        editBtn.disabled = false;
        editBtn.style.backgroundColor = "#7F63F2"; // 활성 색상
        editBtn.style.cursor = "pointer";
    } else {
        editBtn.disabled = true;
        editBtn.style.backgroundColor = "#ACA0EB"; // 비활성 색상
        editBtn.style.cursor = "not-allowed";
    }
}

async function init() {
    if (!userId) return (location.href = "login.html");
    
    try {
        // [신규 추가] request 모듈을 사용하여 사용자 정보 조회
        const result = await request(`/users/${userId}`);
        const user = result.data;

        nicknameInput.value = user.nickname;
        emailInput.value = user.email;
        
        if (user.profileImage) {
            // [수정] 상대 경로일 경우 SERVER_URL을 결합하여 출력 [cite: 2026-02-11]
            profilePreview.src = user.profileImage.startsWith('http') 
                ? user.profileImage 
                : `${SERVER_URL}${user.profileImage}`;
            profilePreview.classList.remove('hidden');
        }
        checkButtonState();
    } catch (e) { 
        console.error("사용자 정보 로드 실패:", e.message); 
    }
}

profileInput.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;

    // 1. 서버로 파일 업로드 전송
    const formData = new FormData();
    formData.append('file', file);

    try {
        // [신규 추가] request 모듈을 통한 이미지 업로드
        const result = await request('/users/upload-profile', {
            method: 'POST',
            body: formData
        });

        serverSavedImagePath = result.data.profileImageUrl;
        
        // 미리보기 처리
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePreview.src = e.target.result;
            profilePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } catch (err) {
        console.error("이미지 업로드 실패:", err.message);
        alert("이미지 업로드 중 오류가 발생했습니다.");
    }
});

// nicknameInput.addEventListener('input', checkButtonState);

// 4. 닉네임 입력 이벤트 (실시간 유효성 검사)
nicknameInput.addEventListener('input', function() {
    const value = this.value.trim();
    nicknameHelper.classList.remove('invisible');

    if (value.length < 2) {
        nicknameHelper.textContent = "*닉네임은 2자 이상 입력해주세요.";
        nicknameHelper.style.color = "red";
    } else {
        nicknameHelper.textContent = "올바른 닉네임 형식입니다.";
        nicknameHelper.style.color = "#666";
    }
    checkButtonState();
});


// 7. 수정 완료 버튼 클릭 이벤트
editBtn.addEventListener('click', async function(e) {
    e.preventDefault();

    const updateData = {
        nickname: nicknameInput.value.trim(),
        // [수정] profilePreview.src에서 도메인 부분을 제거하는 로직을 SERVER_URL 변수로 관리 [cite: 2026-02-11]
        profileImage: serverSavedImagePath || profilePreview.src.replace(SERVER_URL, '')
    };

    try {
        // [신규 추가] request 모듈을 통한 프로필 업데이트
        await request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        // [개선] 정보 수정 성공 후 DB 최신 정보를 다시 가져와 Local Storage 동기화
        const userRes = await request(`/users/${userId}`);
        const latestUser = userRes.data;

        localStorage.setItem('user', JSON.stringify({
            userId: latestUser.userId,
            email: latestUser.email,
            nickname: latestUser.nickname,
            profileImage: latestUser.profileImage, // 백엔드에서 조립된 Full URL
            status: latestUser.status
        }));
        localStorage.setItem('nickname', latestUser.nickname);

        toast.textContent = "수정 완료";
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            location.href = "board.html";
        }, 1500);
    } catch (error) {
        alert(`수정 실패: ${error.message}`);
    }
});


// 8. 회원탈퇴 버튼 클릭
// ★ 모달 관련 요소 가져오기 (맨 위에 변수 선언들과 함께 추가해도 됩니다)
const withdrawModal = document.getElementById('withdrawModal');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');

// 8. 회원탈퇴 버튼 클릭 (수정됨)
withdrawBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    withdrawModal.style.display = 'flex'; 
    toggleBodyScroll(true); // [신규 추가] 배경 스크롤 차단
});


// ★ [추가] 모달 내부 버튼 동작

// 9. 모달 "취소" 클릭 -> 모달 닫기
modalCancelBtn.addEventListener('click', function() {
    withdrawModal.style.display = 'none';
    toggleBodyScroll(false); // [신규 추가] 배경 스크롤 복구
});

// 10. 모달 "확인" 클릭 -> 진짜 탈퇴 진행
modalConfirmBtn.addEventListener('click', async () => {
    try {
        // [신규 추가] request 모듈을 통한 회원 탈퇴
        await request(`/users/${userId}`, { method: 'DELETE' });

        alert("탈퇴 처리가 완료되었습니다. 그동안 이용해주셔서 감사합니다.");
        localStorage.clear();
        location.href = "login.html"; 
    } catch (error) {
        alert(`탈퇴 실패: ${error.message}`);
    }
});

// (옵션) 모달 바깥 배경 누르면 닫기
withdrawModal.addEventListener('click', function(e) {
    if (e.target === withdrawModal) {
        withdrawModal.style.display = 'none';
    }
});

// 초기화 실행
init();