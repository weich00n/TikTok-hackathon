from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({'message': 'Hello from Flask backend!'})

@app.route('/api/data', methods=['POST'])
def receive_data():
    data = request.json
    # Process data here
    return jsonify({'received': data}), 201

if __name__ == '__main__':
    app.run(debug=True)