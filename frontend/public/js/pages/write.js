// pages/write.js
import { request } from '../core/api.js';

// 1. 요소 가져오기
const backBtn = document.getElementById('backBtn');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const helperText = document.getElementById('helperText');
const postImageInput = document.getElementById('postImage');
const fileNameDisplay = document.getElementById('fileName');
const submitBtn = document.getElementById('submitBtn');

let uploadedImagePath = null; // [추가] 서버에서 받은 이미지 경로를 저장할 변수

// 2. 유효성 검사 및 버튼 상태 변경 (색상만 변경)
function checkInputState() {
    const titleVal = titleInput.value.trim();
    const contentVal = contentInput.value.trim();

    // [개선] classList.toggle을 사용하여 코드를 더 직관적으로 변경 [cite: 2026-02-11]
    const isValid = titleVal.length > 0 && contentVal.length > 0;
    submitBtn.classList.toggle('active', isValid); 
    if (isValid) helperText.classList.add('invisible'); 
}

// 3. 실제 DB에 게시글을 저장하는 함수 (새로 추가)
async function createPost() {
    const titleVal = titleInput.value.trim();
    const contentVal = contentInput.value.trim();

    // 프론트엔드에서도 백엔드 규격과 동일하게 1차 검사 (Poka-yoke)
    if (titleVal.length < 2) {
        alert("제목은 최소 2자 이상 입력해주세요.");
        return;
    }
    if (contentVal.length < 5) {
        alert("내용은 최소 5자 이상 입력해주세요.");
        return;
    }

    try {
        // [신규 추가] request 모듈을 사용하여 게시글 등록 [cite: 2026-02-11]
        await request('/posts', {
            method: 'POST',
            body: JSON.stringify({
                title: titleVal,
                content: contentVal,
                image: uploadedImagePath // [주의] 백엔드 필드명이 image인지 image_url인지 확인 필요
            })
        });

        alert("게시글이 성공적으로 등록되었습니다.");
        location.href = "board.html";
    } catch (error) {
        // [개선] api.js에서 정의한 에러 메시지를 그대로 활용합니다.
        alert(`등록 실패: ${error.message}`);
    }
}

// 3. 이벤트 리스너

// 입력 감지
titleInput.addEventListener('input', checkInputState);
contentInput.addEventListener('input', checkInputState);

// 파일 선택 시 파일명 변경
postImageInput.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
        
        // [추가] 선택 즉시 서버에 업로드 시도
        const formData = new FormData();
        formData.append('image', file);

        try {
            // [신규 추가] request 모듈을 통한 이미지 업로드 [cite: 2026-02-11]
            const result = await request('/posts/upload', {
                method: 'POST',
                body: formData
            });
            
            uploadedImagePath = result.data.imagePath; 
            console.log("이미지 업로드 성공:", uploadedImagePath);
        } catch (error) {
            console.error("이미지 업로드 실패:", error.message);
            alert("이미지 업로드 중 오류가 발생했습니다.");
        }
    }
});

// 완료 버튼 클릭
submitBtn.addEventListener('click', function(e) {
    e.preventDefault(); // 폼 제출 기본 동작 방지

    const titleVal = titleInput.value.trim();
    const contentVal = contentInput.value.trim();

    // 최종 유효성 검사 후 서버 전송
    if (titleVal.length === 0 || contentVal.length === 0) {
        helperText.classList.remove('invisible'); // 에러 메시지 표시
        return;
    }

    createPost(); // 실제 저장 함수 실행
});

// 뒤로가기
backBtn.addEventListener('click', () => {
    // history.back();
    location.href = "board.html";
});

document.addEventListener('DOMContentLoaded', checkInputState);