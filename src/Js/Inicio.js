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

const usuarioBtn = document.getElementById('usuario-btn');
const usuarioMenu = document.getElementById('usuario-menu');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const perfilBtn = document.getElementById('perfil-btn');
const usuarioModal = document.getElementById('usuario-modal');
const usuarioModalClose = document.getElementById('usuario-modal-close');
const usuarioForm = document.getElementById('usuario-form');
const modalTitle = document.getElementById('modal-title');
const tipoCuenta = document.getElementById('tipo-cuenta');
const rutGroup = document.getElementById('rut-group');

usuarioBtn.addEventListener('click', (e) => {
    usuarioMenu.classList.toggle('hidden');
    e.stopPropagation();
});
document.addEventListener('click', (e) => {
    if (!usuarioMenu.contains(e.target) && !usuarioBtn.contains(e.target)) {
        usuarioMenu.classList.add('hidden');
    }
});

function resetUsuarioModal() {
    usuarioForm.reset();
    tipoCuenta.value = "";
    rutGroup.classList.add('hidden');
    document.getElementById('modal-rut').required = false;
}
loginBtn.addEventListener('click', () => {
    modalTitle.textContent = "Iniciar sesión";
    resetUsuarioModal();
    usuarioModal.classList.remove('hidden');
    usuarioMenu.classList.add('hidden');
});
registerBtn.addEventListener('click', () => {
    modalTitle.textContent = "Registrar usuario";
    resetUsuarioModal();
    usuarioModal.classList.remove('hidden');
    usuarioMenu.classList.add('hidden');
});
usuarioModalClose.addEventListener('click', () => {
    usuarioModal.classList.add('hidden');
});
usuarioModal.addEventListener('click', (e) => {
    if (e.target === usuarioModal) usuarioModal.classList.add('hidden');
});

tipoCuenta.addEventListener('change', () => {
    if (tipoCuenta.value === 'admin') {
        rutGroup.classList.remove('hidden');
        document.getElementById('modal-rut').required = true;
    } else {
        rutGroup.classList.add('hidden');
        document.getElementById('modal-rut').required = false;
    }
});

perfilBtn.addEventListener('click', () => {
    window.location.href = "../Html/PerfilUsuario.html";
});

usuarioForm.addEventListener('submit', function(e) {
    e.preventDefault();
    let email = document.getElementById('modal-email').value;
    let nombre = email.split('@')[0];
    localStorage.setItem('usuarioNombre', nombre);
    usuarioModal.classList.add('hidden');
    alert('¡Bienvenido, ' + nombre + '!');
});

const carruselImgs = document.querySelectorAll('.carrusel-img');
const carruselIndicadores = document.getElementById('carrusel-indicadores');
let carruselIndex = 0;
let carruselInterval;

function mostrarCarruselImg(idx) {
    carruselImgs.forEach((img, i) => {
        img.classList.toggle('active', i === idx);
    });
    Array.from(carruselIndicadores.children).forEach((dot, i) => {
        dot.classList.toggle('active', i === idx);
    });
    carruselIndex = idx;
}
function siguienteCarrusel() {
    let idx = (carruselIndex + 1) % carruselImgs.length;
    mostrarCarruselImg(idx);
}
function iniciarCarrusel() {
    carruselInterval = setInterval(siguienteCarrusel, 3000);
}
function detenerCarrusel() {
    clearInterval(carruselInterval);
}
if (carruselImgs.length > 0) {
    carruselImgs.forEach((_, i) => {
        let dot = document.createElement('span');
        dot.addEventListener('click', () => {
            mostrarCarruselImg(i);
            detenerCarrusel();
            iniciarCarrusel();
        });
        carruselIndicadores.appendChild(dot);
    });
    mostrarCarruselImg(0);
    iniciarCarrusel();
    document.getElementById('carrusel').addEventListener('mouseenter', detenerCarrusel);
    document.getElementById('carrusel').addEventListener('mouseleave', iniciarCarrusel);
}