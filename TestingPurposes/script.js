document.addEventListener('DOMContentLoaded', function () {
    const nav = document.querySelector('.nav-mobile');
    const navList = document.querySelector('.nav-list');
    
    nav.addEventListener('click', function () {
        navList.classList.toggle('nav-active');
    });
});
