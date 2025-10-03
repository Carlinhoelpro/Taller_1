document.querySelectorAll('.BarraNavegacion li a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (target) {
            e.preventDefault();
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight : 80;
            const y = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 8;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.BarraNavegacion li a');

    function onScroll() {
        let scrollPos = window.scrollY + 120;
        let currentId = '';
        sections.forEach(section => {
            if (scrollPos >= section.offsetTop) {
                currentId = section.id;
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentId) {
                link.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', onScroll);
    onScroll();
});

const sections = document.querySelectorAll('section');
function revealSectionsOnScroll() {
    const triggerBottom = window.innerHeight * 0.92;
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop < triggerBottom) {
            section.classList.add('visible');
        }
    });
}
window.addEventListener('scroll', revealSectionsOnScroll);
window.addEventListener('DOMContentLoaded', revealSectionsOnScroll);