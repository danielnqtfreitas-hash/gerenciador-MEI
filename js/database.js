/**
 * Módulo de Base de Dados (Firestore)
 * Implementa filtragem em memória para evitar erros de índice.
 */

const Database = {
    /**
     * Subscreve aos dados de uma coleção filtrando por utilizador
     * @param {string} collectionName - Nome da coleção (faturamentos, despesas, retiradas)
     * @param {string} userId - ID do utilizador logado
     * @param {function} callback - Função a executar quando os dados mudarem
     */
    subscribe(collectionName, userId, callback) {
        // IMPORTANTE: Pedimos a coleção básica sem orderBy ou where complexos 
        // para evitar a necessidade de criar índices compostos no console do Firebase.
        return db.collection(collectionName)
            .onSnapshot(snapshot => {
                const data = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    // Filtramos pelo utilizador aqui no cliente (em memória)
                    .filter(item => item.userId === userId)
                    // Ordenamos por data de forma decrescente
                    .sort((a, b) => new Date(b.data) - new Date(a.data));

                callback(data);
            }, error => {
                console.error(`Erro ao assinar ${collectionName}:`, error);
                UI.showToast("Erro ao sincronizar dados.");
            });
    },

    /**
     * Adiciona ou atualiza um item
     */
    async saveItem(collectionName, data, id = null) {
        try {
            if (id) {
                await db.collection(collectionName).doc(id).update(data);
                UI.showToast("Atualizado com sucesso!");
            } else {
                await db.collection(collectionName).add(data);
                UI.showToast("Guardado com sucesso!");
            }
            return true;
        } catch (error) {
            console.error("Erro ao guardar item:", error);
            UI.showToast("Erro ao guardar os dados.");
            return false;
        }
    },

    /**
     * Elimina um item e o seu anexo (se existir)
     */
    async deleteItem(collectionName, id, comprovanteUrl = '') {
        if (!confirm("Tem a certeza que deseja eliminar este registo?")) return;

        try {
            // Se houver imagem no Storage, tentamos eliminar
            if (comprovanteUrl && comprovanteUrl.includes('firebasestorage')) {
                try {
                    const fileRef = storage.refFromURL(comprovanteUrl);
                    await fileRef.delete();
                } catch (e) {
                    console.warn("Ficheiro não encontrado no storage ou erro ao eliminar.");
                }
            }

            await db.collection(collectionName).doc(id).delete();
            UI.showToast("Registo eliminado.");
        } catch (error) {
            console.error("Erro ao eliminar:", error);
            UI.showToast("Não foi possível eliminar o registo.");
        }
    },

    /**
     * Upload de imagem com compressão básica
     */
    async uploadFile(file, path) {
        if (!file) return null;
        
        try {
            const ref = storage.ref().child(path);
            const snapshot = await ref.put(file);
            return await snapshot.ref.getDownloadURL();
        } catch (error) {
            console.error("Erro no upload:", error);
            UI.showToast("Falha ao subir imagem.");
            return null;
        }
    }
};

window.Database = Database;
