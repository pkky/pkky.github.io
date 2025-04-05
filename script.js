// --- Dark Mode Logic (Add to script.js) ---

const darkModeToggle = document.getElementById('darkModeToggle');
const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const currentTheme = localStorage.getItem('theme');

// Function to apply the theme (dark or light)
function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = false;
    }
    // --- Call map-specific theme update IF it exists ---
    if (typeof updateMapTheme === 'function') {
        updateMapTheme(isDark);
    }
    // --- End map-specific call ---
}

// Function to handle the toggle click/change
function handleThemeToggle() {
    const isDark = darkModeToggle.checked;
    applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Initialize theme on page load
function initializeDarkMode() {
    let useDark = false;
    if (currentTheme === 'dark') {
        useDark = true;
    } else if (currentTheme === 'light') {
        useDark = false;
    } else {
        // No preference saved, use system preference
        useDark = userPrefersDark;
    }
    applyTheme(useDark);

    // Add listener to the toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', handleThemeToggle);
    }

    // Optional: Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Only apply system change if no explicit preference is saved
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches);
        }
    });
}

// Call initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initializeDarkMode);

document.addEventListener('DOMContentLoaded', function () {
    const sections = Array.from(document.querySelectorAll('section'));
    const navLinks = document.querySelectorAll('nav ul li a');
    let currentSectionIndex = 0;
    let isScrolling = false;

    function scrollToSection(index) {
        if (index >= 0 && index < sections.length) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const sectionTop = sections[index].offsetTop - headerHeight;

            window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
            });

            currentSectionIndex = index;
            isScrolling = true;
            setTimeout(() => { isScrolling = false; }, 500);
        }
    }

    navLinks.forEach((link, index) => {
        // Only intercept links that start with '#' for in-page scrolling.
        if (link.getAttribute('href').startsWith('#')) {
          link.addEventListener('click', function (e) {
            e.preventDefault();
            scrollToSection(index);
            highlightActiveSection();
          });
        }
      });      

    function highlightActiveSection() {
        let scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
        const headerHeight = document.querySelector('header').offsetHeight;
        sections.forEach((section, index) => {
            if (section.offsetTop <= scrollPosition + headerHeight && (section.offsetTop + section.offsetHeight) > scrollPosition + headerHeight) {
                currentSectionIndex = index;
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (section.getAttribute('id') === link.getAttribute('href').substring(1)) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightActiveSection);

    window.addEventListener('wheel', function (e) {
        const projectContent = document.querySelector('.project-content:not(.hidden)');
        if (isScrolling) return;

        if (projectContent && projectContent.contains(e.target)) {
            return;
        }

        if (e.deltaY > 0 && currentSectionIndex < sections.length - 1) {
            scrollToSection(currentSectionIndex + 1);
        } else if (e.deltaY < 0 && currentSectionIndex > 0) {
            scrollToSection(currentSectionIndex - 1);
        }
    });

    const projectLinks = document.querySelectorAll('.project-link');

    projectLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const projectContent = this.nextElementSibling;
            const projectCode = projectContent.querySelector('.project-code');
            const file = this.getAttribute('data-file');
            const icon = this.querySelector('i');

            document.querySelectorAll('.project-content').forEach(content => {
                if (content !== projectContent) {
                    content.classList.add('hidden');
                    content.previousElementSibling.querySelector('i').classList.remove('rotate-up');
                    content.previousElementSibling.querySelector('i').classList.add('rotate-down');
                }
            });

            if (projectContent.classList.contains('hidden')) {
                fetch(file)
                    .then(response => response.text())
                    .then(text => {
                        projectCode.textContent = text;
                        projectContent.classList.remove('hidden');
                        projectContent.scrollTop = 0; // Reset scroll position to top
                        icon.classList.remove('rotate-down');
                        icon.classList.add('rotate-up');
                    });
            } else {
                projectContent.classList.add('hidden');
                icon.classList.remove('rotate-up');
                icon.classList.add('rotate-down');
            }
        });
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.project-link') && !e.target.closest('.project-content')) {
            document.querySelectorAll('.project-content').forEach(content => {
                content.classList.add('hidden');
                const icon = content.previousElementSibling.querySelector('i');
                if (icon) {
                    icon.classList.remove('rotate-up');
                    icon.classList.add('rotate-down');
                }
            });
        }
    });    

    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', function () {
            const code = this.nextElementSibling.textContent;
            navigator.clipboard.writeText(code)
                .then(() => {
                    alert("Kod skopiowany!");
                })
                .catch(err => {
                    console.error("Error: ", err);
                });
        });
    });
});
