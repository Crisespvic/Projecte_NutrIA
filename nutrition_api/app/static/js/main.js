/**
 * Funció principal que s'executa en clicar el botó "Analitzar plat"
 */
async function analyzePlate() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];

    if (!file) {
        showToast('Selecciona una imatge primer', '⚠️');
        return;
    }

    // 1. UI: Preparar estat de càrrega
    const resultsEmpty = document.getElementById('results-empty');
    const resultsLoading = document.getElementById('results-loading');
    const resultsPanel = document.getElementById('results-panel');

    resultsEmpty.classList.add('hidden');
    resultsPanel.classList.add('hidden');
    resultsLoading.classList.remove('hidden');

    try {
        // 2. API: Cridar al servidor de Flask
        // Aquesta funció ha d'estar definida a api.js i apuntar a /api/img_predict
        const result = await apiAnalyzeImage(file);

        // 3. UI: Gestió de la resposta
        resultsLoading.classList.add('hidden');

        if (result && !result.error) {
            
            // CAS A: El model binari diu que NO és menjar
            if (result.is_food === false) {
                showToast(result.message || 'No es detecta menjar', '🚫');
                resultsEmpty.classList.remove('hidden');
                return;
            }

            // CAS B: És menjar però la confiança del classificador és baixa
            if (result.is_food === true && result.recognized === false) {
                showToast(result.message || 'Plat no reconegut', '❓');
                resultsEmpty.classList.remove('hidden');
                return;
            }

            // CAS C: Èxit total (És menjar i reconegut)
            if (result.is_food === true && result.recognized === true) {
                displayAnalysisResults(result); // result conté {plate, confidence}
                showToast(`Analitzat: ${result.plate}`, '🍴');
            }

        } else {
            // Error controlat des de l'API
            resultsEmpty.classList.remove('hidden');
            showToast(result?.error || 'Error en la connexió', '❌');
        }

        result = await apiAnalyzeImage(file);
        displayAnalysisResults(result);

    } catch (error) {
        // Error inesperat (Xarxa, etc.)
        console.error("Error en el procés d'anàlisi:", error);
        resultsLoading.classList.add('hidden');
        resultsEmpty.classList.remove('hidden');
        showToast('Error inesperat en l’anàlisi', '❌');

        console.error("DETALL DE L'ERROR:", error); // Afegeix aquesta línia
        showToast("Error: " + error.message, "error");
    }
}

/**
 * Inicialització del sistema quan es carrega el DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("NutriAI: Frontend actiu.");
    
    // Podries afegir aquí listeners globals si no vols fer-los per HTML
});