import { request } from '../core/api.js';
import { VALIDATION_PATTERNS } from '../core/utils.js';

// 1. 필요한 요소들을 가져옵니다.
const idInput = document.getElementById('userid');
const pwInput = document.getElementById('userpw');
const helperText = document.getElementById('helperText');
const loginBtn = document.querySelector('.login-btn');

// 2. 입력 상태를 감시하는 함수를 만듭니다.
function checkInput() {
    const idValue = idInput.value.trim();
    const pwValue = pwInput.value.trim();
    
    // 기본 상태: 버튼 비활성화
    if (idValue.length > 0 && pwValue.length > 0) {
        loginBtn.classList.add('active');
        loginBtn.disabled = false;
    } else {
        loginBtn.classList.remove('active');
        loginBtn.disabled = true;
    }

    // 1순위: 이메일 입력 안 함
    if (idValue.length === 0) {
        helperText.textContent = "* 이메일을 입력해주세요.";
    } else if (!VALIDATION_PATTERNS.email.test(idValue)) {
        // 2순위: 이메일 형식 틀림
        helperText.textContent = "* 올바른 이메일 주소 형식을 입력해주세요. (예: example@adapterz.kr)";
    } else if (pwValue.length === 0) {
        // 3순위: 비밀번호 입력 안 함
        helperText.textContent = "* 비밀번호를 입력해주세요";
    } else if (!VALIDATION_PATTERNS.password.test(pwValue)) {
        // 4순위: 비밀번호 형식 틀림
        helperText.textContent = "* 비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
    } else {
        // 5순위: 모두 통과
        helperText.textContent = "";
    }
}


async function attemptLogin() {
    const idValue = idInput.value;
    const pwValue = pwInput.value;

    try {
        // 1. 서버에 로그인 요청 전송
        // const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     credentials: 'include',
        //     body: JSON.stringify({
        //         email: idValue,
        //         password: pwValue
        //     })
        // });

        // const result = await response.json();

        const result = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: idInput.value,
                password: pwInput.value
            })
        });

        // 2. 로그인 성공 시 처리
        alert("로그인에 성공했습니다!");
        
        // 서버에서 받은 유저 정보(JSON)를 로컬 스토리지에 저장
        // 백엔드 응답 형식이 { "message": "...", "data": { "email": "...", "nickname": "..." } } 일 경우
        localStorage.setItem('user', JSON.stringify(result.data));
        localStorage.setItem('userId', result.data.userId); 
        localStorage.setItem('nickname', result.data.nickname);
        localStorage.setItem('profileImage', result.data.profileImage);
        // 게시판으로 이동
        location.href = "board.html";

    } catch (error) {
        console.error("로그인 요청 중 오류 발생:", error.message);

        if (error.message == 'ALREADY_LOGIN') {
            alert("이미 로그인된 상태입니다. 게시판으로 이동합니다.");
            location.href = "board.html";
        } else {
            helperText.textContent = `* ${error.message || "아이디 또는 비밀번호를 확인해주세요"}`;
        }
    }
}
// 3. 키보드를 뗄 때(keyup)마다 함수를 실행시킵니다.
idInput.addEventListener('keyup', checkInput);
pwInput.addEventListener('keyup', checkInput);

window.attemptLogin = attemptLogin;