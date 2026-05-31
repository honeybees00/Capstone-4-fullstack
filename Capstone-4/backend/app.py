import os
from flask import Flask, jsonify, render_template
from flask_cors import CORS
from database import init_db
from routes.product import products

app = Flask(__name__, static_url_path="", static_folder="static")
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)

app.register_blueprint(products, url_prefix="/products")

# init_db at module level so gunicorn also runs it
init_db()


@app.route("/api")
def health():
    return jsonify({"message": "server online"})


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    template_path = os.path.join(app.root_path, "templates", "index.html")
    if not os.path.exists(template_path):
        return jsonify({"message": "React build not deployed yet"}), 200
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
