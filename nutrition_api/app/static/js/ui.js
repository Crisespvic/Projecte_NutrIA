// --- GESTIÓ DE FITXERS (Selecció i Drag & Drop) ---

/**
 * S'executa quan l'usuari selecciona un fitxer des de l'input hidden
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) loadPreview(file);
}

/**
 * Gestiona quan s'arrossega un fitxer sobre la zona de drop
 */
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('drop-zone').classList.add('border-brand-500', 'bg-surface-3');
}

/**
 * Gestiona quan el fitxer surt de la zona de drop
 */
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('drop-zone').classList.remove('border-brand-500', 'bg-surface-3');
}

/**
 * Gestiona quan es deixa anar el fitxer
 */
function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('drop-zone').classList.remove('border-brand-500', 'bg-surface-3');
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        // Assignem el fitxer arrossegat a l'input hidden perquè analyzePlate el trobi
        document.getElementById('file-input').files = event.dataTransfer.files;
        loadPreview(file);
    } else {
        showToast('Només es permeten imatges', '⚠️');
    }
}

/**
 * Mostra la miniatura de la imatge i activa el botó d'analitzar
 */
function loadPreview(file) {
    const reader = new FileReader();
    reader.onload = ev => {
        const img = document.getElementById('preview-img');
        img.src = ev.target.result;
        img.classList.remove('hidden');
        
        // UI Changes
        document.getElementById('dz-content').classList.add('hidden');
        document.getElementById('analyze-btn').classList.remove('hidden');
        document.getElementById('results-empty').classList.remove('hidden');
        document.getElementById('results-panel').classList.add('hidden'); // Amaguem resultats previs
    };
    reader.readAsDataURL(file);
}

// --- RENDERITZAT DE RESULTATS ---

/**
 * Omple el panell de resultats amb la resposta de la IA
 */
function displayAnalysisResults(result) {
    console.log("Dades rebudes per a la UI:", result);

    // Funció segura per modificar elements (evita errors si un ID no existeix)
    const safeSet = (id, callback) => {
        const el = document.getElementById(id);
        if (el) callback(el);
    };

    // 1. Nom del plat i Confiança
    safeSet('result-dish', el => {
        const name = result.plate || "Plat no reconegut";
        const formatted = name.replace(/_/g, ' ');
        el.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    });

    safeSet('result-confidence', el => {
        el.textContent = result.confidence ? (result.confidence * 100).toFixed(1) + '%' : '';
    });

    // 2. Macros (Calories, proteïnes, carb, fat)
    if (result.macros) {
        safeSet('r-cal', el => el.textContent = Math.round(result.macros.calories));
        safeSet('r-prot', el => el.textContent = result.macros.protein.toFixed(1) + 'g');
        safeSet('r-carb', el => el.textContent = result.macros.carb.toFixed(1) + 'g');
        safeSet('r-fat', el => el.textContent = result.macros.fat.toFixed(1) + 'g');

        // Animar barres de progrés
        const total = result.macros.protein + result.macros.carb + result.macros.fat;
        if (total > 0) {
            safeSet('bar-prot', el => el.style.width = `${(result.macros.protein / total) * 100}%`);
            safeSet('bar-carb', el => el.style.width = `${(result.macros.carb / total) * 100}%`);
            safeSet('bar-fat', el => el.style.width = `${(result.macros.fat / total) * 100}%`);
        }
    }

    // 3. Llista d'Ingredients i Massa Total
    const listContainer = document.getElementById('ingredients-list');
    if (listContainer) {
        listContainer.innerHTML = '';
        let totalMass = 0;

        if (result.ingredients && result.ingredients.length > 0) {
            result.ingredients.forEach(ing => {
                totalMass += ing.grams;
                const div = document.createElement('div');
                div.className = "flex justify-between items-center py-2 border-b border-surface-border last:border-0";
                div.innerHTML = `
                    <span class="text-sm text-slate-300 capitalize">${ing.name.toLowerCase()}</span>
                    <span class="text-xs font-bold text-brand-400">${ing.grams}g</span>
                `;
                listContainer.appendChild(div);
            });
            safeSet('r-mass', el => el.textContent = Math.round(totalMass));
        }
    }

    // 4. Gestió d'estats de la interfície (IDs corregits segons el teu HTML)
    safeSet('results-loading', el => el.classList.add('hidden')); // Amaguem el loader
    safeSet('results-empty', el => el.classList.add('hidden'));   // Amaguem l'estat buit
    safeSet('results-panel', el => el.classList.remove('hidden')); // Mostrem el panell de resultats
}

// --- GESTIÓ DE PÀGINES I MENÚ ---

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');
    document.getElementById('mobile-menu').classList.add('hidden');
    
    if (pageId === 'planning' && typeof renderCalendar === 'function') {
        renderCalendar();
    }
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

// --- GESTIÓ DE LA CÀMERA ---

function openCamera() {
    const overlay = document.getElementById('camera-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    
    const video = document.getElementById('scan-video');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            window.localStream = stream;
            video.srcObject = stream;
        })
        .catch(err => {
            console.error("Error càmera:", err);
            showToast("No s'ha pogut accedir a la càmera", '❌');
            closeCamera();
        });
}

function takePhoto() {
    const video = document.getElementById('scan-video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(blob => {
        const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        document.getElementById('file-input').files = dataTransfer.files;
        
        loadPreview(file);
        closeCamera();
    }, 'image/jpeg');
}

function closeCamera() {
    const overlay = document.getElementById('camera-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
    }
}

// --- TOAST NOTIFICACIONS ---
let toastTimer;
function showToast(msg, icon = '✓') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toast-msg').textContent = msg;
    document.getElementById('toast-icon').textContent = icon;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}