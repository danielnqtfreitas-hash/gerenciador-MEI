const Auth = {
    async login(email, pass) {
        if (!email || !pass) {
            UI.showToast("Preencha todos os campos");
            return;
        }

        try {
            // Define que o login deve ser lembrado mesmo se fechar a aba (Persistência Local)
            await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            
            // Realiza o login
            await firebase.auth().signInWithEmailAndPassword(email, pass);
            UI.showToast("Bem-vindo!");
        } catch (error) {
            console.error(error);
            let msg = "Erro ao acessar";
            if (error.code === 'auth/user-not-found') msg = "Usuário não encontrado";
            if (error.code === 'auth/wrong-password') msg = "Senha incorreta";
            UI.showToast(msg);
        }
    },

    logout() {
        firebase.auth().signOut();
    }
};

// Vinculação dos eventos de clique no formulário de login
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
        loginBtn.onclick = () => {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            Auth.login(email, pass);
        };
    }
});
