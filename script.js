document.addEventListener('DOMContentLoaded', function () {
    const sections = Array.from(document.querySelectorAll('section'));
    const navLinks = document.querySelectorAll('nav ul li a');
    let currentSectionIndex = 0;
    let isScrolling = false;

    // Function to scroll to a specific section
    function scrollToSection(index) {
        if (index >= 0 && index < sections.length) {
            const headerHeight = document.querySelector('header').offsetHeight;
            // Additional offset of 20px before the start of the section's text
            const additionalOffset = -100;
            const sectionTop = sections[index].offsetTop - headerHeight - additionalOffset;
    
            window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
            });
    
            currentSectionIndex = index;
            isScrolling = true;
            setTimeout(() => { isScrolling = false; }, 500); // Adjust delay as needed
        }
    }
    

    // Update currentSectionIndex and scroll to section on nav link click
    navLinks.forEach((link, index) => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            scrollToSection(index);
            highlightActiveSection();
        });
    });

    // Highlight active section in navigation
    function highlightActiveSection() {
        let scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
        sections.forEach((section, index) => {
            if (section.offsetTop <= scrollPosition && (section.offsetTop + section.offsetHeight) > scrollPosition) {
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

    // Handle wheel event for smooth section navigation
    window.addEventListener('wheel', function (e) {
        if (isScrolling) return;

        if (e.deltaY > 0 && currentSectionIndex < sections.length - 1) {
            // Scrolling down
            scrollToSection(currentSectionIndex + 1);
        } else if (e.deltaY < 0 && currentSectionIndex > 0) {
            // Scrolling up
            scrollToSection(currentSectionIndex - 1);
        }
    });
});