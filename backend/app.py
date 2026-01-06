from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import io
import csv
import re
import sqlite3 # 1. Import SQLite
from textblob import TextBlob

app = Flask(__name__)
CORS(app)

# --- 2. DATABASE SETUP ---
DB_FILE = "users.db"

def init_db():
    """Creates the database and the users table if they don't exist."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT
        )
    ''')
    conn.commit()
    conn.close()

# Initialize the database when the script starts
init_db()

# --- AUTHENTICATION ROUTES (UPDATED FOR DATABASE) ---

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    name = data.get("full_name")

    hashed_pw = generate_password_hash(password)

    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", (name, email, hashed_pw))
        conn.commit()
        conn.close()
        return jsonify({"message": "Account created successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"message": "User already exists"}), 400

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # Find user by email
    cursor.execute("SELECT email, password FROM users WHERE email = ?", (email,))
    user = cursor.fetchone() # returns (email, password) or None
    conn.close()

    if user and check_password_hash(user[1], password):
        return jsonify({"message": "Login successful", "user": email}), 200
    
    return jsonify({"message": "Invalid email or password"}), 401

# --- TEXT ANALYSIS ROUTE (SAME AS BEFORE) ---

@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.json
    raw_text = data.get("text", "")
    operations = data.get("operations", [])
    
    processed_text = raw_text
    if raw_text.strip().startswith("id,"):
        try:
            f = io.StringIO(raw_text.strip())
            reader = csv.DictReader(f)
            rows = [row.get('answer') or row.get('question') or row.get('content') or "" for row in reader]
            processed_text = " ".join(rows)
        except:
            pass

    results = []
    for op in operations:
        output = ""
        try:
            if op == "Summarization":
                sentences = processed_text.split('.')
                output = '.'.join(sentences[:2]) + "..." if len(sentences) > 2 else processed_text
            elif op == "Sentiment Analysis":
                pol = TextBlob(processed_text).sentiment.polarity
                output = "Positive 😊" if pol > 0.1 else "Negative 😠" if pol < -0.1 else "Neutral 😐"
            elif op == "Convert Case":
                output = processed_text.upper()
            elif op == "Grammar Correction" or op == "Spell Check":
                output = str(TextBlob(processed_text).correct())
            else:
                output = f"Processed {op} successfully."
        except Exception as e:
            output = f"Error: {str(e)}"

        results.append({"title": op, "output": output, "success": True})

    return jsonify({"results": results})

@app.route("/api/export", methods=["POST"])
def export_report():
    data = request.json
    results = data.get("results", [])
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Operation", "Processed Output"])
    for res in results:
        writer.writerow([res['title'], res['output']])
    return Response(output.getvalue(), mimetype="text/csv", headers={"Content-disposition": "attachment; filename=report.csv"})

if __name__ == "__main__":
    print("Backend running on http://127.0.0.1:5500") # Changed 5000 to 5500
    app.run(debug=True, port=5500)