        // Mostrar nombre de usuario 
        function mostrarNombrePerfil() {
            let nombre = localStorage.getItem('usuarioNombre') || 'Usuario';
            document.getElementById('perfil-nombre').textContent = nombre;
            document.getElementById('perfil-nombre-edit').value = nombre;
        }
        mostrarNombrePerfil();

        // Editar nombre
        document.getElementById('editar-nombre-btn').onclick = function() {
            document.getElementById('perfil-nombre').style.display = 'none';
            document.getElementById('perfil-nombre-edit').style.display = '';
            this.style.display = 'none';
            document.getElementById('guardar-nombre-btn').style.display = '';
        };
        document.getElementById('guardar-nombre-btn').onclick = function() {
            let nuevoNombre = document.getElementById('perfil-nombre-edit').value.trim();
            if (nuevoNombre.length > 0) {
                localStorage.setItem('usuarioNombre', nuevoNombre);
                mostrarNombrePerfil();
            }
            document.getElementById('perfil-nombre').style.display = '';
            document.getElementById('perfil-nombre-edit').style.display = 'none';
            this.style.display = 'none';
            document.getElementById('editar-nombre-btn').style.display = '';
        };

        // Cambiar imagen de usuario
        document.getElementById('perfil-img-input').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    document.getElementById('perfil-img').src = evt.target.result;
                    localStorage.setItem('perfilImg', evt.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
        // Cargar imagen guardada
        const imgGuardada = localStorage.getItem('perfilImg');
        if (imgGuardada) {
            document.getElementById('perfil-img').src = imgGuardada;
        }