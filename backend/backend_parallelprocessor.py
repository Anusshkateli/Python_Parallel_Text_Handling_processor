from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import os
import pandas as pd
from datetime import datetime
import sqlite3
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import json
import io
import re

# Import your text analyzer 
# (Make sure backend_text_analysis.py is in the same folder!)
try:
    from backend_text_analysis import TextAnalyzer
except ImportError:
    # Fallback if the file is missing during testing
    class TextAnalyzer:
        def summarize(self, t, **p): return t[:100] + "..."
        def analyze_sentiment(self, t): return "Neutral"
        def convert_case(self, t, **p): return t.upper()
        def spell_check(self, t): return t
        def remove_stop_words(self, t): return t
        def extract_keywords(self, t, **p): return "keyword1, keyword2"

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
DATABASE_PATH = 'text_storage.db'
ALLOWED_EXTENSIONS = {'csv', 'txt'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

# ========== DATABASE INITIALIZATION ==========

def init_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    # Table for Processing History
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS processing_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT, operation TEXT, records_processed INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, output_file TEXT
        )
    ''')
    # Table for Users (For your Login/Signup)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, email TEXT UNIQUE, password TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# ========== AUTHENTICATION ROUTES ==========

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    name = data.get("full_name")
    hashed_pw = generate_password_hash(password)
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", (name, email, hashed_pw))
        conn.commit()
        conn.close()
        return jsonify({"message": "Account created"}), 201
    except:
        return jsonify({"message": "User already exists"}), 400

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    if user and check_password_hash(user[0], password):
        return jsonify({"message": "Login successful", "user": email}), 200
    return jsonify({"message": "Invalid credentials"}), 401

# ========== DASHBOARD ANALYZE ROUTE ==========

@app.route('/api/analyze', methods=['POST'])
def analyze_dashboard():
    """Route for the 'Run All Parallel' button on your dashboard"""
    try:
        data = request.json
        raw_text = data.get('text', '')
        operations = data.get('operations', [])
        
        # Smart Cleaning (If user pasted CSV text)
        processed_text = raw_text
        if raw_text.strip().startswith("id,"):
            f = io.StringIO(raw_text.strip())
            df_temp = pd.read_csv(f)
            # Try to find a content column
            col = next((c for c in ['answer', 'question', 'text', 'content'] if c in df_temp.columns), None)
            if col:
                processed_text = " ".join(df_temp[col].astype(str).tolist())

        analyzer = TextAnalyzer()
        results = []

        for op_id in operations:
            # Match the IDs from your frontend operationsList
            res_body = ""
            if op_id == "Summarization": res_body = analyzer.summarize(processed_text)
            elif op_id == "Sentiment Analysis": res_body = analyzer.analyze_sentiment(processed_text)
            elif op_id == "Convert Case": res_body = processed_text.upper()
            elif op_id == "Keyword Extraction": res_body = analyzer.extract_keywords(processed_text)
            elif op_id == "Spell Check": res_body = analyzer.spell_check(processed_text)
            elif op_id == "Remove Stop Words": res_body = analyzer.remove_stop_words(processed_text)
            else: res_body = f"Processed {op_id}"

            results.append({"title": op_id, "output": res_body, "success": True})
        
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ========== REPORT EXPORT ROUTE ==========

@app.route("/api/export", methods=["POST"])
def export_report():
    data = request.json
    results = data.get("results", [])
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Operation", "Output"])
    for res in results:
        writer.writerow([res['title'], res['output']])
    return Response(output.getvalue(), mimetype="text/csv", headers={"Content-disposition": "attachment; filename=report.csv"})

# ========== KEEP YOUR ORIGINAL CSV ROUTES BELOW ==========

@app.route('/api/process-text', methods=['POST'])
def process_single_text():
    # ... (Your original code for this route)
    return jsonify({"status": "success"}) # Placeholder for brevity

# (Keep all your other /api/upload-csv, /api/process-csv etc. here)

# ========== RUN SERVER ==========

if __name__ == '__main__':
    print("=" * 50)
    print("TextFlow Pro API Server Starting on Port 5001")
    print("=" * 50)
    # Changed port to 5001 to match your frontend fix
    app.run(debug=True, host='0.0.0.0', port=5001)