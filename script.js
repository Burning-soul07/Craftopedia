// 1. Configuration - USING YOUR NEW FRESH KEY
const API_KEY = 'AIzaSyBLMP7cOIj0mh95dFFxEGThvXCqSxzVRXg'; 
let currentQuery = 'best art and craft tutorials'; 
const MAX_RESULTS = 12;

let nextPageToken = ''; 
let isFetching = false; 
let currentVideoState = null; // Tracks what is currently playing

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
const watchLikeBtn = document.getElementById('watch-like-btn');

// 2. Fetching Logic
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

        if (!response.ok) {
            console.error("🛑 API Error:", data.error.message);
            isFetching = false;
            return;
        }

        nextPageToken = data.nextPageToken || ''; 

        data.items.forEach(item => {
            if(item.id.videoId) {
                createCard(galleryContainer, item.id.videoId, item.snippet.thumbnails.high.url, item.snippet.title);
            }
        });
        isFetching = false;
    } catch (error) {
        console.error("Network Error:", error);
        isFetching = false;
    }
}

// 3. Card Creation (With Thumbnail Hearts)
function createCard(target, videoId, img, title) {
    const card = document.createElement('div');
    card.classList.add('video-card');
    card.setAttribute('data-id', videoId);
    card.style.position = 'relative'; 

    card.innerHTML = `
        <button class="like-btn" id="like-${videoId}">
            <i class="fa-solid fa-heart"></i>
        </button>
        <img src="${img}" class="thumbnail">
        <div class="video-info"><h3 class="video-title">${title}</h3></div>
    `;
    
    card.addEventListener('click', () => openVideo(videoId, title, img));
    target.appendChild(card);

    const likeBtn = card.querySelector(`#like-${videoId}`);
    
    // Heart Click Logic
    likeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if(window.toggleLike) {
            window.toggleLike(videoId, title, img, likeBtn);
            
            // Sync with Watch Screen button if this video is currently playing
            if(currentVideoState && currentVideoState.id === videoId) {
                watchLikeBtn.classList.toggle('active');
            }
        }
    });

    // Check Firebase if liked
    setTimeout(() => {
        if(window.checkIfLiked) window.checkIfLiked(videoId, likeBtn);
    }, 1000);
}

// 4. Watch Screen Logic
function openVideo(videoId, title, img) {
    currentVideoState = { id: videoId, title: title, img: img };

    youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    nowPlayingTitle.innerText = title;

    gallerySection.classList.add('hidden');
    watchSection.classList.remove('hidden');

    // Load Side Gallery
    sideGallery.innerHTML = galleryContainer.innerHTML;
    const sideCards = sideGallery.querySelectorAll('.video-card');
    sideCards.forEach((card) => {
        const id = card.getAttribute('data-id');
        const cardTitle = card.querySelector('.video-title').innerText;
        const cardImg = card.querySelector('.thumbnail').src;
        card.addEventListener('click', () => openVideo(id, cardTitle, cardImg));
    });

    // Reset and Check Watch Screen Heart
    watchLikeBtn.classList.remove('active');
    if (window.checkIfLiked) window.checkIfLiked(videoId, watchLikeBtn);

    window.scrollTo(0, 0);
}

// 5. Watch Screen Heart Click
watchLikeBtn.addEventListener('click', () => {
    if (currentVideoState && window.toggleLike) {
        window.toggleLike(currentVideoState.id, currentVideoState.title, currentVideoState.img, watchLikeBtn);
        
        // Sync the thumbnail heart in the background
        const galleryBtn = document.getElementById(`like-${currentVideoState.id}`);
        if (galleryBtn) galleryBtn.classList.toggle('active');
    }
});

function closeVideo() {
    youtubePlayer.src = ""; 
    watchSection.classList.add('hidden');
    gallerySection.classList.remove('hidden');
    currentVideoState = null;
    window.scrollTo(0, 0);
}

// 6. Search & Scroll
function handleSearch() {
    const val = searchInput.value.trim();
    if (val !== "") {
        currentQuery = `${val} art and craft DIY tutorial`; 
        fetchCraftVideos(true);
    }
}

window.addEventListener('scroll', () => {
    if (!gallerySection.classList.contains('hidden')) {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 800) {
            if (nextPageToken && !isFetching) fetchCraftVideos();
        }
    }
});

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
closeWatchBtn.addEventListener('click', closeVideo);

fetchCraftVideos();
