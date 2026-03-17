// pages/edit_password.js
import { request } from '../core/api.js';
import { VALIDATION_PATTERNS } from '../core/utils.js';

// 1. 요소 가져오기
const passwordInput = document.getElementById('password');
const passwordCheckInput = document.getElementById('passwordCheck');
const pwHelper = document.getElementById('pwHelper');
const pwCheckHelper = document.getElementById('pwCheckHelper');
const editBtn = document.getElementById('editBtn');
const toast = document.getElementById('toast');

// 비밀번호 정규식 (8~20자, 대문자/소문자/숫자/특수문자 포함)
const pwPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

// 2. 유효성 검사 함수
function validate() {
    const pwVal = passwordInput.value;
    const checkVal = passwordCheckInput.value;
    let isPwValid = false;
    let isCheckValid = false;

    // 1) 비밀번호 규칙 검사
    if (pwVal === "") {
        pwHelper.textContent = "*비밀번호를 입력해주세요.";
        pwHelper.classList.remove('invisible');
        isPwValid = false;
    } else if (!VALIDATION_PATTERNS.password.test(pwVal)) {
        pwHelper.textContent = "*비밀번호는 8~20자이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
        pwHelper.classList.remove('invisible');
        isPwValid = false;
    } else if (checkVal !== "" && pwVal !== checkVal) {
        // ★ [요청사항 반영] 확인란이 비어있지 않은데, 서로 다르면 여기에도 에러 표시
        pwHelper.textContent = "*비밀번호가 일치하지 않습니다.";
        pwHelper.classList.remove('invisible');
        isPwValid = false; 
    } else {
        // 모든 조건 통과
        pwHelper.classList.add('invisible');
        isPwValid = true;
    }

    // 2) 비밀번호 일치 검사
    if (checkVal === "") {
        pwCheckHelper.textContent = "*비밀번호를 한번 더 입력해주세요.";
        pwCheckHelper.classList.remove('invisible');
        isCheckValid = false;
    } else if (pwVal !== checkVal) {
        pwCheckHelper.textContent = "*비밀번호가 일치하지 않습니다.";
        pwCheckHelper.classList.remove('invisible');
        isCheckValid = false;
    } else {
        // 일치함
        pwCheckHelper.classList.add('invisible');
        isCheckValid = true;
    }

    // 3) 버튼 활성화 여부
    editBtn.disabled = !(isPwValid && isCheckValid);
    editBtn.classList.toggle('active', !editBtn.disabled);
}

async function updatePassword() {
    const userId = localStorage.getItem('userId');
    const newPassword = passwordInput.value;

    try {
        // [개선] fetch 대신 공통 request 사용 (자동으로 API_BASE_URL 결합 및 에러 체크)
        await request(`/users/${userId}/password`, {
            method: 'PUT',
            body: JSON.stringify({ newPassword })
        });

        // 성공 시 공정 처리
        toast.textContent = "비밀번호 수정 완료";
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
            localStorage.clear(); // 보안을 위한 세션 초기화
            location.href = "login.html";
        }, 1500);

    } catch (error) {
        // api.js가 던져준 정제된 에러 메시지 활용
        alert(`수정 실패: ${error.message}`);
    }
}

// 4. 이벤트 연결 (입력 시마다 실시간 감시)
passwordInput.addEventListener('input', validate);
passwordCheckInput.addEventListener('input', validate);
editBtn.addEventListener('click', updatePassword);

validate();