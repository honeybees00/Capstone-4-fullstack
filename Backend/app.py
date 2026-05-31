import os
import json
import urllib.request
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from database import init_db
from routes.product import products

app = Flask(__name__, static_url_path="/static", static_folder="static")
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)

app.register_blueprint(products, url_prefix="/products")

init_db()


@app.route("/api")
def health():
    return jsonify({"message": "server online"})


@app.route("/api/bot", methods=["GET"])
def bot_proxy():
    from database import get_connection
    from psycopg2.extras import RealDictCursor

    message = request.args.get("message", "").strip()

    try:
        conn = get_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM products ORDER BY id")
        products_list = [
            {**dict(r), "price": float(r["price"])}
            for r in cur.fetchall()
        ]
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({"reply": f"Could not reach the database: {str(e)}"}), 502

    count = len(products_list)
    q     = message.lower()
    reply = ""

    if not q or any(w in q for w in ["how many", "count", "total", "number of"]):
        reply = f"We currently have {count} product{'s' if count != 1 else ''} in the catalog."

    elif any(w in q for w in ["list", "show", "all product", "catalog"]):
        if count == 0:
            reply = "The product catalog is currently empty."
        else:
            lines = "\n".join(
                f"• {p['name']} — ${p['price']:.2f} (qty: {p['quantity']})"
                for p in products_list
            )
            reply = f"Here are all {count} products:\n\n{lines}"

    elif any(w in q for w in ["expensive", "cheap", "price", "cost"]):
        if count == 0:
            reply = "The catalog is empty — no pricing data yet."
        else:
            top   = sorted(products_list, key=lambda p: p["price"], reverse=True)[:5]
            lines = "\n".join(f"• {p['name']}: ${p['price']:.2f}" for p in top)
            reply = f"Top {len(top)} most expensive products:\n\n{lines}"

    elif any(w in q for w in ["discontinued", "discontinue"]):
        disc = [p for p in products_list if p.get("discontinued")]
        if not disc:
            reply = "No products are currently marked as discontinued."
        else:
            lines = "\n".join(f"• {p['name']}" for p in disc)
            reply = f"{len(disc)} discontinued product{'s' if len(disc) != 1 else ''}:\n\n{lines}"

    elif any(w in q for w in ["stock", "inventory", "quantity", "low"]):
        low = [p for p in products_list if p["quantity"] < 10]
        if not low:
            reply = f"All {count} products are well-stocked (10+ units each)."
        else:
            lines = "\n".join(
                f"• {p['name']}: {p['quantity']} unit{'s' if p['quantity'] != 1 else ''} remaining"
                for p in low
            )
            reply = f"{len(low)} product{'s are' if len(low) > 1 else ' is'} running low:\n\n{lines}"

    elif any(w in q for w in ["find", "search", "look for"]):
        import re
        term  = re.sub(r"find|search|look for", "", q).strip()
        found = [p for p in products_list if term in p["name"].lower()]
        if not found:
            reply = f'No products matching "{term}" were found.'
        else:
            lines = "\n".join(
                f"• {p['name']} — ${p['price']:.2f} (qty: {p['quantity']})"
                for p in found
            )
            reply = f"Found {len(found)} matching product{'s' if len(found) != 1 else ''}:\n\n{lines}"

    else:
        reply = (
            f"I'm your inventory assistant! We have {count} product{'s' if count != 1 else ''} in stock.\n\n"
            "Try asking me:\n"
            "• \"How many products do we have?\"\n"
            "• \"List all products\"\n"
            "• \"Which products are low on stock?\"\n"
            "• \"Show the most expensive products\"\n"
            "• \"Find wireless\""
        )

    return jsonify({"reply": reply})


@app.route("/assets/<path:filename>")
def serve_assets(filename):
    return app.send_static_file(f"assets/{filename}")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    template_path = os.path.join(app.root_path, "templates", "index.html")
    if not os.path.exists(template_path):
        return jsonify({"message": "React build not deployed yet"}), 200
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
