// pages/post_detail.js
import { request } from '../core/api.js'; // 공통 통신 모듈
import { API_BASE_URL } from '../core/config.js'; // 서버 주소 설정
import { formatNumber, toggleBodyScroll, formatDate } from '../core/utils.js';

const postId = new URLSearchParams(window.location.search).get('id');

const postTitle = document.getElementById('postTitle');
const postAuthor = document.getElementById('postAuthor');
const postDate = document.getElementById('postDate');
const postBody = document.getElementById('postBody');
const likeCount = document.getElementById('likeCount');
const viewCount = document.getElementById('viewCount');
const commentCount = document.getElementById('commentCount');
const commentList = document.getElementById('commentList');
const commentInput = document.getElementById('commentInput');
const commentSubmitBtn = document.getElementById('commentSubmitBtn');
const postDeleteModal = document.getElementById('postDeleteModal');
const postDeleteBtn = document.getElementById('postDeleteBtn'); // [추가] 삭제 버튼 요소 가져오기
const commentDeleteModal = document.getElementById('commentDeleteModal');
const backBtn = document.getElementById('backBtn');
const postAuthorProfile = document.getElementById('postAuthorProfile');

const SERVER_URL = API_BASE_URL.replace('/api/v1', ''); // 이미지 서빙을 위한 순수 서버 주소 [cite: 2026-02-11]

// 상태 변수
let isLiked = false; // 좋아요 눌렀는지 여부
let editingCommentId = null; // 현재 수정 중인 댓글 ID (null이면 새 댓글 작성 모드)
let targetCommentIdToDelete = null; // 삭제할 댓글 ID


// 페이지 로드
async function initPage(){
    if (!postId){
        alert("존재하지 않는 게시글입니다.");
        location.href = "board.html";
        return;
    }
    
    try {
        const [postRes, commentRes] = await Promise.all([
            request(`/posts/${postId}`),
            request(`/comments/posts/${postId}`)
        ]);

        // [디버깅] 서버에서 받아온 게시글 데이터 구조 확인
        console.log("서버가 준 게시글 데이터:", postRes.data);
        
        // 데이터 취득 후 화면을 그리는(Render) 함수를 분리하여 가독성을 높였습니다.
        renderPost(postRes.data);
        renderComments(commentRes.data);
    } catch (error) {
        console.error("초기 로드 실패:", error);
    }
}

function renderPost(post) {
    const imageArea = document.querySelector('.post-image-area');
    
    if (imageArea) {
        /* [수정 전] post.image만 써서 이미지가 깨졌던 부분입니다.
        if (post.image) { imageArea.innerHTML = `<img src="${post.image}">`; }
        */

        // [신규 추가] 이미지 경로 결합: 서버 주소(SERVER_URL)와 상대 경로를 합쳐 이미지를 정상 노출합니다. [cite: 2026-02-11]
        if (post.image_url) { 
            const fullImageUrl = `${SERVER_URL}${post.image_url}`;
            imageArea.innerHTML = `<img src="${fullImageUrl}" alt="게시글 이미지">`;
        } else {
            imageArea.innerHTML = ''; // 이미지 없을 때 플레이스홀더만 유지
        }
        imageArea.style.display = 'flex'; 
    }

    isLiked = post.isLiked || false; 
    if (likeBtnDiv) {
        likeBtnDiv.classList.toggle('active', isLiked); // 좋아요 상태에 따른 색상 반영
    }
    
    postTitle.textContent = post.title;
    postAuthor.textContent = post.author.nickname;
    
    // if (postAuthorProfile) {
    //     // [신규 추가] 프로필 이미지 서버 경로 결합 [cite: 2026-02-11]
    //     const profilePath = post.author.profileImage || '/public/images/default-profile.png';
    //     postAuthorProfile.src = `${SERVER_URL}${profilePath}`;
        
    //     postAuthorProfile.onerror = () => {
    //         postAuthorProfile.src = `${SERVER_URL}/public/images/default-profile.png`;
    //     };
    // }
    
    if (postAuthorProfile) {
        // 1. 기본값 설정
        let profilePath = post.author.profileImage || '/public/images/default-profile.png';
        
        // 2. [수정] 경로가 http로 시작하지 않을 때만 SERVER_URL을 붙여줍니다.
        if (profilePath && !profilePath.startsWith('http')) {
            profilePath = `${SERVER_URL}${profilePath}`;
        }
        
        postAuthorProfile.src = profilePath;
        
        // 이미지 로드 실패 시의 방어 코드
        postAuthorProfile.onerror = () => {
            postAuthorProfile.src = `${SERVER_URL}/public/images/default-profile.png`;
        };
    }

    postDate.textContent = formatDate(post.createdAt);
    postBody.textContent = post.content;
    
    // 유틸리티 함수(formatNumber) 적용
    likeCount.textContent = formatNumber(post.likeCount);
    viewCount.textContent = formatNumber(post.viewCount);
    commentCount.textContent = formatNumber(post.commentCount);
}

// 1. 요소 정의 (파일 상단 변수 선언부에 추가)
const likeBtnDiv = document.querySelector('.stat-item');

// 2. 좋아요 클릭 이벤트 리스너 (initPage 함수 실행 전/후 어디든 상관없으나 주석 해제 필수)
if (likeBtnDiv) {
    /* [기존 fetch 로직 삭제] 
       이유: credentials나 headers 설정을 request 모듈이 대신 처리하여 코드를 단축했습니다.
    */
    likeBtnDiv.addEventListener('click', async function() {
        try {
            const method = isLiked ? 'DELETE' : 'POST';
            const result = await request(`/posts/${postId}/likes`, { method });

            isLiked = result.data.isLiked; 
            this.classList.toggle('active', isLiked); 
            likeCount.textContent = formatNumber(result.data.likeCount);
        } catch (error) {
            alert(error.message);
        }
    });
}

// 댓글 목록 로드

function renderComments(comments) {
    commentList.innerHTML = "";
    const currentUserId = Number(localStorage.getItem('userId')) || 0; 
    
    comments.forEach(cmt => {
        const item = document.createElement('div');
        item.className = 'comment-item';
        const formattedDate = cmt.createdAt.replace('T', ' ').split('.')[0];

        
        // 1. [수정] 댓글 프로필 이미지 경로 결정 로직
        let profileImg = cmt.author.profileImage || '/public/images/default-profile.png';
        
        // 이미 주소에 http가 포함되어 있다면 그대로 쓰고, 아니면 SERVER_URL을 붙입니다.
        if (profileImg && !profileImg.startsWith('http')) {
            profileImg = `${SERVER_URL}${profileImg}`;
        }
        
        let actionButtons = "";
        if (cmt.author.userId === currentUserId) {
            // [참고] 모듈 스코프이므로 onclick에서 호출될 함수는 window 객체에 등록되어야 합니다. [cite: 2026-02-11]
            actionButtons = `
                <div class="comment-actions">
                    <button class="action-btn" onclick="prepareEditComment(${cmt.commentId}, '${cmt.content.replace(/'/g, "\\'")}')">수정</button>
                    <button class="action-btn" onclick="openCommentModal(${cmt.commentId})">삭제</button>
                </div>
            `;
        }

        item.innerHTML = `
            <div class="comment-header">
                <div class="author-info">
                    <img src="${profileImg}" class="comment-avatar" onerror="this.src='${SERVER_URL}/public/images/default-profile.png'">
                    <strong>${cmt.author.nickname}</strong>
                    <span class="date">${formattedDate}</span>
                </div>
                ${actionButtons} </div>
            <div class="comment-content">${cmt.content}</div>
        `;
        commentList.appendChild(item);
    });
}

// 5. 댓글 등록 및 수정
commentSubmitBtn.addEventListener('click', async () => {
    const content = commentInput.value.trim();
    if (!content) return;
    const isEditMode = editingCommentId !== null;

    const url = isEditMode ? `/comments/${editingCommentId}` : `/comments/posts/${postId}`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
        await request(url, {
            method: method,
            body: JSON.stringify({ content })
        });
        
        alert(isEditMode ? "댓글이 수정되었습니다." : "댓글이 등록되었습니다.");
        editingCommentId = null; 
        commentInput.value = "";
        commentSubmitBtn.textContent = "댓글 등록";
        
        initPage(); // [신규 추가] 수정/등록 후 전체 정보를 최신화하여 통계를 맞춥니다. [cite: 2026-02-11]
    } catch (error) {
        alert(error.message);
    }
});

// [신규 추가] 모듈 스코프 탈출: onclick 속성에서 함수를 찾을 수 있도록 전역에 등록합니다. [cite: 2026-02-11]
window.prepareEditComment = (id, content) => {
    editingCommentId = id;
    commentInput.value = content;
    commentInput.focus();
    commentSubmitBtn.textContent = "댓글 수정";
    checkCommentBtn();
};

window.openCommentModal = (id) => {
    targetCommentIdToDelete = id;
    commentDeleteModal.style.display = 'flex';
    toggleBodyScroll(true);
};

// [신규 추가] 삭제 버튼 클릭 시 모달 열기 [cite: 2026-02-11]
if (postDeleteBtn) {
    postDeleteBtn.addEventListener('click', () => {
        // [삭제된 기존 방식] postDeleteModal.style.display = 'flex';
        // [개선 방식] 모듈화된 utils의 기능을 사용합니다. [cite: 2026-02-11]
        postDeleteModal.style.display = 'flex';
        toggleBodyScroll(true); 
    });
}

// 게시글 삭제 확정 (기존 코드 유지)
document.getElementById('postDelConfirm').addEventListener('click', async () => {
    try {
        await request(`/posts/${postId}`, { method: 'DELETE' });
        alert("게시글이 삭제되었습니다.");
        location.href = 'board.html';
    } catch (error) {
        alert(error.message);
    }
});

// 취소 버튼 공통 처리 (기존 코드 유지)
document.getElementById('postDelCancel').addEventListener('click', () => {
    postDeleteModal.style.display = 'none';
    toggleBodyScroll(false);
});

// 댓글 삭제 확정
document.getElementById('cmtDelConfirm').addEventListener('click', async () => {
    if (!targetCommentIdToDelete) return;
    try {
        await request(`/comments/${targetCommentIdToDelete}`, { method: 'DELETE' });
        commentDeleteModal.style.display = 'none';
        toggleBodyScroll(false);
        initPage();
    } catch (error) {
        alert(error.message);
    }
});

// 취소 버튼 공통 처리
document.getElementById('postDelCancel').addEventListener('click', () => {
    postDeleteModal.style.display = 'none';
    toggleBodyScroll(false);
});
document.getElementById('cmtDelCancel').addEventListener('click', () => {
    commentDeleteModal.style.display = 'none';
    toggleBodyScroll(false);
});

// [신규 추가] 게시글 수정 권한 확인 및 이동
document.getElementById('postEditBtn').addEventListener('click', async() => {
    try {
        const result = await request(`/posts/${postId}`);
        const currentUser = JSON.parse(localStorage.getItem('user'));
        
        if (result.data.author.nickname === currentUser.nickname) {
            location.href = `edit_post.html?id=${postId}`;
        } else {
            alert("본인이 작성한 글만 수정할 수 있습니다.");
        }
    } catch (error) {
        alert("권한 확인 실패: " + error.message);
    }
});

// 댓글 입력 활성화 체크 함수
function checkCommentBtn() {
    const text = commentInput.value.trim();
    commentSubmitBtn.disabled = text.length === 0;
    commentSubmitBtn.classList.toggle('active', text.length > 0);
}
commentInput.addEventListener('input', checkCommentBtn);

// 뒤로가기 버튼
backBtn.addEventListener('click', () => location.href = 'board.html');

// 초기 실행 시작
initPage();