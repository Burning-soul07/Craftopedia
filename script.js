// 1. Configuration
const API_KEY = 'AIzaSyCmH2f37LI1z0TzkgYf0v_IoosxaICIWYY'; 
let currentQuery = 'best art and craft tutorials'; // Default landing page search
const MAX_RESULTS = 12;

let nextPageToken = ''; 
let isFetching = false; 

// DOM Elements
const galleryContainer = document.getElementById('video-gallery');
const watchSection = document.getElementById('watch-section');
const gallerySection = document.getElementById('gallery-section');
const sideGallery = document.getElementById('side-gallery');
const nowPlayingTitle = document.getElementById('now-playing-title');
const youtubePlayer = document.getElementById('youtube-player');
const closeWatchBtn = document.getElementById('close-watch');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// 2. Fetching Logic (Filtered for Crafts)
async function fetchCraftVideos(isNewSearch = false) {
    if (isFetching) return; 
    isFetching = true;

    if (isNewSearch) {
        galleryContainer.innerHTML = '';
        nextPageToken = '';
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${MAX_RESULTS}&q=${encodeURIComponent(currentQuery)}&type=video&videoEmbeddable=true&videoDuration=medium&videoCategoryId=26&pageToken=${nextPageToken}&key=${API_KEY}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        nextPageToken = data.nextPageToken || ''; 

        data.items.forEach(item => {
            if(item.id.videoId) {
                createCard(galleryContainer, item.id.videoId, item.snippet.thumbnails.high.url, item.snippet.title);
            }
        });
        isFetching = false;
    } catch (error) {
        console.error("API Error:", error);
        isFetching = false;
    }
}

// 3. Card Creation (UPDATED with Heart Button)
function createCard(target, videoId, img, title) {
    const card = document.createElement('div');
    card.classList.add('video-card');
    card.setAttribute('data-id', videoId);
    card.style.position = 'relative'; // Required for absolute heart positioning

    card.innerHTML = `
        <button class="like-btn" id="like-${videoId}">
            <i class="fa-solid fa-heart"></i>
        </button>
        <img src="${img}" class="thumbnail">
        <div class="video-info"><h3 class="video-title">${title}</h3></div>
    `;
    
    // Open Video logic
    card.addEventListener('click', () => openVideo(videoId, title));
    target.appendChild(card);

    // Heart Button Click Logic
    const likeBtn = card.querySelector(`#like-${videoId}`);
    likeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents the video from opening when clicking the heart
        if(window.toggleLike) {
            window.toggleLike(videoId, title, img, likeBtn);
        }
    });

    // Check if already liked on load
    // We use a slight delay to ensure Firebase is ready
    setTimeout(() => {
        if(window.checkIfLiked) window.checkIfLiked(videoId, likeBtn);
    }, 500);
}}

// 4. State Management: Gallery <-> Theater Mode
function openVideo(videoId, title) {
    youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    nowPlayingTitle.innerText = title;

    gallerySection.classList.add('hidden');
    watchSection.classList.remove('hidden');

    sideGallery.innerHTML = galleryContainer.innerHTML;
    
    const sideCards = sideGallery.querySelectorAll('.video-card');
    sideCards.forEach((card) => {
        const id = card.getAttribute('data-id');
        const cardTitle = card.querySelector('.video-title').innerText;
        card.addEventListener('click', () => openVideo(id, cardTitle));
    });

    window.scrollTo(0, 0);
}

function closeVideo() {
    youtubePlayer.src = ""; 
    watchSection.classList.add('hidden');
    gallerySection.classList.remove('hidden');
    window.scrollTo(0, 0);
}

// 5. Search Logic (Filtering News)
function handleSearch() {
    const val = searchInput.value.trim();
    if (val !== "") {
        currentQuery = `${val} art and craft DIY tutorial`; 
        fetchCraftVideos(true);
    }
}

// 6. Infinite Scroll
window.addEventListener('scroll', () => {
    if (!gallerySection.classList.contains('hidden')) {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 600) {
            if (nextPageToken && !isFetching) fetchCraftVideos();
        }
    }
});

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
closeWatchBtn.addEventListener('click', closeVideo);

// Initial Load
fetchCraftVideos();
