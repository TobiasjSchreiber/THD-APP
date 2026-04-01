
// animations.js

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all segmented controls
    document.querySelectorAll('.segmented-control').forEach(initSegmentedControl);

    // Initial check for unread messages to show badge
    updateUnreadBadge();

});

function initSegmentedControl(control) {
    const slider = document.createElement('div');
    slider.classList.add('segment-slider');
    control.prepend(slider);

    const buttons = control.querySelectorAll('.segment-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons in this control
            buttons.forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked button
            button.classList.add('active');
            moveSlider(control);
        });
    });

    // Initial position
    moveSlider(control);
}

function moveSlider(control) {
    const slider = control.querySelector('.segment-slider');
    const activeButton = control.querySelector('.segment-btn.active');
    
    if (slider && activeButton) {
        slider.style.width = `${activeButton.offsetWidth}px`;
        slider.style.left = `${activeButton.offsetLeft}px`;

        // Special color for iLearn
        const mailPage = document.getElementById('page-mails');
        if (mailPage && mailPage.classList.contains('ilearn-active')) {
            slider.style.backgroundColor = 'var(--accent-orange)';
        } else {
            slider.style.backgroundColor = 'var(--accent-blue)';
        }
    }
}

// --- Modified switchNotificationView to use the slider ---
function switchNotificationView(viewId, buttonElement) {
    const control = buttonElement.closest('.segmented-control');
    const views = document.querySelectorAll('#page-mails .notification-view');
    views.forEach(view => view.classList.remove('active'));
    
    const targetView = document.getElementById(viewId + '-view');
    if (targetView) targetView.classList.add('active');

    const mailPage = document.getElementById('page-mails');
    if (viewId === 'ilearn') {
        mailPage.classList.add('ilearn-active');
    } else {
        mailPage.classList.remove('ilearn-active');
    }

    // The button click handler in initSegmentedControl will move the slider
}

// --- Modified switchRentalView to use the slider ---
function switchRentalView(viewId, buttonElement) {
    const card = buttonElement.closest('.rental-card');
    const control = buttonElement.closest('.segmented-control');

    const views = card.querySelectorAll('.rental-view');
    views.forEach(view => view.classList.remove('active'));
    
    const targetView = card.querySelector('#rental-' + viewId + '-view');
    if (targetView) {
        targetView.classList.add('active');
    }
    
    // The button click handler in initSegmentedControl will move the slider
}


// --- Modified toggleWidget for smooth collapse/expand ---
function toggleWidget(widgetId, checkbox) {
  const widget = document.getElementById(widgetId);
  if (widget) {
    // Add the base class if it's not there
    if (!widget.classList.contains('collapsible-widget')) {
        widget.classList.add('collapsible-widget');
    }
    
    if (checkbox.checked) {
      widget.classList.remove('collapsed');
    } else {
      widget.classList.add('collapsed');
    }
  }

  // Easter Egg check
  const allWidgets = ['widget-schedule', 'widget-mensa', 'widget-parking', 'widget-rental', 'widget-vpn'];
  const isAnyVisible = allWidgets.some(id => {
    const w = document.getElementById(id);
    const input = document.querySelector(`input[onchange="toggleWidget('${id}', this)"]`);
    return w && input && input.checked;
  });

  const emptyMsg = document.getElementById('empty-dashboard-msg');
  if (emptyMsg) {
    emptyMsg.style.display = isAnyVisible ? 'none' : 'flex';
  }
}


// --- Modified switchTab for Page Sliding ---
const pagesList = ['page-home', 'page-search', 'page-mails', 'page-profil'];
let currentIndex = 0;

function switchTab(pageId, navElement) {
    const newIndex = pagesList.indexOf(pageId);
    if (newIndex === currentIndex) return;

    const currentPageId = pagesList[currentIndex];
    const currentPage = document.getElementById(currentPageId);
    const newPage = document.getElementById(pageId);

    // Determine direction
    const direction = newIndex > currentIndex ? 'left' : 'right';

    // Set up animations
    if (direction === 'left') {
        currentPage.classList.add('exiting-left');
        newPage.classList.add('entering-right');
    } else {
        currentPage.classList.add('exiting-right');
        newPage.classList.add('entering-left');
    }

    // Activate new page and nav item
    newPage.classList.add('active');
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    navElement.classList.add('active');
    
    // Force a reflow to ensure the transition plays
    void newPage.offsetWidth; 

    // Start the transition
    if (direction === 'left') {
        currentPage.style.transform = 'translateX(-100%)';
        newPage.style.transform = 'translateX(0)';
    } else {
        currentPage.style.transform = 'translateX(100%)';
        newPage.style.transform = 'translateX(0)';
    }

    // Cleanup classes after animation
    setTimeout(() => {
        currentPage.classList.remove('active', 'exiting-left', 'exiting-right');
        newPage.classList.remove('entering-left', 'entering-right');
        // Reset transform for the old page so it's ready for next time
        currentPage.style.transform = '';
    }, 400); // Must match the transition duration in CSS

    currentIndex = newIndex;
}

// Make sure the initial active page has the correct styles
document.addEventListener('DOMContentLoaded', () => {
    pagesList.forEach((id, index) => {
        const page = document.getElementById(id);
        if (page) {
            if (index === currentIndex) {
                page.classList.add('active');
                page.style.transform = 'translateX(0)';
            } else {
                page.style.transform = 'translateX(100%)'; // Start all other pages off-screen
            }
        }
    });
});
