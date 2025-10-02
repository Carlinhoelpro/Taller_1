const actionSelect = document.getElementById('actionSelect');
        const roleSection = document.getElementById('roleSection');
        const roleSelect = document.getElementById('roleSelect');
        const fieldsSection = document.getElementById('fieldsSection');
        const rutSection = document.getElementById('rutSection');
        const submitBtn = document.getElementById('submitBtn');

        actionSelect.addEventListener('change', () => {
            if (actionSelect.value) {
                roleSection.classList.remove('hidden');
            } else {
                roleSection.classList.add('hidden');
                fieldsSection.classList.add('hidden');
                submitBtn.classList.add('hidden');
            }
            roleSelect.value = "";
            rutSection.classList.add('hidden');
        });

        roleSelect.addEventListener('change', () => {
            if (roleSelect.value) {
                fieldsSection.classList.remove('hidden');
                submitBtn.classList.remove('hidden');
                if (roleSelect.value === 'admin') {
                    rutSection.classList.remove('hidden');
                    document.getElementById('rut').required = true;
                } else {
                    rutSection.classList.add('hidden');
                    document.getElementById('rut').required = false;
                }
            } else {
                fieldsSection.classList.add('hidden');
                submitBtn.classList.add('hidden');
                rutSection.classList.add('hidden');
            }
        });