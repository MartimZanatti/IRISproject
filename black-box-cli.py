import click
import json
from usage import usage_one_doc

@click.command()
@click.argument('filename', type=click.Path(exists=True))
@click.argument('file_extension')

def black_box(filename, file_extension):
    json_paragraphs = []
    considered_paragraphs, scores = usage_one_doc(filename, file_extension)

    for paragraph in considered_paragraphs:
        if len(paragraph) == 1:
            json_paragraphs.append({"text": str(paragraph[0]), "score": None})
        else:
            if paragraph[2] > 0:
                json_paragraphs.append({"text": str(paragraph[0]), "score": paragraph[2]})
            else:
                json_paragraphs.append({"text": str(paragraph[0]), "score": None})

    print(json.dumps(json_paragraphs))




if __name__ == "__main__":
    black_box()