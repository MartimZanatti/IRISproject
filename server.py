from flask import Flask, request, send_file, jsonify, send_from_directory
from flask_cors import CORS
import os
import tempfile
from main_functions import process_docx_file, create_stanza_sentences, summarization, pos_processing_paragraphs

app = Flask(__name__)
CORS(app)
app.config['JSON_AS_ASCII']=False

@app.route('/', methods=["GET"])
@app.route('/<path:path>', methods=["GET"])
def send_report(path=None):
    if path is None:
        path = "index.html"
    return send_from_directory('static', path)

@app.route("/", methods=["POST"])
def handle_post():
    _, file_extension = os.path.splitext(request.files["file"].filename)
    uploaded_file = tempfile.NamedTemporaryFile(suffix=file_extension, delete=False)
    request.files["file"].save(uploaded_file)
    uploaded_file.flush()
    uploaded_file.close()

    #caixa preta
    json_paragraphs = []
    doc = process_docx_file(uploaded_file.name)
    doc = create_stanza_sentences(doc)
    scores, ids_dict = summarization(doc)
    paragraphs = pos_processing_paragraphs(doc.paragraphs, scores, ids_dict)

    for paragraph in paragraphs:
        if len(paragraph) == 1:
            json_paragraphs.append({"text": str(paragraph[0]), "score": None})
        else:
            json_paragraphs.append({"text": str(paragraph[0]), "score": paragraph[1]})

    os.unlink(uploaded_file.name)

    return jsonify(json_paragraphs)




if __name__ == '__main__':
    app.run(host='127.0.0.1',port=8999)
