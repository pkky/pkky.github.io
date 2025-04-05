const darkModeToggle = document.getElementById('darkModeToggle');
const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const currentTheme = localStorage.getItem('theme');

function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = false;
    }
    if (typeof updateMapTheme === 'function') {
        updateMapTheme(isDark);
    }
}

function handleThemeToggle() {
    const isDark = darkModeToggle.checked;
    applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function initializeDarkMode() {
    let useDark = false;
    if (currentTheme === 'dark') {
        useDark = true;
    } else if (currentTheme === 'light') {
        useDark = false;
    } else {
        useDark = userPrefersDark;
    }
    applyTheme(useDark);

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', handleThemeToggle);
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches);
        }
    });
}

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
            const projectCode = projectContent?.querySelector('.project-code');
            const file = this.getAttribute('data-file');
            const icon = this.querySelector('i');

            if (!projectContent || !projectCode || !file || !icon) {
                console.error("Error: Could not find required elements for project link:", this);
                return;
            }

            document.querySelectorAll('.project-content').forEach(content => {
                if (content !== projectContent && !content.classList.contains('hidden')) {
                    console.log("Closing other project:", content.previousElementSibling?.getAttribute('data-file'));
                    content.classList.add('hidden');
                    const otherIcon = content.previousElementSibling?.querySelector('i');
                    if (otherIcon) {
                        otherIcon.classList.remove('rotate-up');
                        otherIcon.classList.add('rotate-down');
                    }
                }
            });
            if (projectContent.classList.contains('hidden')) {

                fetch(file)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status} (${response.statusText})`);
                        }
                        return response.text();
                    })
                    .then(text => {
                        projectCode.textContent = text;
                        projectContent.classList.remove('hidden');
                        projectContent.scrollTop = 0;
                        icon.classList.remove('rotate-down');
                        icon.classList.add('rotate-up');
                        console.log(`Displayed content for ${file}`);
                    })
                    .catch(error => {
                        projectCode.textContent = `Error loading file: ${file}\n${error.message}\n\nPlease check the file path exists relative to index.html and that the server allows access.`;
                        projectContent.classList.remove('hidden');
                        projectContent.scrollTop = 0;
                        icon.classList.remove('rotate-up');
                        icon.classList.add('rotate-down');
                    });

            } else {
                console.log(`Hiding content for ${file}`);
                projectContent.classList.add('hidden');
                icon.classList.remove('rotate-up');
                icon.classList.add('rotate-down');
            }
        });
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.project-link') && !e.target.closest('.project-content')) {
            document.querySelectorAll('.project-content').forEach(content => {
                if (!content.classList.contains('hidden')) {
                    content.classList.add('hidden');
                    const icon = content.previousElementSibling?.querySelector('i');
                    if (icon) {
                        icon.classList.remove('rotate-up');
                        icon.classList.add('rotate-down');
                    }
                }
            });
        }
    });

    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', function () {
            const codeElement = this.nextElementSibling;
            const code = codeElement?.textContent;
            if (code) {
                navigator.clipboard.writeText(code)
                    .then(() => {
                        button.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                             button.innerHTML = '<i class="far fa-copy"></i>';
                        }, 1500);
                    })
                    .catch(err => {
                        console.error("Clipboard copy error: ", err);
                        alert("Failed to copy code.");
                    });
            } else {
                console.error("Could not find code element to copy from:", this);
            }
        });
    });
});
