import numpy as np


def create_dict_scores(scores, ids_dict):
    paragraphs_scores = {}
    for key, value in ids_dict.items():
        score_aux = 0
        num_sentences = 0
        for id in value:
            num_sentences += 1
            score_aux += scores[int(id) - 1]

        score_paragraph = score_aux / num_sentences
        paragraphs_scores[key] = score_paragraph

    return paragraphs_scores


def get_paragraphs(paragraphs, paragraphs_scores):
    all_paragraphs = []
    for p in paragraphs:
        if str(p.id) in paragraphs_scores:
            all_paragraphs.append([p.text, paragraphs_scores[str(p.id)]])
        else:
            all_paragraphs.append([p.text])

    return all_paragraphs



