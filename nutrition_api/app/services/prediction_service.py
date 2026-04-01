import torch
import json
import io
import os
from PIL import Image
from torchvision import transforms
from app.utils.model_loader import load_efficientnet_v2_s

class PredictionService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # Ruta base per als models
        base_ml_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../ml_models"))
        # Ruta per a les dades d'ingredients (ajusta si la carpeta és diferent)
        base_data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../static/data"))

        # --- 1. MODELO BINARIO ---
        bin_path = os.path.join(base_ml_path, "Binari", "EfficientNetV2_binari_fase1_v2.pth")
        self.bin_model = load_efficientnet_v2_s(bin_path, 1, self.device)
        
        # --- 2. MODELO CLASIFICACIÓN ---
        clf_path = os.path.join(base_ml_path, "classification", "EfficientNetV2S_92x.pth")
        clf_json = os.path.join(base_ml_path, "classification", "class_names.json")
        with open(clf_json, 'r', encoding='utf-8') as f:
            self.clf_classes = json.load(f)
        self.clf_model = load_efficientnet_v2_s(clf_path, len(self.clf_classes), self.device)

        # --- 3. BASE DE DADES D'INGREDIENTS ---
        self.ingredients_db = self._load_ingredients_db(base_data_path)

        # --- 4. TRANSFORMACIONES ---
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

    def _load_ingredients_db(self, data_path):
        """Carrega el JSON d'ingredients i el converteix en un diccionari de cerca ràpida."""
        json_path = os.path.join(data_path, "ingredients.json")
        if not os.path.exists(json_path):
            print(f"⚠️ Alerta: No s'ha trobat {json_path}")
            return {}
        
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Creem un diccionari: { "apple_pie": [{name: "sugar", grams: 37.5}, ...], ... }
            return {item['dish']: item['ingredients'] for item in data['foods']}

    def predict(self, image_bytes, threshold_clf=0.70):
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img_t = self.transform(img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            # FASE 1: Binaria
            bin_output = self.bin_model(img_t)
            prob_food = torch.sigmoid(bin_output).item()

            if prob_food <= 0.5:
                return {
                    "is_food": False,
                    "message": "No se detecta comida en la imagen",
                    "confidence": round(1 - prob_food, 4)
                }

            # FASE 2: Clasificación
            clf_output = self.clf_model(img_t)
            clf_probs = torch.nn.functional.softmax(clf_output[0], dim=0)
            prob_clf, idx_clf = torch.max(clf_probs, 0)
            
            confidence = prob_clf.item()
            label = self.clf_classes[idx_clf.item()]

            if confidence < threshold_clf:
                return {
                    "is_food": True,
                    "recognized": False,
                    "message": "Plato no reconocido con suficiente certeza",
                    "confidence": round(confidence, 4)
                }

            # --- BUSCAR INGREDIENTS ---
            # Busquem si el plat detectat (label) està al nostre JSON
            ingredients = self.ingredients_db.get(label, [])

            return {
                "is_food": True,
                "recognized": True,
                "plate": label,
                "confidence": round(confidence, 4),
                "ingredients": ingredients # Enviem la llista al frontend
            }