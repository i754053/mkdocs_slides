window.addEventListener('load', function() {
    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
        });
    }

    let activeDeck = null;
    let controlsTimeout = null;

    function showControls() {
        if (!activeDeck) return;
        activeDeck.classList.add('show-controls');
        if (controlsTimeout) clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => {
            activeDeck.classList.remove('show-controls');
        }, 3000);
    }

    document.querySelectorAll('.slides-deck').forEach(deck => {
        const slides = Array.from(deck.querySelectorAll('.slide'));
        const prevButton = deck.querySelector('.prev-slide');
        const nextButton = deck.querySelector('.next-slide');
        const progress = deck.querySelector('.slide-progress');
        const fullscreenBtn = deck.querySelector('.fullscreen-toggle');
        let currentIndex = 0;

        function showSlide(index) {
            slides.forEach(slide => slide.style.display = 'none');
            slides[index].style.display = 'block';
            progress.textContent = `${index + 1} / ${slides.length}`;
            prevButton.disabled = index === 0;
            nextButton.disabled = index === slides.length - 1;
        }

        function prevSlide() {
            if (currentIndex > 0) {
                currentIndex--;
                showSlide(currentIndex);
            }
        }

        function nextSlide() {
            if (currentIndex < slides.length - 1) {
                currentIndex++;
                showSlide(currentIndex);
            }
        }

        function toggleFullscreen() {
            activeDeck = deck;
            if (!document.fullscreenElement) {
                deck.requestFullscreen().then(() => {
                    deck.classList.add('fullscreen');
                    fullscreenBtn.title = 'Exit fullscreen';
                    showControls();
                    window.dispatchEvent(new Event('resize'));
                }).catch(err => console.warn('Fullscreen error:', err));
            } else {
                document.exitFullscreen().then(() => {
                    deck.classList.remove('fullscreen');
                    fullscreenBtn.title = 'Enter fullscreen';
                    window.dispatchEvent(new Event('resize'));
                });
            }
        }

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                deck.classList.remove('fullscreen');
                fullscreenBtn.title = 'Enter fullscreen';
                window.dispatchEvent(new Event('resize'));
            }
        });

        deck.addEventListener('mouseenter', () => { activeDeck = deck; });
        deck.addEventListener('click', () => {
            activeDeck = deck;
            if (deck.classList.contains('fullscreen')) showControls();
        });

        prevButton.addEventListener('click', prevSlide);
        nextButton.addEventListener('click', nextSlide);
        fullscreenBtn.addEventListener('click', toggleFullscreen);

        const mobilePrev = deck.querySelector('.mobile-prev');
        const mobileNext = deck.querySelector('.mobile-next');
        const mobileClose = deck.querySelector('.mobile-close');

        mobilePrev?.addEventListener('click', (e) => { prevSlide(); e.stopPropagation(); });
        mobileNext?.addEventListener('click', (e) => { nextSlide(); e.stopPropagation(); });
        mobileClose?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (document.fullscreenElement) document.exitFullscreen();
        });

        // Process Mermaid diagrams
        if (typeof mermaid !== 'undefined') {
            deck.querySelectorAll('.mermaid').forEach((div, index) => {
                const content = div.textContent.trim();
                if (!content) return;
                mermaid.render(`mermaid-${index}`, content)
                    .then(result => {
                        div.innerHTML = result.svg;
                        const svg = div.querySelector('svg');
                        if (svg) {
                            svg.style.width = '100%';
                            svg.style.maxWidth = '100%';
                            svg.style.height = 'auto';
                        }
                    })
                    .catch(err => console.error('Mermaid error:', err));
            });
        }

        showSlide(0);
    });

    document.addEventListener('keydown', function(e) {
        if (!activeDeck) return;

        const rect = activeDeck.getBoundingClientRect();
        const isVisible = activeDeck.classList.contains('fullscreen') ||
            (rect.top >= 0 && rect.bottom <= window.innerHeight);
        if (!isVisible) return;

        switch (e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                activeDeck.querySelector('.prev-slide').click();
                showControls();
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'PageDown':
            case ' ':
                activeDeck.querySelector('.next-slide').click();
                showControls();
                e.preventDefault();
                break;
            case 'Escape':
                if (document.fullscreenElement) document.exitFullscreen();
                e.preventDefault();
                break;
            case 'f':
            case 'F':
                activeDeck.querySelector('.fullscreen-toggle').click();
                e.preventDefault();
                break;
        }
    });
});
