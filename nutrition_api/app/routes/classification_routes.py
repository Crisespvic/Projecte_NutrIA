from flask import Blueprint, request, jsonify
from app.services.prediction_service import PredictionService
import traceback  # Importa això per veure l'error detallat

classification_bp = Blueprint('classification', __name__)
prediction_service = PredictionService()

@classification_bp.route('/img_predict', methods=['POST'])
def handle_prediction():
    if 'file' not in request.files:
        return jsonify({"error": "No se recibió ninguna imagen"}), 400
    
    file = request.files['file']
    try:
        img_bytes = file.read()
        # Nota: Hem de passar 'threshold_clf' si el teu PredictionService 
        # fa servir aquest nom de variable al mètode predict.
        result = prediction_service.predict(img_bytes, threshold_clf=0.75)
        return jsonify(result), 200
    except Exception as e:
        # AQUESTES LÍNIES SÓN CRÍTIQUES PER TROBAR L'ERROR:
        print("\n" + "="*50)
        print(f"❌ ERROR EN EL SERVIDOR (500): {str(e)}")
        traceback.print_exc()  # Això imprimirà la línia exacta del fallo al terminal
        print("="*50 + "\n")
        
        return jsonify({"error": str(e)}), 500