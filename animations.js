
// animations.js

document.addEventListener('DOMContentLoaded', () => {
    // Initial check for unread messages to show badge
    updateUnreadBadge();

});

// --- Weather Full Screen Animations ---

window.triggerWeatherAnimation = function(event) {
    // Prevent the widget swipe logic from triggering if there were conflicts
    if(event) event.stopPropagation();

    const container = document.getElementById('weather-icon-container');
    const condition = container ? container.dataset.condition : 'cloudy';

    playWeatherAnimation(condition);
};

function playWeatherAnimation(condition) {
    // Remove existing overlay if any
    const existing = document.querySelector('.weather-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'weather-overlay';
    document.body.appendChild(overlay);

    if (condition === 'rain') {
        overlay.classList.add('weather-rain');

        // Find the weather widget to make rain bounce off it
        const weatherWidget = document.getElementById('widget-weather');
        let widgetRect = null;
        if (weatherWidget && !weatherWidget.classList.contains('widget-hidden')) {
            widgetRect = weatherWidget.getBoundingClientRect();
        }

        for (let i = 0; i < 50; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';

            const leftPos = Math.random() * 100;
            drop.style.left = leftPos + 'vw';

            const duration = 0.5 + Math.random() * 0.5;
            drop.style.animationDuration = duration + 's';
            drop.style.animationDelay = (Math.random() * 1) + 's';

            // Check if this drop would hit the widget
            if (widgetRect) {
                // Convert left vw to pixels (approximate)
                const leftPx = (leftPos / 100) * window.innerWidth;

                // If drop falls within the horizontal bounds of the widget
                if (leftPx >= widgetRect.left && leftPx <= widgetRect.right) {
                    // Set custom property for fall distance to widget top
                    // Offset by the starting top position (-20px)
                    const fallDistance = widgetRect.top + 20;
                    drop.style.setProperty('--fall-distance', fallDistance + 'px');
                    drop.classList.add('rain-bounce'); // specific class for bounced drops

                    // The standard animation takes `duration` seconds to fall 110vh (viewportHeight * 1.1)
                    // The drop should bounce at `fallDistance`
                    const viewportHeight = window.innerHeight;
                    const adjustedDuration = duration * (fallDistance / (viewportHeight * 1.1));
                    drop.style.animationDuration = adjustedDuration + 's';
                }
            }

            overlay.appendChild(drop);
        }
    } else if (condition === 'sunny') {
        overlay.classList.add('weather-sunny');
        const sun = document.createElement('div');
        sun.className = 'sun-flare';
        overlay.appendChild(sun);

        for(let i=0; i<3; i++) {
            const lens = document.createElement('div');
            lens.className = `lens-flare-circle flare-${i}`;
            overlay.appendChild(lens);
        }
    } else if (condition === 'cloudy') {
        overlay.classList.add('weather-cloudy');
        for (let i = 0; i < 6; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud-drift';
            cloud.style.top = (10 + Math.random() * 50) + 'vh';
            cloud.style.animationDuration = (10 + Math.random() * 15) + 's';
            cloud.style.animationDelay = (Math.random() * 5) + 's';
            // Randomly scale clouds
            const scale = 0.5 + Math.random() * 1;
            cloud.style.transform = `scale(${scale})`;
            overlay.appendChild(cloud);
        }
    } else if (condition === 'snow') {
        overlay.classList.add('weather-snow');
        for (let i = 0; i < 50; i++) {
            const flake = document.createElement('div');
            flake.className = 'snow-flake';
            flake.style.left = Math.random() * 100 + 'vw';
            flake.style.animationDuration = (3 + Math.random() * 4) + 's';
            flake.style.animationDelay = (Math.random() * 3) + 's';
            flake.style.opacity = Math.random();
            const size = 3 + Math.random() * 5;
            flake.style.width = size + 'px';
            flake.style.height = size + 'px';
            overlay.appendChild(flake);
        }
    }

    // Trigger fade out and removal
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 1000);
    }, 3000);
}
