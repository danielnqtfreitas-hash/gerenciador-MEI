const Auth = {
    async login(email, pass) {
        if (!email || !pass) {
            UI.showToast("Preencha todos os campos");
            return;
        }
        try {
            await firebase.auth().signInWithEmailAndPassword(email, pass);
        } catch (error) {
            console.error(error);
            UI.showToast("E-mail ou senha incorretos");
        }
    },

    async signup(email, pass) {
        if (!email || !pass) {
            UI.showToast("Use um e-mail válido");
            return;
        }
        try {
            await firebase.auth().createUserWithEmailAndPassword(email, pass);
            UI.showToast("Conta criada com sucesso!");
        } catch (error) {
            UI.showToast("Erro ao criar conta");
        }
    },

    logout() {
        firebase.auth().signOut();
    }
};

// Vinculação dos eventos de clique
document.getElementById('btn-login').onclick = () => {
    const e = document.getElementById('login-email').value;
    const p = document.getElementById('login-pass').value;
    Auth.login(e, p);
};
