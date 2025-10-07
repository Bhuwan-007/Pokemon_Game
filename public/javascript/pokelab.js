document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('bgVideo');
    
    // Select ALL button containers that should be revealed after the video ends.
    // Use the class you defined in the CSS (e.g., .pokedex-btn-container, .another-btn-container, etc.)
    const buttonsToReveal = document.querySelectorAll('.pokedex-btn-container'); // Add more selectors if you have more button containers

    // Ensure the video starts playing automatically
    video.play().catch(error => {
        console.error('Error attempting to play the video:', error);
    });


    // 1. Listen for the event that signals the video has finished playing.
    video.addEventListener('ended', () => {
        
        // A. Start the fade-out of the video

        setTimeout(() => {
            
            // Reveal all buttons by adding the 'buttons-visible' class
            buttonsToReveal.forEach(container => {
                container.classList.add('buttons-visible');
            });

        }, 500); // Start button fade-in 500ms after video stops
    });
});