from flask import Blueprint, jsonify, request
from psycopg2.extras import RealDictCursor
from database import get_connection

products = Blueprint("products", __name__)


def validate_product(data):
    if not data:
        return "Request body is required."
    name = (data.get("name") or "").strip()
    if not name:
        return "Product name is required."
    if len(name) > 100:
        return "Name must be 100 characters or fewer."
    try:
        price = float(data.get("price"))
        if price < 0:
            return "Price cannot be negative."
    except (TypeError, ValueError):
        return "A valid price is required."
    try:
        qty = int(data.get("quantity"))
        if qty < 0:
            return "Quantity cannot be negative."
    except (TypeError, ValueError):
        return "A valid quantity is required."
    return None


@products.route("/", methods=["GET"])
def get_products():
    conn = cur = None
    try:
        conn = get_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM products ORDER BY id")
        rows = cur.fetchall()
        return jsonify([dict(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:  cur.close()
        if conn: conn.close()


@products.route("/count", methods=["GET"])
def count_products():
    conn = cur = None
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM products")
        (count,) = cur.fetchone()
        return jsonify({"count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:  cur.close()
        if conn: conn.close()


@products.route("/", methods=["POST"])
def create_product():
    conn = cur = None
    data = request.get_json(silent=True)
    err  = validate_product(data)
    if err:
        return jsonify({"error": err}), 400
    try:
        conn = get_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        discontinued = bool(data.get("discontinued", False))
        cur.execute(
            "INSERT INTO products (name, price, quantity, discontinued) VALUES (%s, %s, %s, %s) RETURNING *",
            (data["name"].strip(), round(float(data["price"]), 2), int(data["quantity"]), discontinued)
        )
        product = cur.fetchone()
        conn.commit()
        return jsonify(dict(product)), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:  cur.close()
        if conn: conn.close()


@products.route("/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    conn = cur = None
    data = request.get_json(silent=True)
    err  = validate_product(data)
    if err:
        return jsonify({"error": err}), 400
    try:
        conn = get_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        discontinued = bool(data.get("discontinued", False))
        cur.execute(
            "UPDATE products SET name=%s, price=%s, quantity=%s, discontinued=%s WHERE id=%s RETURNING *",
            (data["name"].strip(), round(float(data["price"]), 2), int(data["quantity"]), discontinued, product_id)
        )
        product = cur.fetchone()
        if not product:
            return jsonify({"error": "Product not found"}), 404
        conn.commit()
        return jsonify(dict(product)), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:  cur.close()
        if conn: conn.close()


@products.route("/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    conn = cur = None
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute("DELETE FROM products WHERE id=%s RETURNING id", (product_id,))
        deleted = cur.fetchone()
        if not deleted:
            return jsonify({"error": "Product not found"}), 404
        conn.commit()
        return jsonify({"message": "Product deleted successfully"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:  cur.close()
        if conn: conn.close()
