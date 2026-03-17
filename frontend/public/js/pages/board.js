// public/js/board.js
import { request } from '../core/api.js';
import { formatNumber, formatDate } from '../core/utils.js';

// 1. 상태 관리 변수 추가
let lastPostId = null;   // 다음 데이터를 가져올 기준점 (커서)
let isFetching = false;  // 중복 요청 방지 플래그
let hasNext = true;      // 더 가져올 데이터가 남아있는지 여부
const PAGE_SIZE = 10;    // 한 번에 가져올 개수

const postList = document.getElementById('postList');
const observerElement = document.getElementById('scrollObserver');

// function formatNumber(num) {
//     if (num >= 1000) return Math.floor(num / 1000) + 'k';
//     return num;
// }

// 2. 서버에서 게시글 데이터를 가져오고 화면에 그리는 통합 함수
async function loadAndRenderPosts() {
    // 이미 데이터를 가져오는 중이거나 더 이상 가져올 데이터가 없으면 중단합니다.
    if (isFetching || !hasNext) return;

    isFetching = true;
    try {
        // [기존] 'http://127.0.0.1:8000/api/v1/posts' 단일 요청에서
        // [수정] lastPostId를 포함한 페이징 쿼리 요청으로 변경
        let path = `/posts?size=${PAGE_SIZE}`;
        if (lastPostId) path += `&lastPostId=${lastPostId}`;

        const result = await request(path);
        const { posts, nextCursor } = result.data;
        // const response = await fetch(url, {
        //     method: 'GET',
        //     headers: { 'Content-Type': 'application/json' },
        //     credentials: 'include' 
        // });

        // const result = await response.json();

        // 첫 페이지 로드(lastPostId가 null)일 때만 목록을 비웁니다.
        if (!lastPostId) {
            postList.innerHTML = "";
            if (!posts || posts.length === 0) {
                postList.innerHTML = "<p style='text-align:center; padding:20px;'>게시글이 없습니다.</p>";
                hasNext = false;
                return;
            }
        }

        // [기존] renderPostList()를 호출해 매번 새로 그렸으나
        // [수정] 기존 목록을 유지하며 appendChild로 새 데이터를 뒤에 붙입니다.
        posts.forEach(post => {
            const postEl = createPostElement(post);
            postList.appendChild(postEl);
        });

        // [추가] 다음 조회를 위해 마지막 게시글 ID를 업데이트합니다.
        lastPostId = nextCursor; 
        
        // 더 이상 데이터가 없으면(nextCursor가 null) 감시를 중단합니다.
        if (!nextCursor) hasNext = false;
        
    } catch (error) {
        console.error("게시판 로드 실패:", error.message);
    } finally {
        isFetching = false;
    }
}

// [추가] 스크롤을 감지하는 옵저버입니다.
const observer = new IntersectionObserver((entries) => {
    // 화면 바닥(scrollObserver)이 보이면 loadAndRenderPosts를 실행합니다.
    if (entries[0].isIntersecting && hasNext && !isFetching) {
        loadAndRenderPosts();
    }
}, { threshold: 0.1 });

// // 3. 게시물 리스트를 순회하며 화면에 추가하는 함수
// function renderPostList(posts) {
//     postList.innerHTML = ""; // 기존 목록 비우기

//     if (!posts || posts.length === 0) {
//         postList.innerHTML = "<p style='text-align:center; padding:20px;'>게시글이 없습니다.</p>";
//         return;
//     }

//     posts.forEach(post => {
//         const postEl = createPostElement(post);
//         postList.appendChild(postEl);
//     });
// }

// 4. 개별 게시물 카드를 만드는 함수
function createPostElement(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    
    // 클릭 시 상세 페이지 이동 (글 ID를 쿼리 스트링으로 전달)
    card.onclick = () => location.href = `post_detail.html?id=${post.postId}`;

    // 제목 길이에 따른 말줄임 처리 (JS 혹은 CSS로 처리 가능)
    let displayTitle = post.title;
    if (displayTitle.length > 26) {
        displayTitle = displayTitle.substring(0, 26) + "...";
    }
    const authorImgUrl = post.author.profileImage;
    const formattedDate = formatDate(post.createdAt);
    // 서버 데이터 키값(likes, comments, views 등)이 백엔드 모델과 일치하는지 확인 필수
    card.innerHTML = `
        <h3 class="card-title">${displayTitle}</h3>
        <div class="card-info">
            <div class="stats">
                <span>좋아요 ${formatNumber(post.likeCount || 0)}</span>
                <span>댓글 ${formatNumber(post.commentCount || 0)}</span>
                <span>조회수 ${formatNumber(post.viewCount || 0)}</span>
            </div>
            <div class="date">${formattedDate}</div>
        </div>
        <div class="card-author">
            <div class="author-img" 
                 style="background-image: url('${authorImgUrl}');">
            </div>
            <span class="author-name">${post.author.nickname}</span>
        </div>
    `;
    return card;
}

// 단순히 함수를 호출하는 대신, 포커스가 돌아올 때마다 갱신하도록 설정 가능
window.addEventListener('pageshow', (event) => {
    // 페이지 진입 시 상태 초기화
    lastPostId = null;
    hasNext = true;
    postList.innerHTML = "";
    
    // 초기 10개 로드 및 옵저버 활성화
    loadAndRenderPosts(); 
    observer.observe(observerElement);
});