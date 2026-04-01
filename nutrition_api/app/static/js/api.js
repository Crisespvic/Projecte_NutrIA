/**
 * Envia la imatge al servidor Flask per a ser analitzada per EfficientNet
 */
async function apiAnalyzeImage(imageFile) {
    const formData = new FormData();
    
    // IMPORTANTE: La clave debe ser 'file' para coincidir con request.files['file'] en Flask
    formData.append('file', imageFile);

    try {
        // Asegúrate de que esta URL sea la misma que definiste en classification_routes.py
        // Si en Flask pusiste @classification_bp.route('/classify', ...) 
        // y el prefix del blueprint es '/api/food', esta ruta es correcta.
        const response = await fetch('/api/img_predict', {
            method: 'POST',
            body: formData
            // Nota: No pongas Content-Type manual, el navegador lo hace solo al usar FormData
        });

        if (!response.ok) {
            throw new Error(`Error en el servidor: ${response.status}`);
        }

        const result = await response.json();
        return result; // Aquí recibirás el JSON con {is_food: true, plate: "...", ...}

    } catch (error) {
        console.error("Error en l'anàlisi:", error);
        return { error: "No se pudo conectar con el servidor" };
    }
}

/**
 * Autenticació amb contrasenya o rostre
 */
async function apiLogin(username, password, faceImage = null) {
    // Aquí anirà la crida a /login o /login-face
    return { success: true, user: { name: username } };
}

/**
 * Guarda un àpat al calendari de MongoDB
 */
async function apiSaveMeal(mealData) {
    // Aquí anirà la crida a /history/add
    return { success: true };
}