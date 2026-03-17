// pages/signup.js
import { request } from '../core/api.js';
import { VALIDATION_PATTERNS } from '../core/utils.js'; // 공통 정규표현식 활용

// 1. 요소 가져오기
const profileInput = document.getElementById('profileImg');
const profilePreview = document.querySelector('.preview-circle img');
const profileHelper = document.querySelector('.profile-section .helper-text');
const previewContainer = document.querySelector('.preview-circle'); 

const emailInput = document.getElementById('email');
const emailHelper = document.querySelector('#email + .helper-text');
const pwInput = document.getElementById('password');
const pwHelper = document.querySelector('#password + .helper-text');
const pwCheckInput = document.getElementById('passwordConfirm');
const pwCheckHelper = document.querySelector('#passwordConfirm + .helper-text');
const nicknameInput = document.getElementById('nickname');
const nicknameHelper = document.querySelector('#nickname + .helper-text');
const signupBtn = document.querySelector('.signup-btn');

let uploadedProfilePath = ""; // [추가] 서버에서 받은 이미지 경로를 저장할 변수

// ============================================================
//  A. 프로필 사진 기능 (Change 이벤트)
// ============================================================
profileInput.addEventListener('change', async function(e) {
    const file = e.target.files[0];

    if (file) {
        // 1. 파일이 있을 때 (업로드 성공)
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePreview.src = e.target.result;
            profilePreview.classList.remove('hidden'); // 이미지 보이기
            
            // 이제 previewContainer를 알기 때문에 에러 없이 작동합니다.
            previewContainer.classList.add('uploaded'); // 가로세로 선 숨기기
        };
        reader.readAsDataURL(file);
        
        // 헬퍼 텍스트 숨기기
        if(profileHelper) profileHelper.classList.add('invisible');

        // 2. [핵심 추가] 서버로 실제 이미지 파일 업로드 [cite: 2026-02-11]
        const formData = new FormData();
        formData.append('file', file); // 백엔드 필드명(file)에 맞춰 전송

        try {
            // 공통 request 모듈을 사용하여 업로드 요청
            const result = await request('/users/upload-profile', {
                method: 'POST',
                body: formData
            });

            // 서버가 돌려준 실제 이미지 경로를 변수에 저장 [cite: 2026-02-11]
            uploadedProfilePath = result.data.profileImageUrl; 
            console.log("이미지 업로드 성공:", uploadedProfilePath);
        } catch (err) {
            console.error("이미지 업로드 실패:", err.message);
            alert("이미지 업로드 중 오류가 발생했습니다.");
            // 실패 시 초기화
            uploadedProfilePath = "";
        }
        
    } else {
        // 2. 파일 선택 취소했을 때 (삭제)
        profilePreview.src = "";
        profilePreview.classList.add('hidden'); // 이미지 숨기기
        
        // 가로세로 선 다시 보이기
        previewContainer.classList.remove('uploaded');
        
        // ★ 헬퍼 텍스트 다시 보이기
        if(profileHelper) profileHelper.classList.remove('invisible');
    }
    
    checkButtonState(); // 버튼 상태 확인
});

// ============================================================
//  B. 헬퍼 텍스트 표시 로직 (Focus Out)
// ============================================================
async function checkDuplicate(type, value) {
    try {
        const result = await request(`/auth/check-duplicate?type=${type}&value=${value}`);
        return result.data.is_duplicate; // true면 중복
    } catch (error) {
        return false;
    }
}
// async function checkDuplicateOnServer(type, value) {
//     if (!value) return false;
//     try {
//         const response = await fetch(`http://127.0.0.1:8000/api/v1/auth/check-duplicate?type=${type}&value=${value}`);
//         const data = await response.json();
//         return data.is_duplicate; // true면 중복, false면 사용 가능
//     } catch (error) {
//         console.error("중복 체크 중 오류:", error);
//         return false;
//     }
// }

async function validateEmail() {
    const val = emailInput.value.trim();
    if (val === "") {
        emailHelper.textContent = "*이메일을 입력해주세요.";
        emailHelper.classList.remove('invisible');
    } else if (!VALIDATION_PATTERNS.email.test(val)) {
        emailHelper.textContent = "*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)";
        emailHelper.classList.remove('invisible');
    } else {
        // [수정] 서버 DB에서 중복 확인
        const isDuplicate = await checkDuplicate('email', val);
        if (isDuplicate) {
            emailHelper.textContent = "*중복된 이메일 입니다.";
            emailHelper.classList.remove('invisible');
        } else {
            emailHelper.classList.add('invisible');
        }
    }
    checkButtonState();
}

function validatePw() {
    const val = pwInput.value.trim();
    const checkVal = pwCheckInput.value.trim();

    if (val === "") {
        pwHelper.textContent = "*비밀번호를 입력해주세요.";
        pwHelper.classList.remove('invisible');
    } else if (!VALIDATION_PATTERNS.password.test(val)) {
        pwHelper.textContent = "*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
        pwHelper.classList.remove('invisible');
    } else if (checkVal !== "" && val !== checkVal) {
        pwHelper.textContent = "*비밀번호가 다릅니다.";
        pwHelper.classList.remove('invisible');
        
        // 아래쪽(확인칸)도 같이 에러 띄움 (동기화)
        pwCheckHelper.textContent = "*비밀번호가 다릅니다.";
        pwCheckHelper.classList.remove('invisible');
    } else {
        // 문제 없음
        pwHelper.classList.add('invisible');
        
        // 만약 비밀번호를 수정해서 이제 일치하게 되었다면, 아래쪽 에러도 지워줌
        if (checkVal !== "" && val === checkVal) {
            pwCheckHelper.classList.add('invisible');
        }
    }
    checkButtonState();
}

function validatePwCheck() {
    const val = pwCheckInput.value.trim();
    const originPw = pwInput.value.trim();
    
    if (val === "") {
        pwCheckHelper.textContent = "*비밀번호를 한번 더 입력해주세요.";
        pwCheckHelper.classList.remove('invisible');
    } else if (val !== originPw) {
        pwCheckHelper.textContent = "*비밀번호가 다릅니다.";
        pwCheckHelper.classList.remove('invisible');

        if (VALIDATION_PATTERNS.password.test(originPw)) {
            pwHelper.textContent = "*비밀번호가 다릅니다.";
            pwHelper.classList.remove('invisible');
        }
    } else {
        // 일치함
        pwCheckHelper.classList.add('invisible');
        
        // 일치하니까 위쪽 에러도 지워줌 (단, 위쪽이 패턴을 만족하는 상태일 때만)
        if (VALIDATION_PATTERNS.password.test(originPw)) {
            pwHelper.classList.add('invisible');
        }
    }
}

async function validateNickname() {
    const val = nicknameInput.value.trim();
    
    if (val === "") {
        nicknameHelper.textContent = "*닉네임을 입력해주세요.";
        nicknameHelper.classList.remove('invisible');
    } else if (val.includes(" ")) {
        nicknameHelper.textContent = "*띄어쓰기를 없애주세요.";
        nicknameHelper.classList.remove('invisible');
    } else if (val.length > 10) {
        nicknameHelper.textContent = "*닉네임은 최대 10자까지 작성 가능합니다.";
        nicknameHelper.classList.remove('invisible');
    } else {
        // [수정] 서버 DB에서 중복 확인
        const isDuplicate = await checkDuplicate('nickname', val);
        if (isDuplicate) {
            nicknameHelper.textContent = "*중복된 닉네임 입니다.";
            nicknameHelper.classList.remove('invisible');
        } else {
            nicknameHelper.classList.add('invisible');
        }
    }
    checkButtonState();
}

emailInput.addEventListener('focusout', validateEmail);
pwInput.addEventListener('focusout', validatePw);
pwCheckInput.addEventListener('focusout', validatePwCheck);
nicknameInput.addEventListener('focusout', validateNickname);

// ============================================================
//  C. 버튼 활성화 로직 (Real-time Check)
// ============================================================
function checkButtonState() {
    // 1. 이메일: 정규식 통과 AND 중복 체크 통과(헬퍼 텍스트가 invisible 상태)
    const isEmail = VALIDATION_PATTERNS.email.test(emailInput.value.trim()) && 
                    emailHelper.classList.contains('invisible');

    // 2. 비밀번호: 형식 통과
    const isPw = VALIDATION_PATTERNS.password.test(pwInput.value.trim());
    
    // // 3. 비밀번호 확인: 일치 AND 빈값 아님
    // const isPwCheck = (pwCheckInput.value.trim() === pwInput.value.trim()) && (pwCheckInput.value.trim() !== "");
    // 3. 비밀번호 확인: 일치 AND 빈값 아님 AND 헬퍼 텍스트가 invisible 상태
    const isPwCheck = (pwCheckInput.value.trim() === pwInput.value.trim()) && 
                      (pwCheckInput.value.trim() !== "") &&
                      pwCheckHelper.classList.contains('invisible');


    // 4. 닉네임: 빈값 아님 AND 10자 이하 AND 띄어쓰기 없음 AND 중복 아님
    const nickVal = nicknameInput.value.trim();
    const isNickname = nickVal.length > 0 && 
                       nickVal.length <= 10 && 
                       !nickVal.includes(" ") && 
                       nicknameHelper.classList.contains('invisible');
    
    // 5. 프로필 사진: 파일 있음
    const isProfile = profileInput.files.length > 0;

    const allValid = isEmail && isPw && isPwCheck && isNickname && isProfile;

    // 모두 통과해야 버튼 활성화
    signupBtn.classList.toggle('active', allValid);
    signupBtn.disabled = !allValid;
    // if (isEmail && isPw && isPwCheck && isNickname && isProfile) {
    //     signupBtn.classList.add('active');
    //     signupBtn.disabled = false;
    // } else {
    //     signupBtn.classList.remove('active');
    //     signupBtn.disabled = true;
    // }
}

emailInput.addEventListener('input', checkButtonState);
pwInput.addEventListener('input', checkButtonState);
pwCheckInput.addEventListener('input', checkButtonState);
nicknameInput.addEventListener('input', checkButtonState);

[emailInput, pwInput, pwCheckInput, nicknameInput].forEach(el => {
    el.addEventListener('input', checkButtonState);
});
// ============================================================
//  D. 회원가입 버튼 클릭
// ============================================================
signupBtn.addEventListener('click', async () => {
    /* [기존 fetch 코드 삭제 사유] 
       Content-Type 설정 및 에러 핸들링을 매번 수동으로 하는 것은 에러 발생 확률을 높입니다. [cite: 2026-02-11]
    const response = await fetch('http://.../auth/signup', { ... });
    */

    try {
        // [신규] request 모듈을 통한 데이터 전송 [cite: 2026-02-11]
        await request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({
                email: emailInput.value.trim(),
                password: pwInput.value.trim(),
                nickname: nicknameInput.value.trim(),
                profileImage: uploadedProfilePath || "/public/images/default-profile.png"
            })
        });

        alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
        location.href = "login.html";
    } catch (error) {
        alert(`회원가입 실패: ${error.message}`);
    }
});
// signupBtn.addEventListener('click', async function() {
//     // 1. 전송할 데이터 수집
//     const email = emailInput.value.trim();
//     const password = pwInput.value.trim();
//     const nickname = nicknameInput.value.trim();
    
//     // 프로필 이미지는 현재 파일 형식이므로, 
//     // 여기서는 간단하게 파일명이나 임시 경로를 보냅니다.
//     // (실제 파일 업로드는 Multipart/form-data 처리가 필요하지만, 
//     // 우선 DB 저장이 목적인 경우 아래처럼 보냅니다.)
//     const signupData = {
//         email: email,
//         password: password,
//         nickname: nickname,
//         profileImage: "/public/images/default-profile.png" // 우선 기본값 전송
//     };

//     try {
//         // 2. 서버의 회원가입 API 호출
//         const response = await fetch('http://127.0.0.1:8000/api/v1/auth/signup', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(signupData)
//         });

//         const result = await response.json();

//         if (response.ok) {
//             alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
//             location.href = "login.html";
//         } else {
//             alert("회원가입 실패: " + (result.detail || "알 수 없는 오류"));
//         }
//     } catch (error) {
//         console.error("통신 오류:", error);
//         alert("서버와 통신할 수 없습니다.");
//     }
// });