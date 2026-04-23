/**
 * Módulo de Base de Dados - Vitrine Pro
 * Gere a persistência de dados no Firestore com organização por Utilizador.
 */

const Database = {
    /**
     * Subscreve aos dados em tempo real.
     * Filtra os documentos pelo ID do utilizador logado.
     */
    subscribe(collectionName, userId, callback) {
        if (!userId) return;

        // Acedemos à coleção e filtramos pelo campo userId
        return firebase.firestore().collection(collectionName)
            .where("userId", "==", userId)
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    type: collectionName,
                    ...doc.data()
                })).sort((a, b) => new Date(b.data) - new Date(a.data));

                callback(data);
            }, error => {
                console.error(`Erro ao ler ${collectionName}:`, error);
            });
    },

    /**
     * Guarda ou atualiza um item no Firestore.
     * Vincula o registo ao userId para criar a segregação de dados.
     */
    async saveItem(collectionName, data, userId) {
        if (!userId) return false;

        try {
            const payload = {
                descricao: data.descricao,
                valor: parseFloat(data.valor) || 0,
                data: data.data,
                userId: userId, // Vínculo com a "pasta" do utilizador
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const db = firebase.firestore();
            
            if (data.id && data.id.trim() !== "") {
                // Atualiza registo existente
                await db.collection(collectionName).doc(data.id).update(payload);
            } else {
                // Cria novo registo
                payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection(collectionName).add(payload);
            }
            
            return true;
        } catch (error) {
            console.error("Erro ao salvar no Firestore:", error);
            return false;
        }
    },

    /**
     * Remove um item da base de dados.
     */
    async deleteItem(collectionName, id) {
        if (!confirm("Deseja eliminar este registo permanentemente?")) return;

        try {
            await firebase.firestore().collection(collectionName).doc(id).delete();
            if (typeof UI !== 'undefined') UI.showToast("Eliminado com sucesso!");
        } catch (error) {
            console.error("Erro ao eliminar:", error);
        }
    }
};

/**
 * Função Global de Submissão (Chamada pelo onsubmit do Index)
 * Impede o recarregamento da página e processa o salvamento.
 */
window.handleFormSubmit = async function(event) {
    // 1. Interrompe o comportamento padrão (refresh) do formulário
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const btn = document.getElementById('btn-save');
    const originalText = btn.innerHTML;
    
    // 2. Verifica se o utilizador está autenticado
    const user = firebase.auth().currentUser;
    if (!user) {
        if (typeof UI !== 'undefined') UI.showToast("Erro: Utilizador não identificado.");
        return false;
    }

    // 3. Captura os dados dos inputs do formulário
    const itemData = {
        id: document.getElementById('edit-id').value,
        descricao: document.getElementById('inp-desc').value,
        valor: document.getElementById('inp-valor').value,
        data: document.getElementById('inp-data').value
    };

    // Define qual a coleção (venda, custo ou lucro)
    const collectionType = (typeof UI !== 'undefined' && UI.activeModalType) ? UI.activeModalType : 'faturamentos';

    try {
        // Feedback visual de carregamento
        btn.disabled = true;
        btn.innerHTML = "<i class='ph ph-circle-notch animate-spin'></i> A GUARDAR...";

        const success = await Database.saveItem(collectionType, itemData, user.uid);

        if (success) {
            if (typeof UI !== 'undefined') {
                UI.showToast("Dados guardados com sucesso!");
                UI.closeModal();
            }
        } else {
            throw new Error("Falha na gravação");
        }
    } catch (err) {
        if (typeof UI !== 'undefined') UI.showToast("Erro ao comunicar com o servidor.");
    } finally {
        // Restaura o botão
        btn.disabled = false;
        btn.innerHTML = originalText;
    }

    return false; // Garantia adicional contra o refresh
};

// Exporta o objeto para o escopo global
window.Database = Database;
