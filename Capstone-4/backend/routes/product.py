from flask import Blueprint, jsonify, request
from psycopg2.extras import RealDictCursor
from database import get_connection

products = Blueprint("products", __name__)


@products.route("/", methods=["GET"])
def get_products():
    conn = cur = None
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM products ORDER BY id")
        rows = cur.fetchall()
        return jsonify([dict(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@products.route("/count", methods=["GET"])
def count_products():
    conn = cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM products")
        (count,) = cur.fetchone()
        return jsonify({"count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@products.route("/", methods=["POST"])
def create_product():
    conn = cur = None
    try:
        data = request.get_json()
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "INSERT INTO products (name, price, quantity) VALUES (%s, %s, %s) RETURNING *",
            (data["name"], data["price"], data["quantity"])
        )
        product = cur.fetchone()
        conn.commit()
        return jsonify(dict(product)), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()


@products.route("/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    conn = cur = None
    try:
        data = request.get_json()
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "UPDATE products SET name=%s, price=%s, quantity=%s WHERE id=%s RETURNING *",
            (data["name"], data["price"], data["quantity"], product_id)
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
        if cur: cur.close()
        if conn: conn.close()


@products.route("/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    conn = cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM products WHERE id=%s", (product_id,))
        conn.commit()
        return jsonify({"message": "deleted"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()
