import click
from main_functions import process_docx_file, create_stanza_sentences, summarization, pos_processing_paragraphs
import json

@click.command()
@click.argument('filename', type=click.Path(exists=True))
def black_box(filename):
    json_paragraphs = []
    doc = process_docx_file(filename)
    doc = create_stanza_sentences(doc)
    scores, ids_dict = summarization(doc)
    paragraphs = pos_processing_paragraphs(doc.paragraphs, scores, ids_dict)

    for paragraph in paragraphs:
        if len(paragraph) == 1:
            json_paragraphs.append({"text": str(paragraph[0]), "score": None})
        else:
            json_paragraphs.append({"text": str(paragraph[0]), "score": paragraph[1]})

if __name__ == "__main__":
    black_box()