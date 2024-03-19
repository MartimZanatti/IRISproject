import click
import json
from usage import usage_one_doc

@click.command()
@click.argument('filename', type=click.Path(exists=True))

def black_box(filename):
    json_paragraphs = []
    considered_paragraphs, scores = usage_one_doc(filename)

    for paragraph in considered_paragraphs:
        if len(paragraph) == 1:
            json_paragraphs.append({"text": str(paragraph[0]), "score": None})
        else:
            if paragraph[2] > 0:
                json_paragraphs.append({"text": str(paragraph[0]), "score": paragraph[2]})
            else:
                json_paragraphs.append({"text": str(paragraph[0]), "score": None})

    print(json.dumps(json_paragraphs))

    #for paragraph in best_paragraphs:

    """"
    #doc = process_docx_file(filename)
    #doc = create_stanza_sentences(doc)
    #scores, ids_dict = summarization(doc)
    #paragraphs = pos_processing_paragraphs(doc.paragraphs, scores, ids_dict)

    for paragraph in paragraphs:
        if len(paragraph) == 1:
            json_paragraphs.append({"text": str(paragraph[0]), "score": None})
        else:
            json_paragraphs.append({"text": str(paragraph[0]), "score": paragraph[1]})
    
    print(json.dumps(json_paragraphs))
    """
if __name__ == "__main__":
    black_box()