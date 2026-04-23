const Database = {
    // Escuta mudanças no banco em tempo real
    subscribe(collection, userId, callback) {
        return firebase.firestore().collection(collection)
            .where("userId", "==", userId)
            .orderBy('data', 'desc')
            .onSnapshot(snap => {
                const docs = snap.docs.map(doc => ({ id: doc.id, type: collection, ...doc.data() }));
                callback(docs);
            });
    },

    async save(collection, data, userId, fileBlob = null) {
        let url = data.comprovanteUrl || "";

        // Se tiver imagem nova, faz upload primeiro
        if (fileBlob) {
            const ref = firebase.storage().ref().child(`comprovantes/${userId}/${Date.now()}.jpg`);
            const task = await ref.put(fileBlob);
            url = await task.ref.getDownloadURL();
        }

        const payload = {
            ...data,
            userId,
            comprovanteUrl: url,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (data.id) {
            const id = data.id;
            delete payload.id;
            return firebase.firestore().collection(collection).doc(id).update(payload);
        } else {
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            return firebase.firestore().collection(collection).add(payload);
        }
    },

    async delete(collection, id, imageUrl) {
        if (imageUrl) {
            try { await firebase.storage().refFromURL(imageUrl).delete(); } catch(e) {}
        }
        return firebase.firestore().collection(collection).doc(id).delete();
    }
};
