from flask import Flask, render_template
from flask_cors import CORS
# Importem el Blueprint des de la ruta correcta
from app.routes.classification_routes import classification_bp

app = Flask(__name__, 
            static_folder='app/static', 
            template_folder='app/templates')

# Activem CORS per evitar errors de connexió des del JS
CORS(app)

# REGISTRE DEL BLUEPRINT (Això activa /api/img_predict)
app.register_blueprint(classification_bp, url_prefix='/api')

# Ruta principal: carrega el teu index.html
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    # Verificació de rutes: imprimirà totes les rutes disponibles al terminal al arrencar
    with app.app_context():
        print("\n=== RUTES REGISTRADES ===")
        for rule in app.url_map.iter_rules():
            print(f"Ruta: {rule.rule} --> Endpoint: {rule.endpoint}")
        print("=========================\n")
        
    app.run(debug=True, port=5000)