import torch
import torch.nn as nn
from torchvision import models

def load_efficientnet_v2_s(model_path, num_classes, device):
    model = models.efficientnet_v2_s(weights=None)
    num_ftrs = model.classifier[1].in_features
    
    if num_classes == 1:
        # Estructura para el modelo BINARIO (según tu código de entrenamiento)
        model.classifier[1] = nn.Linear(num_ftrs, 1)
    else:
        # Estructura para el modelo CLASIFICADOR (según tu script de test)
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(num_ftrs, num_classes)
        )
    
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    return model