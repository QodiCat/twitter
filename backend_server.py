from flask import Flask, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

SAVE_PATH = 'D:\\saved_posts.json'

@app.route('/')
def index():
    return jsonify({'message': 'Social Post Extractor Backend is running!', 'endpoint': '/save_post'})

@app.route('/save_post', methods=['POST'])
def save_post():
    try:
        print(f"[DEBUG] Received request: {request.method}")
        print(f"[DEBUG] Content-Type: {request.content_type}")
        print(f"[DEBUG] Raw data: {request.get_data()}")
        
        data = request.get_json()
        print(f"[DEBUG] Parsed JSON: {data}")
        
        if not data:
            print("[DEBUG] No JSON data received")
            return jsonify({'error': 'No JSON data received'}), 400
        
        # Handle case where data is a list (from extension)
        if isinstance(data, list):
            if len(data) == 0:
                print("[DEBUG] Empty list received")
                return jsonify({'error': 'Empty data list received'}), 400
            # Take the first item if it's a list
            data = data[0] if len(data) > 0 else {}
            print(f"[DEBUG] Extracted from list: {data}")
        
        # Extract text from different possible structures
        text_content = ""
        platform = "unknown"
        
        if isinstance(data, dict):
            # Handle direct text field
            if 'text' in data:
                text_content = data['text']
                platform = data.get('platform', 'unknown')
            # Handle nested structure (like from extension post object)
            elif 'url' in data and isinstance(data, dict):
                # This might be a post object, extract what we can
                text_content = str(data)  # Convert the whole object to string as fallback
                platform = data.get('platform', 'twitter')
        else:
            text_content = str(data)
        
        if not text_content:
            print("[DEBUG] Missing text content")
            return jsonify({'error': 'No text content found'}), 400
            

        # Load existing data
        if os.path.exists(SAVE_PATH):
            with open(SAVE_PATH, 'r', encoding='utf-8') as f:
                posts = json.load(f)
        else:
            posts = []

        # Add new post with timestamp
        new_post = {
            'text': text_content,
            'timestamp': datetime.now().isoformat(),
            'platform': platform,
            'raw_data': data  # Keep original data for debugging
        }
        posts.append(new_post)
        print(f"[DEBUG] Saving post: {new_post}")

        # Save back to file
        with open(SAVE_PATH, 'w', encoding='utf-8') as f:
            json.dump(posts, f, ensure_ascii=False, indent=2)
        
        print(f"[DEBUG] Successfully saved to {SAVE_PATH}")
        return jsonify({'success': True, 'message': 'Post saved successfully'}), 200

    except Exception as e:
        print(f"[DEBUG] Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)